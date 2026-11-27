import { Target } from "lucide-react";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
import {
  calculateMonthlySavingsSuggestion,
  calculateWishlistProgress,
} from "@/lib/finance";
import { DeleteWishlistButton } from "@/components/delete-wishlist-button";
import { WishlistDialog } from "@/components/wishlist-dialog";
import { WishlistMilestoneNotifier } from "@/components/wishlist-milestone-notifier";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type WishlistItemData = {
  id: string;
  name: string;
  cost: number;
  priority: (typeof PRIORITIES)[number];
  deadline: Date | null;
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const PRIORITY_VARIANTS: Record<
  (typeof PRIORITIES)[number],
  "default" | "secondary" | "outline"
> = {
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export function WishlistSection({
  userId,
  items,
  balance,
}: {
  userId: string;
  items: WishlistItemData[];
  balance: number;
}) {
  return (
    <Card>
      <WishlistMilestoneNotifier
        userId={userId}
        items={items}
        balance={balance}
      />

      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          >
            <Target className="size-4" />
          </span>
          <div>
            <CardTitle>Wishlist mục tiêu ({items.length} món)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Tính theo tổng số dư hiện tại: {formatVND(balance)}
            </p>
          </div>
        </div>
        <WishlistDialog mode="create" />
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Chưa có món đồ nào trong Wishlist. Hãy thêm mục tiêu đầu tiên của
            bạn!
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const progress = calculateWishlistProgress(balance, item.cost);
              const remaining = Math.max(0, item.cost - Math.max(0, balance));
              const suggestion = calculateMonthlySavingsSuggestion(
                item.cost,
                balance,
                item.deadline
              );

              return (
                <div
                  key={item.id}
                  className="space-y-2.5 rounded-2xl border border-border/75 bg-card p-4 transition-colors hover:bg-muted/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <Badge variant={PRIORITY_VARIANTS[item.priority]}>
                        {PRIORITY_LABELS[item.priority]}
                      </Badge>
                      {item.deadline && (
                        <Badge
                          variant={
                            suggestion?.isOverdue ? "destructive" : "outline"
                          }
                        >
                          {suggestion?.isOverdue
                            ? `Quá hạn (${formatDate(item.deadline)})`
                            : `Hạn: ${formatDate(item.deadline)}`}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="mr-2 font-mono text-sm font-semibold tabular-nums">
                        {formatVND(item.cost)}
                      </span>
                      <WishlistDialog mode="edit" item={item} />
                      <DeleteWishlistButton id={item.id} name={item.name} />
                    </div>
                  </div>

                  <Progress
                    value={progress}
                    className={
                      progress >= 100
                        ? "h-2.5 [&>div]:bg-emerald-500"
                        : "h-2.5"
                    }
                    aria-label={`Tiến độ tiết kiệm cho ${item.name}: ${progress}%`}
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Đạt {progress}% mục tiêu</span>
                    <span
                      className={
                        remaining === 0
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "font-medium"
                      }
                    >
                      {remaining === 0
                        ? "Đã đủ tiền mua!"
                        : `Còn thiếu ${formatVND(remaining)}`}
                    </span>
                  </div>

                  {suggestion && !suggestion.isCompleted && (
                    <p
                      className={`rounded-xl px-3 py-2 text-xs font-medium ${
                        suggestion.isOverdue
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {suggestion.isOverdue
                        ? `Đã quá hạn chót — cần bổ sung thêm ${formatVND(suggestion.remaining)}`
                        : `Gợi ý để dành: ${formatVND(suggestion.monthlySuggested)}/tháng (còn ${suggestion.monthsRemaining} tháng)`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}