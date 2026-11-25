import { z } from "zod";
import { CATEGORIES, TRANSACTION_TYPES } from "@/lib/constants";

export const suggestCategoryInputSchema = z.object({
  description: z
    .string({ error: "Vui lòng nhập mô tả giao dịch" })
    .trim()
    .min(2, { error: "Mô tả cần ít nhất 2 ký tự để gợi ý" })
    .max(120, { error: "Mô tả tối đa 120 ký tự" }),
  type: z
    .enum(TRANSACTION_TYPES, {
      error: "Loại giao dịch không hợp lệ",
    })
    .optional(),
});

export const suggestCategoryOutputSchema = z.object({
  category: z.enum(CATEGORIES),
});

export type SuggestCategoryInput = z.infer<typeof suggestCategoryInputSchema>;
export type SuggestCategoryOutput = z.infer<typeof suggestCategoryOutputSchema>;