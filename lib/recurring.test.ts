import { describe, expect, it } from "vitest";
import {
  buildRecurringDate,
  clampDayOfMonth,
  formatRecurringMonth,
  getDaysInMonth,
  shouldGenerateForMonth,
} from "@/lib/recurring";

describe("recurring helpers", () => {
  it("tính đúng số ngày trong tháng kể cả năm nhuận", () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2024, 2)).toBe(29);
    expect(getDaysInMonth(2026, 4)).toBe(30);
    expect(getDaysInMonth(2026, 11)).toBe(30);
  });

  it("kẹp ngày 31 về cuối tháng khi tháng có ít hơn 31 ngày", () => {
    expect(clampDayOfMonth(2026, 2, 31)).toBe(28);
    expect(clampDayOfMonth(2024, 2, 31)).toBe(29);
    expect(clampDayOfMonth(2026, 4, 31)).toBe(30);
    expect(clampDayOfMonth(2026, 12, 15)).toBe(15);
  });

  it("định dạng recurringMonth và tạo Date đúng ngày", () => {
    expect(formatRecurringMonth(2026, 2)).toBe("2026-02");
    expect(formatRecurringMonth(2026, 11)).toBe("2026-11");

    const date = buildRecurringDate(2026, 2, 31);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1); // Tháng 2 (0-indexed)
    expect(date.getDate()).toBe(28);
  });

  it("chỉ sinh giao dịch khi đang bật, chưa sinh tháng này và đã tới ngày", () => {
    const now = new Date(2026, 10, 25, 10, 0, 0); // 25/11/2026

    // Đã tới ngày 5, chưa sinh lần nào -> true
    expect(
      shouldGenerateForMonth(
        {
          isActive: true,
          dayOfMonth: 5,
          lastGeneratedYear: null,
          lastGeneratedMonth: null,
        },
        now
      )
    ).toBe(true);

    // Đã sinh tháng 11/2026 rồi -> false (chống sinh trùng)
    expect(
      shouldGenerateForMonth(
        {
          isActive: true,
          dayOfMonth: 5,
          lastGeneratedYear: 2026,
          lastGeneratedMonth: 11,
        },
        now
      )
    ).toBe(false);

    // Đã sinh tháng 10/2026, sang tháng 11/2026 -> true
    expect(
      shouldGenerateForMonth(
        {
          isActive: true,
          dayOfMonth: 5,
          lastGeneratedYear: 2026,
          lastGeneratedMonth: 10,
        },
        now
      )
    ).toBe(true);

    // Chưa tới ngày (ngày 28 > ngày 25) -> false
    expect(
      shouldGenerateForMonth(
        {
          isActive: true,
          dayOfMonth: 28,
          lastGeneratedYear: null,
          lastGeneratedMonth: null,
        },
        now
      )
    ).toBe(false);

    // Đang tạm dừng -> false
    expect(
      shouldGenerateForMonth(
        {
          isActive: false,
          dayOfMonth: 5,
          lastGeneratedYear: null,
          lastGeneratedMonth: null,
        },
        now
      )
    ).toBe(false);
  });

  it("tự sinh vào ngày cuối tháng 2 nếu dayOfMonth = 31", () => {
    const feb28 = new Date(2026, 1, 28, 9, 0, 0); // 28/02/2026
    expect(
      shouldGenerateForMonth(
        {
          isActive: true,
          dayOfMonth: 31,
          lastGeneratedYear: 2026,
          lastGeneratedMonth: 1,
        },
        feb28
      )
    ).toBe(true);
  });
});