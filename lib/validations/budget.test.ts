import { describe, expect, it } from "vitest";
import { budgetSchema } from "@/lib/validations/budget";

describe("budgetSchema", () => {
  it("chấp nhận dữ liệu ngân sách hợp lệ", () => {
    const parsed = budgetSchema.safeParse({
      category: "FOOD",
      month: "11",
      year: "2026",
      limit: "3000000",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        category: "FOOD",
        month: 11,
        year: 2026,
        limit: 3_000_000,
      });
    }
  });

  it("từ chối hạn mức <= 0 hoặc không phải số nguyên", () => {
    expect(
      budgetSchema.safeParse({
        category: "FOOD",
        month: 11,
        year: 2026,
        limit: 0,
      }).success
    ).toBe(false);

    expect(
      budgetSchema.safeParse({
        category: "FOOD",
        month: 11,
        year: 2026,
        limit: 1500.5,
      }).success
    ).toBe(false);
  });

  it("từ chối tháng ngoài khoảng 1-12 hoặc danh mục không hợp lệ", () => {
    expect(
      budgetSchema.safeParse({
        category: "FOOD",
        month: 13,
        year: 2026,
        limit: 1_000_000,
      }).success
    ).toBe(false);

    expect(
      budgetSchema.safeParse({
        category: "INVALID_CAT",
        month: 11,
        year: 2026,
        limit: 1_000_000,
      }).success
    ).toBe(false);
  });
});