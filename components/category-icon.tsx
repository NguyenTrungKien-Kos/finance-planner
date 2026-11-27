import {
  Briefcase,
  Car,
  Gamepad2,
  Layers,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

type CategoryVisual = {
  icon: LucideIcon;
  badgeClass: string;
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  FOOD: {
    icon: Utensils,
    badgeClass:
      "bg-orange-500/12 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  },
  TRANSPORT: {
    icon: Car,
    badgeClass:
      "bg-indigo-500/12 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  ENTERTAINMENT: {
    icon: Gamepad2,
    badgeClass:
      "bg-violet-500/12 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  SHOPPING: {
    icon: ShoppingBag,
    badgeClass:
      "bg-rose-500/12 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  },
  BILLS: {
    icon: Receipt,
    badgeClass:
      "bg-cyan-500/12 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300",
  },
  SALARY: {
    icon: Briefcase,
    badgeClass:
      "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  INVESTMENT: {
    icon: TrendingUp,
    badgeClass:
      "bg-amber-500/12 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
  OTHER: {
    icon: Layers,
    badgeClass:
      "bg-slate-500/12 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  },
};

export function CategoryIconBadge({
  category,
  size = "md",
  className,
}: {
  category: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const visual = CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.OTHER;
  const Icon = visual.icon;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" ? "size-8" : "size-9",
        visual.badgeClass,
        className
      )}
    >
      <Icon className={size === "sm" ? "size-4" : "size-[18px]"} />
    </span>
  );
}