"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-dvh bg-[#f4f7f5] lg:grid-cols-[minmax(340px,0.92fr)_minmax(520px,1.08fr)]">
      <section className="relative hidden overflow-hidden bg-[#087747] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full border-[90px] border-white/[0.035]" />
        <div className="relative flex items-center gap-3">
          <BrandMark className="size-12 rounded-xl bg-white text-emerald-700 ring-1 ring-white/30" />
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
              <BrandMark className="size-16 rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" />
              <h2 className="mt-4 text-2xl font-extrabold tracking-[0.08em] text-zinc-950">BILLORA</h2>
              <p className="mt-1.5 text-sm text-zinc-500">Sign in to continue</p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="px-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full text-sm tracking-wide">
                Sign in
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-center text-xs leading-5 text-emerald-900">
              <span className="font-semibold">Frontend preview:</span> enter any values to continue.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
