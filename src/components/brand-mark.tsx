import { ChefHat, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkSize = "default" | "sidebar" | "header";

const markSizes: Record<BrandMarkSize, string> = {
  default: "size-16",
  sidebar: "size-11",
  header: "size-[34px]",
};

export function BrandMark({
  className,
  large = false,
  size = "default",
}: {
  className?: string;
  large?: boolean;
  size?: BrandMarkSize;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 text-emerald-700",
        large
          ? "size-28 rounded-[2rem] bg-white"
          : "rounded-2xl bg-emerald-50 ring-1 ring-emerald-100",
        !large && markSizes[size],
        className,
      )}
      aria-hidden="true"
    >
      <ChefHat className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", large ? "size-20" : "size-[68.75%]")} strokeWidth={1.7} />
      <Utensils className={cn("absolute left-1/2 -translate-x-1/2", large ? "top-[43px] size-8" : "top-[39.0625%] size-[29.6875%]")} strokeWidth={2.3} />
    </div>
  );
}
