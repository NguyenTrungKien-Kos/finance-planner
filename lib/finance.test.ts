import { describe, expect, it } from "vitest";
import { calculateSummary, getDateRange } from "@/lib/finance";

describe("calculateSummary", () => {
  it("tính đúng tổng thu, tổng chi và số dư (Thu - Chi)", () => {
    const summary = calculateSummary([
      { type: "INCOME", amount: 10_000_000 },
      { type: "EXPENSE", amount: 3_500_000 },
      { type: "EXPENSE", amount: 1_500_000 },
    ]);

    expect(summary).toEqual({
      totalIncome: 10_000_000,
      totalExpense: 5_000_000,
      balance: 5_000_000,
    });
  });

  it("trả về 0 cho mảng giao dịch rỗng", () => {
    expect(calculateSummary([])).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    });
  });
});

describe("getDateRange", () => {
  it("trả về khoảng đầu tháng đến đầu tháng sau cho 'this_month' và undefined cho 'all'", () => {
    const ref = new Date(2026, 10, 24, 15, 30, 0); // 24/11/2026
    const range = getDateRange("this_month", ref);

    expect(range).toEqual({
      gte: new Date(2026, 10, 1, 0, 0, 0, 0),
      lt: new Date(2026, 11, 1, 0, 0, 0, 0),
    });
    expect(getDateRange("all", ref)).toBeUndefined();
  });

  it("xử lý đúng trường hợp giao năm khi đang ở tháng 1 với 'last_month'", () => {
    const janRef = new Date(2026, 0, 15, 10, 0, 0); // 15/01/2026
    const range = getDateRange("last_month", janRef);

    expect(range).toEqual({
      gte: new Date(2025, 11, 1, 0, 0, 0, 0), // 01/12/2025
      lt: new Date(2026, 0, 1, 0, 0, 0, 0),   // 01/01/2026
    });
  });
});