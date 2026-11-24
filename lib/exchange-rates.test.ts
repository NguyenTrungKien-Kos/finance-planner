import { describe, expect, it } from "vitest";
import {
  convertFromVnd,
  convertToVnd,
  parseExchangeRatesPayload,
} from "@/lib/exchange-rates";

describe("parseExchangeRatesPayload", () => {
  it("parse đúng tỉ giá USD -> VND và EUR -> VND từ open.er-api.com", () => {
    const parsed = parseExchangeRatesPayload({
      result: "success",
      time_last_update_utc: "Tue, 24 Nov 2026 00:00:01 +0000",
      rates: {
        USD: 1,
        VND: 25400,
        EUR: 0.92,
      },
    });

    expect(parsed).toEqual({
      usdToVnd: 25400,
      eurToVnd: 27609,
      updatedAt: "Tue, 24 Nov 2026 00:00:01 +0000",
    });
  });

  it("trả về null khi payload lỗi hoặc thiếu tỉ giá hợp lệ", () => {
    expect(parseExchangeRatesPayload(null)).toBeNull();
    expect(parseExchangeRatesPayload({ result: "error" })).toBeNull();
    expect(
      parseExchangeRatesPayload({
        result: "success",
        rates: { VND: 0, EUR: 0.92 },
      })
    ).toBeNull();
  });
});

describe("currency conversion helpers", () => {
  const rates = { usdToVnd: 25_000, eurToVnd: 27_500 };

  it("quy đổi đúng USD và EUR sang VND", () => {
    expect(convertToVnd(100, "USD", rates)).toBe(2_500_000);
    expect(convertToVnd(100, "EUR", rates)).toBe(2_750_000);
    expect(convertToVnd(-10, "USD", rates)).toBe(0);
  });

  it("quy đổi đúng VND sang USD và EUR (làm tròn 2 chữ số thập phân)", () => {
    expect(convertFromVnd(5_000_000, "USD", rates)).toBe(200);
    expect(convertFromVnd(5_500_000, "EUR", rates)).toBe(200);
    expect(convertFromVnd(1_000_000, "USD", rates)).toBe(40);
  });
});