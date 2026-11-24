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

export type MonthlyComparisonItem = {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type SpendingTrend = {
  currentExpense: number;
  previousExpense: number;
  difference: number;
  percentageChange: number | null;
  direction: "up" | "down" | "flat";
};

export function getMonthlyComparison(
  transactions: ReadonlyArray<{
    type: "INCOME" | "EXPENSE";
    amount: number;
    date: Date;
  }>,
  monthsCount: number = 6,
  referenceDate: Date = new Date()
): MonthlyComparisonItem[] {
  if (monthsCount <= 0) return [];

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const buckets: MonthlyComparisonItem[] = [];
  const bucketMap = new Map<string, MonthlyComparisonItem>();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(refYear, refMonth - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const item: MonthlyComparisonItem = {
      monthKey,
      label: `T${month}/${year}`,
      income: 0,
      expense: 0,
      balance: 0,
    };
    buckets.push(item);
    bucketMap.set(monthKey, item);
  }

  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;

    if (tx.type === "INCOME") {
      bucket.income += tx.amount;
    } else {
      bucket.expense += tx.amount;
    }
    bucket.balance = bucket.income - bucket.expense;
  }

  return buckets;
}

export function getSpendingTrend(
  monthlyData: ReadonlyArray<MonthlyComparisonItem>
): SpendingTrend {
  if (monthlyData.length === 0) {
    return {
      currentExpense: 0,
      previousExpense: 0,
      difference: 0,
      percentageChange: null,
      direction: "flat",
    };
  }

  const current = monthlyData[monthlyData.length - 1];
  const previous =
    monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2] : undefined;
  const currentExpense = current ? current.expense : 0;
  const previousExpense = previous ? previous.expense : 0;
  const difference = currentExpense - previousExpense;
  const direction =
    difference > 0 ? "up" : difference < 0 ? "down" : "flat";
  const percentageChange =
    previousExpense > 0
      ? Math.round((difference / previousExpense) * 1000) / 10
      : null;

  return {
    currentExpense,
    previousExpense,
    difference,
    percentageChange,
    direction,
  };
}