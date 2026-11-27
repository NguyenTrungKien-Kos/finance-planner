"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionFilters({
  period,
  type,
  category,
}: {
  period: string;
  type: string;
  category: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: "period" | "type" | "category", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const hasActiveFilter =
    period !== "all" || type !== "ALL" || category !== "ALL";

  return (
    <div
      aria-label="Bộ lọc giao dịch"
      className="flex flex-wrap items-center gap-2.5"
    >
      <Select
        value={period}
        onValueChange={(val) => updateFilter("period", val)}
      >
        <SelectTrigger
          className="h-9 w-[160px] rounded-xl bg-background"
          aria-label="Lọc theo thời gian"
        >
          <SelectValue placeholder="Thời gian" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả thời gian</SelectItem>
          <SelectItem value="this_month">Tháng này</SelectItem>
          <SelectItem value="last_month">Tháng trước</SelectItem>
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(val) => updateFilter("type", val)}>
        <SelectTrigger
          className="h-9 w-[145px] rounded-xl bg-background"
          aria-label="Lọc theo loại"
        >
          <SelectValue placeholder="Loại giao dịch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả loại</SelectItem>
          {TRANSACTION_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {TRANSACTION_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={category}
        onValueChange={(val) => updateFilter("category", val)}
      >
        <SelectTrigger
          className="h-9 w-[165px] rounded-xl bg-background"
          aria-label="Lọc theo danh mục"
        >
          <SelectValue placeholder="Danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả danh mục</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Xoá bộ lọc
        </Button>
      )}
    </div>
  );
}