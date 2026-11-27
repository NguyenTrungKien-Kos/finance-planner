import { CalendarClock } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPES,
} from "@/lib/constants";
import { CategoryIconBadge } from "@/components/category-icon";
import {
  DeleteRecurringButton,
  ToggleRecurringButton,
} from "@/components/recurring-actions";
import { RecurringDialog } from "@/components/recurring-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RecurringListItem = {
  id: string;
  amount: number;
  description: string;
  type: (typeof TRANSACTION_TYPES)[number];
  category: (typeof CATEGORIES)[number];
  dayOfMonth: number;
  isActive: boolean;
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function RecurringSection({ items }: { items: RecurringListItem[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-primary"
          >
            <CalendarClock className="size-4" />
          </span>
          <div>
            <CardTitle>Giao dịch định kỳ ({items.length} mẫu)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Tự động sinh thu/chi hàng tháng (lương, tiền trọ, hóa đơn cố định)
            </p>
          </div>
        </div>
        <RecurringDialog mode="create" />
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Chưa có giao dịch định kỳ nào. Hãy nhấn &ldquo;Thêm định kỳ&rdquo;
            để tự động hóa lương hoặc tiền trọ hàng tháng!
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/75 bg-card p-3.5 transition-colors hover:bg-muted/20 ${
                  item.isActive ? "" : "opacity-60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryIconBadge category={item.category} size="sm" />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-semibold">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        Ngày {item.dayOfMonth} hàng tháng
                      </Badge>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                      <Badge variant={item.isActive ? "success" : "secondary"}>
                        {item.isActive ? "Đang bật" : "Tạm dừng"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`mr-2 font-mono text-sm font-semibold tabular-nums ${
                      item.type === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {item.type === "INCOME" ? "+" : "-"}
                    {formatVND(item.amount)}
                  </span>
                  <ToggleRecurringButton
                    id={item.id}
                    description={item.description}
                    isActive={item.isActive}
                  />
                  <RecurringDialog
                    mode="edit"
                    item={{
                      id: item.id,
                      amount: item.amount,
                      description: item.description,
                      type: item.type,
                      category: item.category,
                      dayOfMonth: item.dayOfMonth,
                    }}
                  />
                  <DeleteRecurringButton
                    id={item.id}
                    description={item.description}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}