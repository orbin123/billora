import type { ReactNode } from "react";

import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh bg-muted/30">
      <Sidebar />
      <div className="min-h-dvh lg:pl-64">
        <TopNav />
        <main className="mx-auto w-full max-w-screen-2xl p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
