"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandMark } from "@/components/brand-mark";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace("/signin"), 1900);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#087747] px-6 text-white">
      <div className="absolute -left-24 -top-24 size-72 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -right-24 size-96 rounded-full bg-black/5" />

      <section className="splash-logo flex w-full max-w-sm flex-col items-center text-center">
        <BrandMark large />
        <h1 className="mt-7 text-3xl font-extrabold tracking-[0.12em] sm:text-4xl">BILLORA</h1>
        <p className="mt-2.5 text-sm font-medium tracking-wide text-emerald-100">
          All Your Billing, One Place.
        </p>
      </section>

      <div className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        <span className="loader-ring size-8 rounded-full border-[3px] border-white/25 border-t-white" aria-hidden="true" />
        <span className="text-xs font-medium text-emerald-100">Loading...</span>
      </div>
    </main>
  );
}
