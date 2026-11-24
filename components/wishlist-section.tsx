import { PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
import { calculateWishlistProgress } from "@/lib/finance";
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
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
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

      <CardHeader className="flex flex-row items-center justify-between gap-4">
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

              return (
                <div
                  key={item.id}
                  className="space-y-2 rounded-lg border p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={PRIORITY_VARIANTS[item.priority]}>
                        {PRIORITY_LABELS[item.priority]}
                      </Badge>
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}