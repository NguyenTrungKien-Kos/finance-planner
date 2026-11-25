import { CalendarClock } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPES,
} from "@/lib/constants";
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
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            Giao dịch định kỳ ({items.length} mẫu)
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Tự động sinh thu/chi hàng tháng (lương, tiền trọ, hóa đơn cố định)
          </p>
        </div>
        <RecurringDialog mode="create" />
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có giao dịch định kỳ nào. Hãy nhấn &ldquo;Thêm định kỳ&rdquo;
            để tự động hóa lương hoặc tiền trọ hàng tháng!
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 ${
                  item.isActive ? "" : "opacity-60"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">
                      {item.description}
                    </span>
                    <Badge variant="outline">
                      Ngày {item.dayOfMonth} hàng tháng
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </Badge>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Đang bật" : "Tạm dừng"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`mr-2 font-mono text-sm font-semibold ${
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