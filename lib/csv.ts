import { z } from "zod";
import {
  transactionSchema,
  type TransactionInput,
} from "@/lib/validations/transaction";

export const CSV_HEADERS = [
  "description",
  "category",
  "type",
  "date",
  "amount",
  "currency",
] as const;

export const SUPPORTED_CSV_CURRENCY = "VND";
export const MAX_CSV_IMPORT_ROWS = 500;
export const MAX_CSV_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB

export type ExportableTransaction = {
  date: Date;
  type: TransactionInput["type"];
  category: TransactionInput["category"];
  amount: number;
  description: string;
};

export type ParsedCsvTransaction = {
  date: Date;
  type: TransactionInput["type"];
  category: TransactionInput["category"];
  amount: number;
  description: string;
};

export type CsvRowError = {
  row: number; // Số dòng 1-based trong file CSV (header là dòng 1)
  errors: string[];
};

export type ParseTransactionsCsvResult =
  | {
      ok: true;
      rows: ParsedCsvTransaction[];
    }
  | {
      ok: false;
      error: string;
      rowErrors: CsvRowError[];
    };

function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sanitizeFormulaCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

export function escapeCsvCell(rawValue: string | number): string {
  const str = sanitizeFormulaCell(String(rawValue));
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function transactionsToCsv(
  transactions: ReadonlyArray<ExportableTransaction>
): string {
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const tx of transactions) {
    lines.push(
      [
        escapeCsvCell(tx.description),
        escapeCsvCell(tx.category),
        escapeCsvCell(tx.type),
        escapeCsvCell(formatDateYmd(tx.date)),
        escapeCsvCell(tx.amount),
        escapeCsvCell(SUPPORTED_CSV_CURRENCY),
      ].join(",")
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

type RawCsvRecord = {
  lineNumber: number;
  fields: string[];
};

function parseCsvRecords(
  input: string
): { ok: true; records: RawCsvRecord[] } | { ok: false; error: string } {
  const text = input.replace(/^\uFEFF/, "");
  const records: RawCsvRecord[] = [];

  let currentFields: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let lineNumber = 1;
  let recordStartLine = 1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") {
          lineNumber++;
        }
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      if (currentField.length > 0) {
        return {
          ok: false,
          error: `Dòng ${lineNumber}: Dấu ngoặc kép xuất hiện giữa ô dữ liệu không hợp lệ.`,
        };
      }
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      currentFields.push(currentField);
      currentField = "";
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") {
        i++;
      }
      currentFields.push(currentField);
      const isBlankLine =
        currentFields.length === 1 && currentFields[0].trim() === "";
      if (!isBlankLine) {
        records.push({ lineNumber: recordStartLine, fields: currentFields });
      }
      currentFields = [];
      currentField = "";
      lineNumber++;
      recordStartLine = lineNumber;
      continue;
    }

    currentField += ch;
  }

  if (inQuotes) {
    return {
      ok: false,
      error: "File CSV có dấu ngoặc kép chưa được đóng đúng cách.",
    };
  }

  if (currentField.length > 0 || currentFields.length > 0) {
    currentFields.push(currentField);
    const isBlankLine =
      currentFields.length === 1 && currentFields[0].trim() === "";
    if (!isBlankLine) {
      records.push({ lineNumber: recordStartLine, fields: currentFields });
    }
  }

  return { ok: true, records };
}

export function parseTransactionsCsv(
  csvText: string
): ParseTransactionsCsvResult {
  if (csvText.trim().length === 0) {
    return {
      ok: false,
      error: "File CSV đang trống.",
      rowErrors: [],
    };
  }

  const parsedRecords = parseCsvRecords(csvText);
  if (!parsedRecords.ok) {
    return {
      ok: false,
      error: parsedRecords.error,
      rowErrors: [],
    };
  }

  if (parsedRecords.records.length === 0) {
    return {
      ok: false,
      error: "File CSV không có dữ liệu.",
      rowErrors: [],
    };
  }

  const [headerRecord, ...dataRecords] = parsedRecords.records;
  const normalizedHeaders = headerRecord.fields.map((h) =>
    h.trim().toLowerCase()
  );

  const hasValidHeader =
    normalizedHeaders.length === CSV_HEADERS.length &&
    CSV_HEADERS.every((expected, idx) => normalizedHeaders[idx] === expected);

  if (!hasValidHeader) {
    return {
      ok: false,
      error: `Header CSV không hợp lệ. Yêu cầu đúng thứ tự cột: ${CSV_HEADERS.join(",")}.`,
      rowErrors: [],
    };
  }

  if (dataRecords.length === 0) {
    return {
      ok: false,
      error: "File CSV chỉ có dòng tiêu đề, chưa có giao dịch nào.",
      rowErrors: [],
    };
  }

  if (dataRecords.length > MAX_CSV_IMPORT_ROWS) {
    return {
      ok: false,
      error: `Mỗi lần nhập chỉ hỗ trợ tối đa ${MAX_CSV_IMPORT_ROWS} dòng giao dịch.`,
      rowErrors: [],
    };
  }

  const rows: ParsedCsvTransaction[] = [];
  const rowErrors: CsvRowError[] = [];

  for (const record of dataRecords) {
    if (record.fields.length !== CSV_HEADERS.length) {
      rowErrors.push({
        row: record.lineNumber,
        errors: [
          `Thiếu hoặc dư cột (cần ${CSV_HEADERS.length} cột, nhận được ${record.fields.length}).`,
        ],
      });
      continue;
    }

    const [
      rawDescription,
      rawCategory,
      rawType,
      rawDate,
      rawAmount,
      rawCurrency,
    ] = record.fields;

    const descriptionStr = rawDescription.trim();
    const categoryStr = rawCategory.trim().toUpperCase();
    const typeStr = rawType.trim().toUpperCase();
    const dateStr = rawDate.trim();
    const amountStr = rawAmount.trim();
    const currencyStr = rawCurrency.trim().toUpperCase();

    const errorsForRow: string[] = [];

    if (!isValidIsoDate(dateStr)) {
      errorsForRow.push("Ngày phải theo định dạng YYYY-MM-DD hợp lệ.");
    }

    if (!/^\d+$/.test(amountStr)) {
      errorsForRow.push(
        "Số tiền phải là số nguyên dương (không chứa ký tự hoặc dấu thập phân)."
      );
    }

    if (currencyStr !== SUPPORTED_CSV_CURRENCY) {
      errorsForRow.push(
        `Đơn vị tiền tệ (currency) hiện chỉ hỗ trợ ${SUPPORTED_CSV_CURRENCY}.`
      );
    }

    const validated = transactionSchema.safeParse({
      date: dateStr,
      type: typeStr,
      category: categoryStr,
      amount: amountStr,
      description: descriptionStr,
    });

    if (!validated.success) {
      const flattened = z.flattenError(validated.error);
      for (const fieldMessages of Object.values(flattened.fieldErrors)) {
        if (!fieldMessages) continue;
        for (const msg of fieldMessages) {
          if (!errorsForRow.includes(msg)) {
            errorsForRow.push(msg);
          }
        }
      }
    }

    if (errorsForRow.length > 0 || !validated.success) {
      rowErrors.push({
        row: record.lineNumber,
        errors: errorsForRow,
      });
      continue;
    }

    rows.push({
      date: new Date(`${dateStr}T12:00:00`),
      type: validated.data.type,
      category: validated.data.category,
      amount: validated.data.amount,
      description: validated.data.description,
    });
  }

  if (rowErrors.length > 0) {
    return {
      ok: false,
      error: `Có ${rowErrors.length} dòng dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.`,
      rowErrors,
    };
  }

  return { ok: true, rows };
}