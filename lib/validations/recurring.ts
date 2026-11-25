import { z } from "zod";
import { CATEGORIES, TRANSACTION_TYPES } from "@/lib/constants";

export const recurringTransactionSchema = z.object({
  amount: z.coerce
    .number({ error: "Số tiền phải là số hợp lệ" })
    .int({ error: "Số tiền phải là số nguyên (VND)" })
    .positive({ error: "Số tiền phải lớn hơn 0" }),
  description: z
    .string({ error: "Vui lòng nhập mô tả" })
    .trim()
    .min(1, { error: "Mô tả không được để trống" })
    .max(120, { error: "Mô tả tối đa 120 ký tự" }),
  type: z.enum(TRANSACTION_TYPES, {
    error: "Vui lòng chọn loại giao dịch hợp lệ",
  }),
  category: z.enum(CATEGORIES, {
    error: "Vui lòng chọn danh mục hợp lệ",
  }),
  dayOfMonth: z.coerce
    .number({ error: "Ngày trong tháng phải là số hợp lệ" })
    .int({ error: "Ngày trong tháng phải là số nguyên" })
    .min(1, { error: "Ngày trong tháng phải từ 1 đến 31" })
    .max(31, { error: "Ngày trong tháng phải từ 1 đến 31" }),
});

export type RecurringTransactionInput = z.infer<
  typeof recurringTransactionSchema
>;