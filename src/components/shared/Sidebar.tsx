"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "@/components/shared/navigation";
import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card lg:flex">
      <Link className="flex h-16 items-center gap-3 border-b px-6" href="/dashboard">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          B
        </span>
        <span className="text-xl font-bold tracking-tight">Billora</span>
      </Link>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigationItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground">Billora POS · Demo</div>
    </aside>
  );
}
