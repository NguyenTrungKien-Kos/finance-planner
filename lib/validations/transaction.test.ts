import { describe, expect, it } from "vitest";
import { z } from "zod";
import { transactionSchema } from "@/lib/validations/transaction";

describe("transactionSchema (Zod 4)", () => {
  it("chấp nhận giao dịch hợp lệ và ép kiểu amount sang số nguyên", () => {
    const result = transactionSchema.safeParse({
      amount: "150000",
      description: "  Cơm trưa văn phòng  ",
      type: "EXPENSE",
      category: "FOOD",
      date: "2026-11-24",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(150000);
      expect(result.data.description).toBe("Cơm trưa văn phòng");
    }
  });

  it("từ chối số tiền <= 0 hoặc số thập phân", () => {
    const zeroResult = transactionSchema.safeParse({
      amount: "0",
      description: "Test",
      type: "EXPENSE",
      category: "FOOD",
      date: "2026-11-24",
    });
    expect(zeroResult.success).toBe(false);
    if (!zeroResult.success) {
      expect(z.flattenError(zeroResult.error).fieldErrors.amount).toBeDefined();
    }

    const floatResult = transactionSchema.safeParse({
      amount: "12.5",
      description: "Test",
      type: "EXPENSE",
      category: "FOOD",
      date: "2026-11-24",
    });
    expect(floatResult.success).toBe(false);
  });

  it("từ chối mô tả rỗng hoặc vượt quá 120 ký tự", () => {
    const emptyResult = transactionSchema.safeParse({
      amount: 50000,
      description: "   ",
      type: "INCOME",
      category: "SALARY",
      date: "2026-11-24",
    });
    expect(emptyResult.success).toBe(false);

    const longResult = transactionSchema.safeParse({
      amount: 50000,
      description: "a".repeat(121),
      type: "INCOME",
      category: "SALARY",
      date: "2026-11-24",
    });
    expect(longResult.success).toBe(false);
  });

  it("từ chối loại giao dịch, danh mục hoặc ngày không hợp lệ", () => {
    const result = transactionSchema.safeParse({
      amount: 50000,
      description: "Mua sách",
      type: "INVALID_TYPE",
      category: "UNKNOWN_CAT",
      date: "not-a-date",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = z.flattenError(result.error).fieldErrors;
      expect(fields.type).toBeDefined();
      expect(fields.category).toBeDefined();
      expect(fields.date).toBeDefined();
    }
  });
});