import { cn } from "cn";

export function BrandLogo({
  dark = false,
  compact = false,
  className,
}: {
  dark?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl shadow-xs",
          dark
            ? "bg-linear-to-br from-[#5B5CE6] to-[#7D82FA] text-white"
            : "bg-foreground text-background"
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5">
          <path
            d="M4.5 7.5C4.5 5.843 5.843 4.5 7.5 4.5H19.5C18.2 8.2 14.7 10.5 10.8 10.5H4.5V7.5Z"
            fill="currentColor"
          />
          <path
            d="M4.5 13.5H15C13.8 16.9 10.9 19.2 7.5 19.5C5.843 19.5 4.5 18.157 4.5 16.5V13.5Z"
            fill="currentColor"
            fillOpacity="0.72"
          />
        </svg>
      </span>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "text-base font-bold tracking-tight",
              dark ? "text-white" : "text-foreground"
            )}
          >
            Finance Planner
          </span>
          <span
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              dark ? "text-zinc-400" : "text-muted-foreground"
            )}
          >
            Quản lý tài chính
          </span>
        </div>
      )}
    </div>
  );
}