"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function UserNav({
  name,
  email,
}: {
  name: string;
  email: string;
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

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden text-sm text-muted-foreground sm:inline"
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