"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations/budget";

export type BudgetActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

async function getAuthorizedUserId(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  try {
    const user = await requireUser();
    return { ok: true, userId: user.id };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, message: err.message };
    }
    throw err;
  }
}

export async function upsertBudgetAction(
  _prevState: BudgetActionState,
  formData: FormData
): Promise<BudgetActionState> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  const raw = {
    category: formData.get("category"),
    month: formData.get("month"),
    year: formData.get("year"),
    limit: formData.get("limit"),
  };

  const parsed = budgetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await prisma.categoryBudget.upsert({
      where: {
        userId_category_year_month: {
          userId: authResult.userId,
          category: parsed.data.category,
          year: parsed.data.year,
          month: parsed.data.month,
        },
      },
      create: {
        userId: authResult.userId,
        category: parsed.data.category,
        month: parsed.data.month,
        year: parsed.data.year,
        limit: parsed.data.limit,
      },
      update: {
        limit: parsed.data.limit,
      },
    });

    revalidatePath("/");
    return { success: true, message: "Đã lưu hạn mức ngân sách." };
  } catch {
    return {
      success: false,
      message: "Không thể lưu ngân sách. Vui lòng thử lại.",
    };
  }
}

export async function deleteBudgetAction(
  id: string
): Promise<BudgetActionState> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  if (!id || typeof id !== "string") {
    return { success: false, message: "Thiếu mã ngân sách cần xoá." };
  }

  try {
    const deleted = await prisma.categoryBudget.deleteMany({
      where: { id, userId: authResult.userId },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy ngân sách hoặc bạn không có quyền xoá.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã xoá ngân sách." };
  } catch {
    return {
      success: false,
      message: "Không thể xoá ngân sách. Vui lòng thử lại.",
    };
  }
}