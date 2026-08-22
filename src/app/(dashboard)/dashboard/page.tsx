import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your Billora overview will appear here.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Billora</CardTitle>
          <CardDescription>The dashboard is ready for feature widgets and sales data.</CardDescription>
        </CardHeader>
        <CardContent className="h-32" />
      </Card>
    </div>
  );
}
