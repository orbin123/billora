"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { post, RequestError, signOut } from "@/lib/workspace-client";

function SetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function setup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const result = await post<{ next: string }>("/api/auth", invite ? { kind: "setup", invite } : {
        kind: "setup", name: values.get("name"), business: values.get("business"),
      });
      router.replace(result.next);
    } catch (failure) {
      if (failure instanceof RequestError && failure.status === 401) {
        router.replace(invite ? `/signin?invite=${encodeURIComponent(invite)}` : "/signin");
      } else setError(failure instanceof Error ? failure.message : "Couldn’t set up your workspace.");
    } finally {
      setPending(false);
    }
  }

  return <main className="grid min-h-dvh place-items-center bg-[#f4f7f5] px-4 py-8">
    <section className="w-full max-w-md rounded-2xl border border-[#dce5e0] bg-white p-6 sm:p-8">
      <BrandMark />
      <h1 className="mt-5 text-2xl font-extrabold">{invite ? "Join your team" : "Create your workspace"}</h1>
      <p className="my-3 text-sm text-zinc-600">
        {invite ? "Accept the invitation with the email your workspace owner invited." : "Create a private workspace for your business and add employees from your dashboard."}
      </p>
      <form onSubmit={setup} className="grid gap-4">
        {!invite && <>
          <label className="workspace-field">Your name<input name="name" autoComplete="name" required maxLength={60} /></label>
          <label className="workspace-field">Business name<input name="business" autoComplete="organization" required maxLength={80} /></label>
        </>}
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        <Button disabled={pending}>{pending ? "Please wait…" : invite ? "Accept invitation" : "Create workspace"}</Button>
        <Button type="button" variant="outline" onClick={() => void signOut().catch(() => setError("Couldn’t sign out. Try again."))}>Sign out</Button>
      </form>
    </section>
  </main>;
}

export default function SetupPage() {
  return <Suspense fallback={<p className="p-6">Loading workspace setup…</p>}><SetupForm /></Suspense>;
}
