export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;

export const TRANSACTION_TYPE_LABELS: Record<
  (typeof TRANSACTION_TYPES)[number],
  string
> = {
  INCOME: "Thu nhập",
  EXPENSE: "Chi tiêu",
};

export const CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "ENTERTAINMENT",
  "SHOPPING",
  "BILLS",
  "SALARY",
  "INVESTMENT",
  "OTHER",
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  FOOD: "Ăn uống",
  TRANSPORT: "Di chuyển",
  ENTERTAINMENT: "Giải trí",
  SHOPPING: "Mua sắm",
  BILLS: "Hóa đơn",
  SALARY: "Lương",
  INVESTMENT: "Đầu tư",
  OTHER: "Khác",
};