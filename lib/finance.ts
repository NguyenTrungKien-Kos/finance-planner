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