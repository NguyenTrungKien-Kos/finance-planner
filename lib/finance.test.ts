import { describe, expect, it } from "vitest";
import {
  calculateBudgetStatuses,
  calculateMonthlySavingsSuggestion,
  calculateSummary,
  calculateWishlistProgress,
  getBudgetAlertNotifications,
  getCategoryExpenseBreakdown,
  getDateRange,
  getMonthlyComparison,
  getReachedMilestones,
  getSpendingTrend,
  getWishlistMilestoneNotifications,
} from "@/lib/finance";

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

describe("calculateWishlistProgress", () => {
  it("trả về 0% khi số dư âm hoặc giá <= 0 và giới hạn tối đa 100%", () => {
    expect(calculateWishlistProgress(-500_000, 2_000_000)).toBe(0);
    expect(calculateWishlistProgress(1_000_000, 0)).toBe(0);
    expect(calculateWishlistProgress(1_500_000, 3_000_000)).toBe(50);
    expect(calculateWishlistProgress(10_000_000, 4_000_000)).toBe(100);
  });
});

describe("calculateMonthlySavingsSuggestion", () => {
  const ref = new Date(2026, 10, 25); // 25/11/2026

  it("trả về null khi không có hạn chót", () => {
    expect(calculateMonthlySavingsSuggestion(10_000_000, 2_000_000, null, ref)).toBeNull();
  });

  it("trả về isCompleted = true khi đã đủ tiền", () => {
    expect(
      calculateMonthlySavingsSuggestion(5_000_000, 6_000_000, new Date(2027, 1, 1), ref)
    ).toEqual({
      remaining: 0,
      monthsRemaining: 0,
      monthlySuggested: 0,
      isOverdue: false,
      isCompleted: true,
    });
  });

  it("tính đúng số tháng còn lại và gợi ý mỗi tháng (làm tròn lên)", () => {
    // T11/2026 -> T2/2027 = 4 tháng (T11, T12, T1, T2)
    // Còn thiếu: 10.000.000 - 1.000.000 = 9.000.000 -> 2.250.000/tháng
    expect(
      calculateMonthlySavingsSuggestion(10_000_000, 1_000_000, new Date(2027, 1, 15), ref)
    ).toEqual({
      remaining: 9_000_000,
      monthsRemaining: 4,
      monthlySuggested: 2_250_000,
      isOverdue: false,
      isCompleted: false,
    });
  });

  it("xử lý số dư âm như 0 và đánh dấu quá hạn khi deadline < hôm nay", () => {
    expect(
      calculateMonthlySavingsSuggestion(4_000_000, -500_000, new Date(2026, 10, 20), ref)
    ).toEqual({
      remaining: 4_000_000,
      monthsRemaining: 0,
      monthlySuggested: 4_000_000,
      isOverdue: true,
      isCompleted: false,
    });
  });
});

describe("wishlist milestone notifications", () => {
  it("xác định đúng các mốc 50%, 75%, 100% đã đạt", () => {
    expect(getReachedMilestones(490_000, 1_000_000)).toEqual([]);
    expect(getReachedMilestones(500_000, 1_000_000)).toEqual([50]);
    expect(getReachedMilestones(800_000, 1_000_000)).toEqual([50, 75]);
    expect(getReachedMilestones(1_200_000, 1_000_000)).toEqual([50, 75, 100]);
  });

  it("không lặp lại thông báo cho mốc đã báo và chỉ báo mốc cao nhất khi nhảy cóc", () => {
    const items = [{ id: "wl-1", name: "Tai nghe", cost: 1_000_000 }];

    const first = getWishlistMilestoneNotifications(items, 1_000_000, new Set());
    expect(first.notifications).toHaveLength(1);
    expect(first.notifications[0]?.milestone).toBe(100);
    expect(first.notifications[0]?.message).toBe(
      "Bạn đã tiết kiệm được 100% cho Tai nghe!"
    );
    expect(first.keysToMark).toEqual(["wl-1:50", "wl-1:75", "wl-1:100"]);

    const second = getWishlistMilestoneNotifications(
      items,
      1_000_000,
      new Set(first.keysToMark)
    );
    expect(second.notifications).toHaveLength(0);
  });
});

describe("getCategoryExpenseBreakdown", () => {
  it("gom nhóm chi tiêu theo danh mục, bỏ qua thu nhập và sắp xếp giảm dần", () => {
    const result = getCategoryExpenseBreakdown([
      { type: "INCOME", category: "SALARY", amount: 10_000_000 },
      { type: "EXPENSE", category: "FOOD", amount: 1_000_000 },
      { type: "EXPENSE", category: "BILLS", amount: 3_000_000 },
      { type: "EXPENSE", category: "FOOD", amount: 1_000_000 },
    ]);

    expect(result).toEqual([
      { category: "BILLS", amount: 3_000_000, percentage: 60 },
      { category: "FOOD", amount: 2_000_000, percentage: 40 },
    ]);
  });

  it("trả về mảng rỗng khi không có chi tiêu", () => {
    expect(
      getCategoryExpenseBreakdown([
        { type: "INCOME", category: "SALARY", amount: 5_000_000 },
      ])
    ).toEqual([]);
  });
});

describe("getMonthlyComparison", () => {
  it("gom nhóm thu, chi, chênh lệch theo tháng và xử lý đúng trường hợp giao năm", () => {
    const ref = new Date(2026, 0, 15); // 15/01/2026
    const result = getMonthlyComparison(
      [
        { type: "INCOME", amount: 15_000_000, date: new Date(2025, 10, 5) },  // T11/2025
        { type: "EXPENSE", amount: 4_000_000, date: new Date(2025, 10, 20) }, // T11/2025
        { type: "EXPENSE", amount: 6_000_000, date: new Date(2025, 11, 10) }, // T12/2025
        { type: "INCOME", amount: 20_000_000, date: new Date(2026, 0, 2) },   // T1/2026
        { type: "EXPENSE", amount: 5_000_000, date: new Date(2026, 0, 12) },  // T1/2026
        { type: "EXPENSE", amount: 9_000_000, date: new Date(2025, 6, 1) },   // Ngoài 3 tháng -> bỏ qua
      ],
      3,
      ref
    );

    expect(result).toEqual([
      {
        monthKey: "2025-11",
        label: "T11/2025",
        income: 15_000_000,
        expense: 4_000_000,
        balance: 11_000_000,
      },
      {
        monthKey: "2025-12",
        label: "T12/2025",
        income: 0,
        expense: 6_000_000,
        balance: -6_000_000,
      },
      {
        monthKey: "2026-01",
        label: "T1/2026",
        income: 20_000_000,
        expense: 5_000_000,
        balance: 15_000_000,
      },
    ]);
  });

  it("trả về mảng rỗng khi monthsCount <= 0", () => {
    expect(getMonthlyComparison([], 0)).toEqual([]);
  });
});

describe("getSpendingTrend", () => {
  it("tính đúng xu hướng tăng, giảm và không đổi giữa tháng này và tháng trước", () => {
    const up = getSpendingTrend([
      { monthKey: "2026-10", label: "T10/2026", income: 0, expense: 4_000_000, balance: -4_000_000 },
      { monthKey: "2026-11", label: "T11/2026", income: 0, expense: 5_000_000, balance: -5_000_000 },
    ]);
    expect(up).toEqual({
      currentExpense: 5_000_000,
      previousExpense: 4_000_000,
      difference: 1_000_000,
      percentageChange: 25,
      direction: "up",
    });

    const down = getSpendingTrend([
      { monthKey: "2026-10", label: "T10/2026", income: 0, expense: 5_000_000, balance: -5_000_000 },
      { monthKey: "2026-11", label: "T11/2026", income: 0, expense: 4_000_000, balance: -4_000_000 },
    ]);
    expect(down.direction).toBe("down");
    expect(down.percentageChange).toBe(-20);

    const flat = getSpendingTrend([
      { monthKey: "2026-10", label: "T10/2026", income: 0, expense: 3_000_000, balance: -3_000_000 },
      { monthKey: "2026-11", label: "T11/2026", income: 0, expense: 3_000_000, balance: -3_000_000 },
    ]);
    expect(flat.direction).toBe("flat");
    expect(flat.percentageChange).toBe(0);
  });

  it("trả percentageChange = null khi tháng trước chi tiêu bằng 0", () => {
    const trend = getSpendingTrend([
      { monthKey: "2026-10", label: "T10/2026", income: 0, expense: 0, balance: 0 },
      { monthKey: "2026-11", label: "T11/2026", income: 0, expense: 2_000_000, balance: -2_000_000 },
    ]);

    expect(trend).toEqual({
      currentExpense: 2_000_000,
      previousExpense: 0,
      difference: 2_000_000,
      percentageChange: null,
      direction: "up",
    });
  });
});

describe("calculateBudgetStatuses", () => {
  it("tính đúng số tiền đã chi theo tháng/danh mục, % và phân loại SAFE / WARNING / EXCEEDED", () => {
    const budgets = [
      { id: "b-1", category: "FOOD", month: 11, year: 2026, limit: 2_000_000 },
      { id: "b-2", category: "TRANSPORT", month: 11, year: 2026, limit: 1_000_000 },
      { id: "b-3", category: "SHOPPING", month: 11, year: 2026, limit: 1_000_000 },
    ];

    const transactions = [
      { type: "EXPENSE" as const, category: "FOOD", amount: 1_600_000, date: new Date(2026, 10, 5) },     // T11 -> 80% WARNING
      { type: "EXPENSE" as const, category: "FOOD", amount: 900_000, date: new Date(2026, 9, 25) },       // T10 -> bỏ qua
      { type: "INCOME" as const, category: "FOOD", amount: 5_000_000, date: new Date(2026, 10, 10) },     // INCOME -> bỏ qua
      { type: "EXPENSE" as const, category: "TRANSPORT", amount: 1_200_000, date: new Date(2026, 10, 8) },// 120% EXCEEDED
      { type: "EXPENSE" as const, category: "SHOPPING", amount: 500_000, date: new Date(2026, 10, 12) },  // 50% SAFE
    ];

    const statuses = calculateBudgetStatuses(budgets, transactions);

    expect(statuses.map((s) => s.id)).toEqual(["b-2", "b-1", "b-3"]);
    expect(statuses[0]).toMatchObject({
      spent: 1_200_000,
      remaining: -200_000,
      percentage: 120,
      progressPercent: 100,
      alertLevel: "EXCEEDED",
    });
    expect(statuses[1]).toMatchObject({
      spent: 1_600_000,
      remaining: 400_000,
      percentage: 80,
      progressPercent: 80,
      alertLevel: "WARNING",
    });
    expect(statuses[2]).toMatchObject({
      spent: 500_000,
      remaining: 500_000,
      percentage: 50,
      progressPercent: 50,
      alertLevel: "SAFE",
    });
  });
});

describe("getBudgetAlertNotifications", () => {
  it("chỉ thông báo mốc cao nhất khi nhảy cóc vượt 100% và không lặp lại mốc đã báo", () => {
    const statuses = calculateBudgetStatuses(
      [{ id: "b-1", category: "FOOD", month: 11, year: 2026, limit: 1_000_000 }],
      [{ type: "EXPENSE", category: "FOOD", amount: 1_100_000, date: new Date(2026, 10, 15) }]
    );

    const first = getBudgetAlertNotifications(statuses, new Set(), { FOOD: "Ăn uống" });
    expect(first.notifications).toHaveLength(1);
    expect(first.notifications[0]?.threshold).toBe(100);
    expect(first.notifications[0]?.message).toContain("Ăn uống");
    expect(first.notifications[0]?.message).toContain("vượt 100%");
    expect(first.keysToMark).toEqual(["b-1:2026-11:80", "b-1:2026-11:100"]);

    const second = getBudgetAlertNotifications(
      statuses,
      new Set(first.keysToMark),
      { FOOD: "Ăn uống" }
    );
    expect(second.notifications).toHaveLength(0);
  });
});