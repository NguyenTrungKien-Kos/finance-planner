"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserNav({
  name,
  email,
  variant = "sidebar",
}: {
  name: string;
  email: string;
  variant?: "sidebar" | "inline";
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await authClient.signOut();
      toast.success("Đã đăng xuất.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden text-sm font-medium text-muted-foreground sm:inline"
          title={email}
        >
          {name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
          aria-label="Đăng xuất"
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-3 py-2.5">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#5B5CE6] to-[#8286FC] text-xs font-bold text-white"
        >
          {getInitials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{name}</p>
          <p className="truncate text-xs text-zinc-400" title={email}>
            {email}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isLoading}
        aria-label="Đăng xuất"
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/12 hover:text-rose-300 disabled:pointer-events-none disabled:opacity-50"
      >
        <LogOut className="size-4 shrink-0" />
        <span>{isLoading ? "Đang đăng xuất..." : "Đăng xuất"}</span>
      </button>
    </div>
  );
}