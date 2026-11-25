import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { BudgetAlertLevel, BudgetStatusItem } from "@/lib/finance";
import { BudgetDialog } from "@/components/budget-dialog";
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
    return (
      <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">
        Cảnh báo ≥80%
      </Badge>
    );
  }
  return <Badge variant="secondary">An toàn</Badge>;
}

function getProgressClass(level: BudgetAlertLevel): string {
  if (level === "EXCEEDED") return "h-2 [&>div]:bg-destructive";
  if (level === "WARNING") return "h-2 [&>div]:bg-amber-500";
  return "h-2";
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
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>
            Ngân sách tháng {month}/{year} ({statuses.length} danh mục)
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Theo dõi hạn mức chi tiêu và cảnh báo tự động khi chạm 80% / 100%
          </p>
        </div>
        <BudgetDialog mode="create" defaultMonth={month} defaultYear={year} />
      </CardHeader>

      <CardContent>
        {statuses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có ngân sách nào cho tháng {month}/{year}. Hãy nhấn &ldquo;Đặt
            ngân sách&rdquo; để bắt đầu theo dõi!
          </p>
        ) : (
          <div className="space-y-4">
            {statuses.map((item) => {
              const categoryKey = item.category as (typeof CATEGORIES)[number];
              const categoryLabel =
                CATEGORY_LABELS[categoryKey] ?? item.category;

              return (
                <div
                  key={item.id}
                  className="space-y-2 rounded-lg border p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{categoryLabel}</span>
                      {getAlertBadge(item.alertLevel)}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="mr-2 font-mono text-sm font-medium">
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
                          ? "font-medium text-destructive"
                          : undefined
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
        )}
      </CardContent>
    </Card>
  );
}