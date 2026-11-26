"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, ChartNoAxesCombined, ChevronDown, LayoutDashboard, LogOut, ReceiptText,
  Settings, Shapes, UsersRound, UtensilsCrossed, X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useWorkspace } from "@/components/workspace-provider";
import { hasWorkspaceAccess } from "@/lib/workspace-access";
import { signOut } from "@/lib/workspace-client";
import profileStyles from "./workspace-profile.module.css";

type Styles = Record<string, string>;

export function WorkspaceNavigation({
  styles, current, open, onClose,
}: {
  styles: Styles;
  current: string;
  open: boolean;
  onClose: () => void;
}) {
  const { role, business } = useWorkspace();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      opener?.focus();
    };
  }, [open, onClose]);

  const navigation = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Categories", href: "/categories", icon: Shapes },
    { label: "Foods", href: "/foods", icon: UtensilsCrossed },
    { label: "Billing", href: "/billing", icon: ReceiptText },
    { label: "Today's bills", href: "/bills", icon: CalendarDays },
    { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
    { label: "Employees", href: "/users", icon: UsersRound },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return <>
    {open && <button className={`${styles.scrim} ${styles.scrimVisible}`} type="button" aria-label="Close navigation" tabIndex={-1} onClick={onClose} />}
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} data-workspace-menu={open ? "open" : "closed"}>
      <div className={styles.brandRow}>
        <BrandMark className={styles.brandMark} size="sidebar" />
        <div className={styles.brandCopy}><strong>BILLORA</strong></div>
        <button className={styles.closeMenu} type="button" aria-label="Close menu" onClick={onClose} ref={closeButton}><X aria-hidden="true" /></button>
      </div>
      <nav className={styles.nav} aria-label="Main navigation">
        <span className={styles.navLabel}>Workspace</span>
        {navigation.filter(({ href }) => hasWorkspaceAccess(role, href)).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} title={label} aria-label={label} aria-current={current === href ? "page" : undefined} className={`${styles.navItem} ${current === href ? styles.navItemActive : ""}`} onClick={onClose}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.storeStatus}><i className={styles.statusDot} /><span><strong title={business.name}>{business.name}</strong><small>Workspace</small></span></div>
        <SignOutButton className={styles.logoutButton ?? styles.navItem} />
      </div>
    </aside>
  </>;
}

export function WorkspaceProfile({ styles }: { styles: Styles }) {
  const { account, role } = useWorkspace();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const exitLink = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    exitLink.current?.focus();

    function dismissOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [open]);

  return (
    <div className={`${styles.profileArea} ${profileStyles.root}`} ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key !== "Escape" || !open) return;
      event.stopPropagation();
      button.current?.focus();
      setOpen(false);
    }}>
      <button
        type="button"
        ref={button}
        className={profileStyles.trigger}
        title="Account menu"
        aria-label={`Account menu, ${account.name}, ${role.name}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={profileStyles.avatar} aria-hidden="true">{initials(account.name)}</span>
        <span className={profileStyles.identity}><strong>{account.name}</strong><small>{role.name}</small></span>
        <ChevronDown className={profileStyles.chevrons} aria-hidden="true" />
      </button>

      {open && <section className={profileStyles.picker} id={panelId} aria-label="Account options">
        <div className={profileStyles.pickerHeader}>
          <h2>Account</h2><span>{account.email}</span>
        </div>
        <SignOutButton buttonRef={exitLink} className={profileStyles.signOut} />
      </section>}
    </div>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function SignOutButton({ className, buttonRef }: { className: string; buttonRef?: React.Ref<HTMLButtonElement> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function exit() {
    setError("");
    setPending(true);
    try { await signOut(); }
    catch { setError("Couldn’t sign out. Try again."); setPending(false); }
  }
  return <>
    <button type="button" ref={buttonRef} className={className} disabled={pending} onClick={exit} title="Sign out">
      <LogOut aria-hidden="true" /><span>{pending ? "Signing out…" : "Sign out"}</span>
    </button>
    {error && <p role="alert" className="p-2 text-sm">{error}</p>}
  </>;
}
