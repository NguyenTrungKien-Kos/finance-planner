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

export type BudgetAlertLevel = "SAFE" | "WARNING" | "EXCEEDED";

export type BudgetStatusItem = {
  id: string;
  category: string;
  month: number;
  year: number;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  progressPercent: number;
  alertLevel: BudgetAlertLevel;
};

export function calculateBudgetStatuses(
  budgets: ReadonlyArray<{
    id: string;
    category: string;
    month: number;
    year: number;
    limit: number;
  }>,
  transactions: ReadonlyArray<{
    type: "INCOME" | "EXPENSE";
    category: string;
    amount: number;
    date: Date;
  }>
): BudgetStatusItem[] {
  const spentMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "EXPENSE" || tx.amount <= 0) continue;
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth() + 1}:${tx.category}`;
    spentMap.set(key, (spentMap.get(key) ?? 0) + tx.amount);
  }

  return budgets
    .map((budget) => {
      const key = `${budget.year}-${budget.month}:${budget.category}`;
      const spent = spentMap.get(key) ?? 0;
      const remaining = budget.limit - spent;
      const percentage =
        budget.limit > 0
          ? Math.round((spent / budget.limit) * 1000) / 10
          : 0;
      const progressPercent = Math.min(100, Math.max(0, Math.round(percentage)));
      const alertLevel: BudgetAlertLevel =
        percentage >= 100 ? "EXCEEDED" : percentage >= 80 ? "WARNING" : "SAFE";

      return {
        id: budget.id,
        category: budget.category,
        month: budget.month,
        year: budget.year,
        limit: budget.limit,
        spent,
        remaining,
        percentage,
        progressPercent,
        alertLevel,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export const BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

export type BudgetAlertNotification = {
  key: string;
  budgetId: string;
  category: string;
  threshold: 80 | 100;
  percentage: number;
  message: string;
};

export function getBudgetAlertNotifications(
  statuses: ReadonlyArray<BudgetStatusItem>,
  notifiedKeys: ReadonlySet<string>,
  categoryLabels: Record<string, string> = {}
): {
  notifications: BudgetAlertNotification[];
  keysToMark: string[];
} {
  const notifications: BudgetAlertNotification[] = [];
  const keysToMark: string[] = [];

  for (const status of statuses) {
    const reached = BUDGET_ALERT_THRESHOLDS.filter(
      (t) => status.percentage >= t
    );
    const unnotified = reached.filter(
      (t) => !notifiedKeys.has(`${status.id}:${status.year}-${status.month}:${t}`)
    );

    if (unnotified.length === 0) continue;

    for (const t of unnotified) {
      keysToMark.push(`${status.id}:${status.year}-${status.month}:${t}`);
    }

    const highest = unnotified[unnotified.length - 1];
    const label = categoryLabels[status.category] ?? status.category;
    const message =
      highest === 100
        ? `Chi tiêu ${label} tháng ${status.month}/${status.year} đã vượt 100% ngân sách (${status.percentage}%)!`
        : `Chi tiêu ${label} tháng ${status.month}/${status.year} đã chạm ${status.percentage}% ngân sách (cảnh báo 80%).`;

    notifications.push({
      key: `${status.id}:${status.year}-${status.month}:${highest}`,
      budgetId: status.id,
      category: status.category,
      threshold: highest,
      percentage: status.percentage,
      message,
    });
  }

  return { notifications, keysToMark };
}