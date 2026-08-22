import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FeaturePlaceholderProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

export function FeaturePlaceholder({ description, icon: Icon, title }: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>This route is ready for its feature module.</CardDescription>
        </CardHeader>
        <CardContent className="h-24" />
      </Card>
    </div>
  );
}
