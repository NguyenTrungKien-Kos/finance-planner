import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";

export const budgetSchema = z.object({
  category: z.enum(CATEGORIES, {
    error: "Vui lòng chọn danh mục hợp lệ",
  }),
  month: z.coerce
    .number({ error: "Tháng phải là số hợp lệ" })
    .int({ error: "Tháng phải là số nguyên" })
    .min(1, { error: "Tháng phải từ 1 đến 12" })
    .max(12, { error: "Tháng phải từ 1 đến 12" }),
  year: z.coerce
    .number({ error: "Năm phải là số hợp lệ" })
    .int({ error: "Năm phải là số nguyên" })
    .min(2000, { error: "Năm không hợp lệ" })
    .max(2100, { error: "Năm không hợp lệ" }),
  limit: z.coerce
    .number({ error: "Hạn mức phải là số hợp lệ" })
    .int({ error: "Hạn mức phải là số nguyên (VND)" })
    .positive({ error: "Hạn mức phải lớn hơn 0" }),
});

export type BudgetInput = z.infer<typeof budgetSchema>;