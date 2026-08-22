"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mobileNavigationItems } from "@/components/shared/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {mobileNavigationItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
