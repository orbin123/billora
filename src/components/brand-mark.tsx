import { ChefHat, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkSize = "default" | "sidebar" | "header";

export function BrandMark({
  className,
  large = false,
  size = "default",
}: {
  className?: string;
  large?: boolean;
  size?: BrandMarkSize;
}) {
  const chefHatSize = large ? "absolute size-20" : size === "sidebar" ? "absolute size-[31px]" : size === "header" ? "absolute size-[21px]" : "absolute size-11";
  const utensilsSize = large ? "absolute top-[43px] size-8" : size === "sidebar" ? "absolute top-[17px] size-[13px]" : size === "header" ? "absolute top-[12px] size-[9px]" : "absolute top-[25px] size-[19px]";

  return (
    <div
      className={cn(
        large
          ? "relative grid size-28 place-items-center rounded-[2rem] bg-white text-emerald-700 ring-0"
          : "relative grid size-16 place-items-center rounded-[1.35rem] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        className,
      )}
      aria-hidden="true"
    >
      <ChefHat className={chefHatSize} strokeWidth={1.7} />
      <Utensils className={utensilsSize} strokeWidth={2.3} />
    </div>
  );
}
