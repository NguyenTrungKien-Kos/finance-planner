import { describe, expect, it } from "vitest";
import {
  CSV_HEADERS,
  MAX_CSV_IMPORT_ROWS,
  isValidIsoDate,
  parseTransactionsCsv,
  transactionsToCsv,
} from "@/lib/csv";

describe("isValidIsoDate", () => {
  it("chấp nhận ngày YYYY-MM-DD hợp lệ và từ chối ngày không tồn tại trên lịch", () => {
    expect(isValidIsoDate("2026-11-25")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true); // Năm nhuận
    expect(isValidIsoDate("2026-02-29")).toBe(false); // 2026 không nhuận
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("25/11/2026")).toBe(false);
  });
});

describe("transactionsToCsv", () => {
  it("xuất CSV có UTF-8 BOM, đúng thứ tự 6 cột và escape dấu phẩy, ngoặc kép", () => {
    const csv = transactionsToCsv([
      {
        date: new Date(2026, 10, 25, 12, 0, 0),
        type: "EXPENSE",
        category: "FOOD",
        amount: 55000,
        description: 'Cơm tấm, "sườn bì"',
      },
    ]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
    expect(lines[0]).toBe(CSV_HEADERS.join(","));
    expect(lines[1]).toBe(
      '"Cơm tấm, ""sườn bì""",FOOD,EXPENSE,2026-11-25,55000,VND'
    );
  });

  it("chặn CSV formula injection với ô bắt đầu bằng =, +, -, @", () => {
    const csv = transactionsToCsv([
      {
        date: new Date(2026, 10, 25, 12, 0, 0),
        type: "EXPENSE",
        category: "OTHER",
        amount: 10000,
        description: "=SUM(A1:A2)",
      },
    ]);

    expect(csv).toContain("'=SUM(A1:A2)");
  });
});

describe("parseTransactionsCsv", () => {
  it("parse thành công CSV hợp lệ kể cả có BOM, dấu phẩy trong ngoặc kép và chữ thường", () => {
    const input = [
      "\uFEFFdescription,category,type,date,amount,currency",
      '"Ăn trưa, cà phê",food,expense,2026-11-25,120000,vnd',
      "Lương tháng 11,SALARY,INCOME,2026-11-01,15000000,VND",
    ].join("\n");

    const result = parseTransactionsCsv(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        date: new Date("2026-11-25T12:00:00"),
        type: "EXPENSE",
        category: "FOOD",
        amount: 120000,
        description: "Ăn trưa, cà phê",
      });
      expect(result.rows[1]?.amount).toBe(15000000);
    }
  });

  it("từ chối file rỗng, sai thứ tự header hoặc không có dòng dữ liệu", () => {
    expect(parseTransactionsCsv("   ").ok).toBe(false);

    const wrongHeader = parseTransactionsCsv(
      "date,type,category,amount,description,currency\n2026-11-25,EXPENSE,FOOD,50000,Bún bò,VND"
    );
    expect(wrongHeader.ok).toBe(false);

    const headerOnly = parseTransactionsCsv(
      "description,category,type,date,amount,currency\n"
    );
    expect(headerOnly.ok).toBe(false);
  });

  it("từ chối file có dấu ngoặc kép chưa đóng", () => {
    const broken = [
      "description,category,type,date,amount,currency",
      '"Cơm trưa chưa đóng ngoặc,FOOD,EXPENSE,2026-11-25,50000,VND',
    ].join("\n");

    const result = parseTransactionsCsv(broken);
    expect(result.ok).toBe(false);
  });

  it("trả về danh sách lỗi theo từng dòng khi sai số cột, ngày, loại, danh mục, số tiền hoặc currency", () => {
    const invalidCsv = [
      "description,category,type,date,amount,currency",
      "Sai ngày,FOOD,EXPENSE,2026-02-30,50000,VND",
      "Sai loại và âm tiền,UNKNOWN,WRONG,2026-11-25,-100,VND",
      "Số thập phân và sai tiền tệ,FOOD,EXPENSE,2026-11-25,12.5,USD",
      "Thiếu cột,FOOD,EXPENSE",
    ].join("\n");

    const result = parseTransactionsCsv(invalidCsv);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rowErrors).toHaveLength(4);
      expect(result.rowErrors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
    }
  });

  it("từ chối khi vượt quá giới hạn số dòng cho phép", () => {
    const dataLines = Array.from(
      { length: MAX_CSV_IMPORT_ROWS + 1 },
      () => "Test,FOOD,EXPENSE,2026-11-25,20000,VND"
    );
    const hugeCsv = [
      "description,category,type,date,amount,currency",
      ...dataLines,
    ].join("\n");

    const result = parseTransactionsCsv(hugeCsv);
    expect(result.ok).toBe(false);
  });
});