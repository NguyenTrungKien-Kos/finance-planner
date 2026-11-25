export interface RecurringRuleState {
  isActive: boolean;
  dayOfMonth: number;
  lastGeneratedYear: number | null;
  lastGeneratedMonth: number | null;
}

/**
 * Trả về số ngày của tháng (month: 1-12) trong năm tương ứng.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Kẹp dayOfMonth (1-31) về ngày hợp lệ của tháng (VD: 31 vào tháng 2 -> 28 hoặc 29).
 */
export function clampDayOfMonth(
  year: number,
  month: number,
  dayOfMonth: number
): number {
  const maxDay = getDaysInMonth(year, month);
  return Math.min(Math.max(dayOfMonth, 1), maxDay);
}

/**
 * Định dạng chuỗi "YYYY-MM" để làm khóa chống sinh trùng theo tháng.
 */
export function formatRecurringMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Tạo Date tại 12:00 trưa giờ local để đồng bộ với parseLocalDate của Transaction.
 */
export function buildRecurringDate(
  year: number,
  month: number,
  dayOfMonth: number
): Date {
  const day = clampDayOfMonth(year, month, dayOfMonth);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Kiểm tra quy tắc định kỳ có cần tự sinh giao dịch trong tháng hiện tại hay không.
 */
export function shouldGenerateForMonth(
  rule: RecurringRuleState,
  now: Date = new Date()
): boolean {
  if (!rule.isActive) {
    return false;
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  if (
    rule.lastGeneratedYear !== null &&
    rule.lastGeneratedMonth !== null
  ) {
    const lastIndex = rule.lastGeneratedYear * 12 + rule.lastGeneratedMonth;
    const currentIndex = currentYear * 12 + currentMonth;
    if (lastIndex >= currentIndex) {
      return false;
    }
  }

  const targetDay = clampDayOfMonth(currentYear, currentMonth, rule.dayOfMonth);
  return currentDay >= targetDay;
}