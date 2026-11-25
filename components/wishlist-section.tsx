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
        <div>
          <CardTitle>Wishlist mục tiêu ({items.length} món)</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Tính theo tổng số dư hiện tại: {formatVND(balance)}
          </p>
        </div>
        <WishlistDialog mode="create" />
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có món đồ nào trong Wishlist. Hãy thêm mục tiêu đầu tiên của
            bạn!
          </p>
        ) : (
          <div className="space-y-4">
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
                  className="space-y-2 rounded-lg border p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
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
                      <span className="mr-2 font-mono text-sm font-medium">
                        {formatVND(item.cost)}
                      </span>
                      <WishlistDialog mode="edit" item={item} />
                      <DeleteWishlistButton id={item.id} name={item.name} />
                    </div>
                  </div>

                  <Progress
                    value={progress}
                    className="h-2"
                    aria-label={`Tiến độ tiết kiệm cho ${item.name}: ${progress}%`}
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Đạt {progress}% mục tiêu</span>
                    <span>
                      {remaining === 0
                        ? "Đã đủ tiền mua!"
                        : `Còn thiếu ${formatVND(remaining)}`}
                    </span>
                  </div>

                  {suggestion && !suggestion.isCompleted && (
                    <p
                      className={`text-xs ${
                        suggestion.isOverdue
                          ? "font-medium text-destructive"
                          : "text-emerald-700 dark:text-emerald-400"
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