import { z } from "zod";
import { PRIORITIES } from "@/lib/constants";

export const wishlistSchema = z.object({
  name: z
    .string({ error: "Vui lòng nhập tên món đồ" })
    .trim()
    .min(1, { error: "Tên món đồ không được để trống" })
    .max(80, { error: "Tên món đồ tối đa 80 ký tự" }),
  cost: z.coerce
    .number({ error: "Giá phải là số hợp lệ" })
    .int({ error: "Giá phải là số nguyên (VND)" })
    .positive({ error: "Giá phải lớn hơn 0" }),
  priority: z.enum(PRIORITIES, {
    error: "Vui lòng chọn mức ưu tiên hợp lệ",
  }),
  deadline: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined))
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      error: "Hạn chót không hợp lệ",
    }),
});

export type WishlistInput = z.infer<typeof wishlistSchema>;