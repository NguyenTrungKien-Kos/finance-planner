import { ShieldCheck } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { BudgetAlertLevel, BudgetStatusItem } from "@/lib/finance";
import { BudgetDialog } from "@/components/budget-dialog";
import { CategoryIconBadge } from "@/components/category-icon";
import { DeleteBudgetButton } from "@/components/delete-budget-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function getAlertBadge(level: BudgetAlertLevel) {
  if (level === "EXCEEDED") {
    return <Badge variant="destructive">Vượt 100%</Badge>;
  }
  if (level === "WARNING") {
    return <Badge variant="warning">Cảnh báo ≥80%</Badge>;
  }
  return <Badge variant="success">An toàn</Badge>;
}

function getProgressClass(level: BudgetAlertLevel): string {
  if (level === "EXCEEDED") return "h-2.5 [&>div]:bg-rose-500";
  if (level === "WARNING") return "h-2.5 [&>div]:bg-amber-500";
  return "h-2.5";
}

export function BudgetSection({
  month,
  year,
  statuses,
}: {
  month: number;
  year: number;
  statuses: BudgetStatusItem[];
}) {
  const totalLimit = statuses.reduce((sum, s) => sum + s.limit, 0);
  const totalSpent = statuses.reduce((sum, s) => sum + s.spent, 0);
  const totalProgress =
    totalLimit > 0
      ? Math.min(100, Math.round((totalSpent / totalLimit) * 100))
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
          >
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <CardTitle>
              Ngân sách tháng {month}/{year} ({statuses.length} danh mục)
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Theo dõi hạn mức chi tiêu và cảnh báo tự động khi chạm 80% / 100%
            </p>
          </div>
        </div>
        <BudgetDialog mode="create" defaultMonth={month} defaultYear={year} />
      </CardHeader>

      <CardContent className="space-y-4">
        {statuses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Chưa có ngân sách nào cho tháng {month}/{year}. Hãy nhấn &ldquo;Đặt
            ngân sách&rdquo; để bắt đầu theo dõi!
          </p>
        ) : (
          <>
            {/* Thanh tổng hạn mức chi tiêu theo phong cách Finova */}
            <div className="space-y-2.5 rounded-2xl border border-border/70 bg-muted/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  Tổng hạn mức chi tiêu tháng
                </span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {formatVND(totalSpent)} / {formatVND(totalLimit)}
                </span>
              </div>
              <Progress
                value={totalProgress}
                className="h-3"
                aria-label={`Tổng hạn mức tháng ${month}/${year}: ${totalProgress}%`}
              />
            </div>

            <div className="space-y-3">
              {statuses.map((item) => {
                const categoryKey =
                  item.category as (typeof CATEGORIES)[number];
                const categoryLabel =
                  CATEGORY_LABELS[categoryKey] ?? item.category;

                return (
                  <div
                    key={item.id}
                    className="space-y-2.5 rounded-2xl border border-border/75 bg-card p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <CategoryIconBadge category={item.category} size="sm" />
                        <span className="font-semibold">{categoryLabel}</span>
                        {getAlertBadge(item.alertLevel)}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="mr-2 font-mono text-sm font-semibold tabular-nums">
                          {formatVND(item.spent)} / {formatVND(item.limit)}
                        </span>
                        <BudgetDialog
                          mode="edit"
                          item={{
                            id: item.id,
                            category: categoryKey,
                            month: item.month,
                            year: item.year,
                            limit: item.limit,
                          }}
                        />
                        <DeleteBudgetButton
                          id={item.id}
                          categoryLabel={categoryLabel}
                        />
                      </div>
                    </div>

                    <Progress
                      value={item.progressPercent}
                      className={getProgressClass(item.alertLevel)}
                      aria-label={`Ngân sách ${categoryLabel}: đã chi ${item.percentage}%`}
                    />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Đã dùng {item.percentage}% hạn mức</span>
                      <span
                        className={
                          item.remaining < 0
                            ? "font-semibold text-rose-600 dark:text-rose-400"
                            : "font-medium"
                        }
                      >
                        {item.remaining < 0
                          ? `Vượt ${formatVND(Math.abs(item.remaining))}`
                          : `Còn lại ${formatVND(item.remaining)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}