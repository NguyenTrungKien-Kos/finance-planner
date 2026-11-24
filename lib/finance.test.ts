import { describe, expect, it } from "vitest";
import { calculateSummary, calculateWishlistProgress, getDateRange, getReachedMilestones, getWishlistMilestoneNotifications, getCategoryExpenseBreakdown } from "@/lib/finance";

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