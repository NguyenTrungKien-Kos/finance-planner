import { describe, expect, it } from "vitest";
import { z } from "zod";
import { recurringTransactionSchema } from "@/lib/validations/recurring";

describe("recurringTransactionSchema (Zod 4)", () => {
  it("chấp nhận giao dịch định kỳ hợp lệ và ép kiểu số nguyên", () => {
    const result = recurringTransactionSchema.safeParse({
      amount: "15000000",
      description: "  Lương tháng  ",
      type: "INCOME",
      category: "SALARY",
      dayOfMonth: "5",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(15000000);
      expect(result.data.description).toBe("Lương tháng");
      expect(result.data.dayOfMonth).toBe(5);
    }
  });

  it("từ chối dayOfMonth nhỏ hơn 1 hoặc lớn hơn 31", () => {
    const lowResult = recurringTransactionSchema.safeParse({
      amount: 3500000,
      description: "Tiền trọ",
      type: "EXPENSE",
      category: "BILLS",
      dayOfMonth: 0,
    });
    expect(lowResult.success).toBe(false);
    if (!lowResult.success) {
      expect(
        z.flattenError(lowResult.error).fieldErrors.dayOfMonth
      ).toBeDefined();
    }

    const highResult = recurringTransactionSchema.safeParse({
      amount: 3500000,
      description: "Tiền trọ",
      type: "EXPENSE",
      category: "BILLS",
      dayOfMonth: 32,
    });
    expect(highResult.success).toBe(false);
    if (!highResult.success) {
      expect(
        z.flattenError(highResult.error).fieldErrors.dayOfMonth
      ).toBeDefined();
    }
  });

  it("từ chối số tiền <= 0 hoặc mô tả rỗng", () => {
    const result = recurringTransactionSchema.safeParse({
      amount: "-100",
      description: "   ",
      type: "EXPENSE",
      category: "BILLS",
      dayOfMonth: 10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = z.flattenError(result.error).fieldErrors;
      expect(fields.amount).toBeDefined();
      expect(fields.description).toBeDefined();
    }
  });
});