"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function TopNav() {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          B
        </span>
        <span className="font-bold tracking-tight">Billora</span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm font-medium">Point of Sale</p>
        <p className="text-xs text-muted-foreground">Manage today&apos;s business</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user ? <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span> : null}
        <Button aria-label="Log out" onClick={() => void logout()} size="sm" type="button" variant="ghost">
          <LogOut aria-hidden="true" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
