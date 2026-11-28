"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { currencyFormatter } from "@/data/business-profile";
import type { Bill, Permission } from "@/data/workspace";
import { can, hasWorkspaceAccess, workspaceHome } from "@/lib/workspace-access";
import { api, post, RequestError, signOut } from "@/lib/workspace-client";
import type { WorkspaceAction, WorkspaceSnapshot } from "@/lib/workspace-commands";

type Workspace = WorkspaceSnapshot & {
  perform: (action: WorkspaceAction) => Promise<Bill | undefined>;
  allows: (...permissions: Permission[]) => boolean;
  owner: boolean;
  revision: number;
  money: Intl.NumberFormat;
  billTime: Intl.DateTimeFormat;
  businessDate: Intl.DateTimeFormat;
};

const WorkspaceContext = createContext<Workspace | null>(null);
const workspaceRoute = /^\/(dashboard|categories|foods|billing|bills|reports|users|settings)(\/|$)/;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  return workspaceRoute.test(path) ? <ConnectedWorkspace path={path}>{children}</ConnectedWorkspace> : children;
}

function ConnectedWorkspace({ path, children }: { path: string; children: ReactNode }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>();
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [revision, setRevision] = useState(0);
  const requestNumber = useRef(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const current = ++requestNumber.current;
    try {
      const next = await api<WorkspaceSnapshot>("/api/workspace", { signal });
      if (signal?.aborted || current !== requestNumber.current) return;
      setSnapshot(next);
      setRevision((value) => value + 1);
      setUnavailable(false);
      setError("");
    } catch (failure) {
      if (signal?.aborted || current !== requestNumber.current) return;
      if (failure instanceof RequestError && [401, 403].includes(failure.status)) {
        setSnapshot(undefined);
        setUnavailable(failure.status === 403);
        if (failure.status === 401) router.replace("/signin");
      }
      setError(failure instanceof Error ? failure.message : "Couldn’t load the workspace.");
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    function refreshVisible() {
      if (document.visibilityState === "visible") void refresh(controller.signal);
    }
    const initial = window.setTimeout(() => void refresh(controller.signal), 0);
    const interval = window.setInterval(refreshVisible, 30000);
    window.addEventListener("focus", refreshVisible);
    return () => {
      controller.abort();
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
    };
  }, [path, refresh]);

  const perform = useCallback(async (action: WorkspaceAction) => {
    try {
      const { bill } = await post<{ bill?: Bill }>("/api/workspace", action);
      await refresh();
      return bill;
    } catch (failure) {
      if (failure instanceof RequestError && [401, 403].includes(failure.status)) await refresh();
      throw failure;
    }
  }, [refresh]);

  const currency = snapshot?.business.currency ?? "INR";
  const timeZone = snapshot?.business.timeZone ?? "Asia/Kolkata";
  const formatters = useMemo(() => ({
    money: currencyFormatter(currency),
    billTime: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone }),
    businessDate: new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }),
  }), [currency, timeZone]);

  if (!snapshot) return <WorkspaceStatus message={error || "Loading your workspace…"} retry={error ? () => void refresh() : undefined} exit={unavailable} />;

  if (!hasWorkspaceAccess(snapshot.role, path)) {
    const home = workspaceHome(snapshot.role);
    return <WorkspaceStatus message={home ? "Your role cannot open this page." : "Ask your workspace owner to assign permissions."}
      home={home} exit />;
  }

  const value: Workspace = {
    ...snapshot, ...formatters, revision, perform, owner: snapshot.role.id === "manager",
    allows: (...permissions) => can(snapshot.role, ...permissions),
  };
  return <WorkspaceContext.Provider value={value}>
    {error && <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-950" role="alert">
      Workspace data may be out of date. <button type="button" className="underline" onClick={() => void refresh()}>Try again</button>
    </div>}
    {children}
  </WorkspaceContext.Provider>;
}

function WorkspaceStatus({ message, retry, home, exit }: { message: string; retry?: () => void; home?: string; exit?: boolean }) {
  const [error, setError] = useState("");
  return <main className="grid min-h-dvh place-items-center px-6">
    <div className="grid max-w-sm justify-items-center gap-4 text-center">
      <BrandMark />
      <p role="status">{message}</p>
      {home && <Button asChild><Link href={home}>Open workspace</Link></Button>}
      {retry && <Button type="button" onClick={retry}>Try again</Button>}
      {exit && <Button type="button" variant="outline" onClick={() => void signOut().catch(() => setError("Couldn’t sign out. Try again."))}>Sign out</Button>}
      {error && <p role="alert">{error}</p>}
    </div>
  </main>;
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("A workspace provider is required.");
  return workspace;
}

export function useWorkspaceResource<T>(url: string): { data?: T; error?: string } {
  const { revision } = useWorkspace();
  const [result, setResult] = useState<{ url: string; data?: T; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    void api<T>(url, { signal: controller.signal }).then(
      (data) => setResult({ url, data }),
      (failure: Error) => {
        if (!controller.signal.aborted) setResult((previous) => ({
          url,
          data: previous?.url === url && !(failure instanceof RequestError && [401, 403].includes(failure.status))
            ? previous.data : undefined,
          error: failure.message,
        }));
      },
    );
    return () => controller.abort();
  }, [url, revision]);
  return result?.url === url ? result : {};
}
