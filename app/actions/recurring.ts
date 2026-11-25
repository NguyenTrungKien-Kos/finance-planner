"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { syncRecurringTransactions } from "@/lib/recurring-sync";
import { recurringTransactionSchema } from "@/lib/validations/recurring";

export type RecurringActionState = {
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

export async function createRecurringAction(
  _prevState: RecurringActionState,
  formData: FormData
): Promise<RecurringActionState> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  const raw = {
    amount: formData.get("amount"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    dayOfMonth: formData.get("dayOfMonth"),
  };

  const parsed = recurringTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await prisma.recurringTransaction.create({
      data: {
        userId: authResult.userId,
        amount: parsed.data.amount,
        description: parsed.data.description,
        type: parsed.data.type,
        category: parsed.data.category,
        dayOfMonth: parsed.data.dayOfMonth,
      },
    });

    await syncRecurringTransactions(authResult.userId);
    revalidatePath("/");
    return { success: true, message: "Đã thêm giao dịch định kỳ." };
  } catch {
    return {
      success: false,
      message: "Không thể thêm giao dịch định kỳ. Vui lòng thử lại.",
    };
  }
}

export async function updateRecurringAction(
  _prevState: RecurringActionState,
  formData: FormData
): Promise<RecurringActionState> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, message: "Thiếu mã giao dịch định kỳ." };
  }

  const raw = {
    amount: formData.get("amount"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    dayOfMonth: formData.get("dayOfMonth"),
  };

  const parsed = recurringTransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const updated = await prisma.recurringTransaction.updateMany({
      where: { id, userId: authResult.userId },
      data: {
        amount: parsed.data.amount,
        description: parsed.data.description,
        type: parsed.data.type,
        category: parsed.data.category,
        dayOfMonth: parsed.data.dayOfMonth,
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy quy tắc hoặc bạn không có quyền sửa.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã cập nhật giao dịch định kỳ." };
  } catch {
    return {
      success: false,
      message: "Không thể cập nhật giao dịch định kỳ. Vui lòng thử lại.",
    };
  }
}

export async function toggleRecurringAction(
  id: string,
  nextActive: boolean
): Promise<{ success: boolean; message: string }> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, message: "Thiếu mã giao dịch định kỳ." };
  }

  try {
    const updated = await prisma.recurringTransaction.updateMany({
      where: { id, userId: authResult.userId },
      data: { isActive: nextActive },
    });

    if (updated.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy quy tắc hoặc bạn không có quyền thao tác.",
      };
    }

    if (nextActive) {
      await syncRecurringTransactions(authResult.userId);
    }

    revalidatePath("/");
    return {
      success: true,
      message: nextActive
        ? "Đã kích hoạt lại giao dịch định kỳ."
        : "Đã tạm dừng giao dịch định kỳ.",
    };
  } catch {
    return {
      success: false,
      message: "Không thể thay đổi trạng thái. Vui lòng thử lại.",
    };
  }
}

export async function deleteRecurringAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, message: "Thiếu mã giao dịch định kỳ." };
  }

  try {
    const deleted = await prisma.recurringTransaction.deleteMany({
      where: { id, userId: authResult.userId },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy quy tắc hoặc bạn không có quyền xoá.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã xoá giao dịch định kỳ." };
  } catch {
    return {
      success: false,
      message: "Không thể xoá giao dịch định kỳ. Vui lòng thử lại.",
    };
  }
}