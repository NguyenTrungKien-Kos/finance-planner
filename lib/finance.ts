export type TimeFilter = "this_month" | "last_month" | "all";

export function calculateSummary(
  transactions: ReadonlyArray<{ type: "INCOME" | "EXPENSE"; amount: number }>
) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === "INCOME") {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export function getDateRange(
  period: string | undefined,
  referenceDate: Date = new Date()
): { gte: Date; lt: Date } | undefined {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (period === "this_month") {
    return {
      gte: new Date(year, month, 1, 0, 0, 0, 0),
      lt: new Date(year, month + 1, 1, 0, 0, 0, 0),
    };
  }

  if (period === "last_month") {
    return {
      gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
      lt: new Date(year, month, 1, 0, 0, 0, 0),
    };
  }

  return undefined;
}

export function calculateWishlistProgress(
  balance: number,
  cost: number
): number {
  if (balance <= 0 || cost <= 0) {
    return 0;
  }
  const percent = Math.floor((balance / cost) * 100);
  return Math.min(100, Math.max(0, percent));
}

export const WISHLIST_MILESTONES = [50, 75, 100] as const;

export type WishlistMilestoneNotification = {
  key: string;
  itemId: string;
  itemName: string;
  milestone: number;
  message: string;
};

export function getReachedMilestones(
  balance: number,
  cost: number
): number[] {
  const progress = calculateWishlistProgress(balance, cost);
  return WISHLIST_MILESTONES.filter((m) => progress >= m);
}

export function getWishlistMilestoneNotifications(
  items: ReadonlyArray<{ id: string; name: string; cost: number }>,
  balance: number,
  notifiedKeys: ReadonlySet<string>
): {
  notifications: WishlistMilestoneNotification[];
  keysToMark: string[];
} {
  const notifications: WishlistMilestoneNotification[] = [];
  const keysToMark: string[] = [];

  for (const item of items) {
    const reached = getReachedMilestones(balance, item.cost);
    const unnotified = reached.filter(
      (m) => !notifiedKeys.has(`${item.id}:${m}`)
    );

    if (unnotified.length === 0) {
      continue;
    }

    for (const m of unnotified) {
      keysToMark.push(`${item.id}:${m}`);
    }

    const highest = unnotified[unnotified.length - 1];
    notifications.push({
      key: `${item.id}:${highest}`,
      itemId: item.id,
      itemName: item.name,
      milestone: highest,
      message: `Bạn đã tiết kiệm được ${highest}% cho ${item.name}!`,
    });
  }

  return { notifications, keysToMark };
}

export type CategoryExpenseItem = {
  category: string;
  amount: number;
  percentage: number;
};

export function getCategoryExpenseBreakdown(
  transactions: ReadonlyArray<{
    type: "INCOME" | "EXPENSE";
    category: string;
    amount: number;
  }>
): CategoryExpenseItem[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== "EXPENSE" || tx.amount <= 0) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    grandTotal += tx.amount;
  }

  if (grandTotal === 0) return [];

  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / grandTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);
}