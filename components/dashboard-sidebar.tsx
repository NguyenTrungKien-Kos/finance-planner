"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  CalendarClock,
  ChartColumn,
  LayoutDashboard,
  Menu,
  Receipt,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { cn } from "cn";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  {
    id: "analytics",
    label: "Phân tích",
    icon: ChartColumn,
    subItems: [
      { id: "analytics", label: "Thu chi 6 tháng" },
      { id: "expense-breakdown", label: "Cơ cấu chi tiêu" },
    ],
  },
  { id: "budgets", label: "Ngân sách", icon: ShieldCheck },
  { id: "wishlist", label: "Wishlist mục tiêu", icon: Target },
  { id: "recurring", label: "Giao dịch định kỳ", icon: CalendarClock },
  { id: "converter", label: "Quy đổi tiền tệ", icon: ArrowLeftRight },
  { id: "transactions", label: "Lịch sử giao dịch", icon: Receipt },
] as const;

export function DashboardSidebar({
  userSlot,
  headerAction,
  children,
}: {
  userSlot: React.ReactNode;
  headerAction: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("overview");

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Thanh điều hướng cho mobile & tablet */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Mở menu điều hướng"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <BrandLogo compact />
          <span className="text-sm font-bold tracking-tight">
            Finance Planner
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {headerAction}
        </div>
      </header>

      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar tối màu theo phong cách Cuan */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] shrink-0 flex-col justify-between border-r border-white/6 bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="flex items-center justify-between px-1">
            <BrandLogo dark />
            <button
              type="button"
              aria-label="Đóng menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav aria-label="Điều hướng chính" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isParentActive =
                activeId === item.id ||
                ("subItems" in item &&
                  item.subItems.some((sub) => sub.id === activeId));

              return (
                <div key={item.id} className="space-y-1">
                  <a
                    href={`#${item.id}`}
                    onClick={() => {
                      setActiveId(item.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isParentActive
                        ? "bg-sidebar-accent text-white shadow-xs"
                        : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isParentActive ? "text-[#8C90FF]" : "text-zinc-400"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </a>

                  {"subItems" in item && (
                    <div className="ml-5 space-y-1 border-l border-zinc-700/70 pl-4">
                      {item.subItems.map((sub) => (
                        <a
                          key={sub.id}
                          href={`#${sub.id}`}
                          onClick={() => {
                            setActiveId(sub.id);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "block rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            activeId === sub.id
                              ? "text-white"
                              : "text-zinc-400 hover:text-zinc-200"
                          )}
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/8 pt-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium text-zinc-400">
              Giao diện sáng / tối
            </span>
            <ThemeToggle className="size-8 border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/10 hover:text-white" />
          </div>
          {userSlot}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}