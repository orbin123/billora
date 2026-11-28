"use client";

import { type FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { post } from "@/lib/workspace-client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"admin" | "employee">("admin");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const admin = mode === "admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await post<{ next: string }>("/api/auth", {
        kind: "signin", mode, login: login.trim(), password,
      });
      router.replace(result.next);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn’t sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-[#f4f7f5] lg:grid-cols-[minmax(340px,0.92fr)_minmax(520px,1.08fr)]">
      <section className="relative hidden overflow-hidden bg-[#087747] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full border-[90px] border-white/[0.035]" />
        <div className="relative flex items-center gap-3">
          <BrandMark className="size-12 rounded-xl" />
          <span className="text-lg font-extrabold tracking-[0.12em]">BILLORA</span>
        </div>
        <div className="relative max-w-lg pb-10">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">Built for busy counters</p>
          <h1 className="text-4xl font-bold leading-[1.12] xl:text-5xl">Billing made simple for your food business.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-emerald-100/80">
            A focused workspace for quick bills, clear records, and smooth daily operations.
          </p>
        </div>
        <p className="relative text-xs text-emerald-100/65">© 2026 Billora</p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-12">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-emerald-50 [clip-path:ellipse(65%_70%_at_50%_100%)] sm:h-32 lg:hidden" />
        <Card className="relative w-full max-w-[460px] border-zinc-200/80 bg-white/95 shadow-[0_24px_70px_rgba(20,60,43,0.10)] backdrop-blur sm:rounded-[1.75rem]">
          <CardContent className="p-6 sm:p-10">
            <header className="mb-8 flex flex-col items-center text-center">
              <BrandMark />
              <h2 className="mt-4 text-2xl font-extrabold tracking-[0.08em] text-zinc-950">BILLORA</h2>
              <p className="mt-1.5 text-sm text-zinc-500">Sign in to your workspace</p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <fieldset disabled={pending} className="grid grid-cols-2 gap-1 rounded-xl bg-[#F6F8F6] p-1">
                <legend className="sr-only">Sign in as</legend>
                {(["admin", "employee"] as const).map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input type="radio" name="mode" value={option} checked={mode === option} className="peer sr-only"
                      onChange={() => {
                        setMode(option);
                        setLogin("");
                        setPassword("");
                        setShowPassword(false);
                        setError("");
                      }} />
                    <span className="flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold text-[#18211D] peer-checked:bg-[#DDF3E7] peer-checked:text-[#045B39] peer-focus-visible:ring-2 peer-focus-visible:ring-[#087747]">
                      {option === "admin" ? "Admin" : "Employee"}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="login">{admin ? "Admin email" : "Employee username"}</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login"
                    autoComplete="username"
                    type={admin ? "email" : "text"}
                    maxLength={254}
                    value={login}
                    onChange={(event) => { setLogin(event.target.value); setError(""); }}
                    autoCapitalize="none"
                    spellCheck={false}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError(""); }}
                    className="pl-10 pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                  </button>
                </div>
              </div>

              {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
              <Button type="submit" disabled={pending} className="h-12 w-full text-sm tracking-wide">
                {pending ? "Signing in…" : admin ? "Sign in as admin" : "Sign in as employee"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
