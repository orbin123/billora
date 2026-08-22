import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Card className="shadow-lg shadow-black/5">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          B
        </div>
        <CardTitle className="text-2xl">Welcome to Billora</CardTitle>
        <CardDescription>Sign in to continue to your point of sale.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">
              Username
            </label>
            <input
              autoComplete="username"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              id="username"
              name="username"
              placeholder="Enter your username"
              type="text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              id="password"
              name="password"
              placeholder="Enter your password"
              type="password"
            />
          </div>
          <Button className="h-11 w-full" type="submit">
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
