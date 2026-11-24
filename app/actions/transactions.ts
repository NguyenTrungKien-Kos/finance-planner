"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations/transaction";

export type TransactionActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// Tạm dùng cho mốc fp2 (chưa có Better Auth).
// Sang Ngày 3 (fp3), ta sẽ thay hàm này bằng requireUser() từ session.
async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: "demo@financeplanner.local" },
    select: { id: true },
  });
  if (!user) {
    throw new Error("Không tìm thấy tài khoản demo. Hãy chạy npx prisma db seed.");
  }
  return user.id;
}

function parseLocalDate(dateStr: string): Date {
  return dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(`${dateStr}T12:00:00`);
}

export async function createTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const raw = {
    amount: formData.get("amount"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    date: formData.get("date"),
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const userId = await getDemoUserId();
    await prisma.transaction.create({
      data: {
        userId,
        amount: parsed.data.amount,
        description: parsed.data.description,
        type: parsed.data.type,
        category: parsed.data.category,
        date: parseLocalDate(parsed.data.date),
      },
    });

    revalidatePath("/");
    return { success: true, message: "Đã thêm giao dịch thành công." };
  } catch {
    return {
      success: false,
      message: "Không thể thêm giao dịch. Vui lòng thử lại.",
    };
  }
}

export async function updateTransactionAction(
  _prevState: TransactionActionState,
  formData: FormData
): Promise<TransactionActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, message: "Thiếu mã giao dịch cần cập nhật." };
  }

  const raw = {
    amount: formData.get("amount"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    date: formData.get("date"),
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const userId = await getDemoUserId();
    const updated = await prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        amount: parsed.data.amount,
        description: parsed.data.description,
        type: parsed.data.type,
        category: parsed.data.category,
        date: parseLocalDate(parsed.data.date),
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy giao dịch hoặc bạn không có quyền sửa.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã cập nhật giao dịch." };
  } catch {
    return {
      success: false,
      message: "Không thể cập nhật giao dịch. Vui lòng thử lại.",
    };
  }
}

export async function deleteTransactionAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "Mã giao dịch không hợp lệ." };
  }

  try {
    const userId = await getDemoUserId();
    const deleted = await prisma.transaction.deleteMany({
      where: { id: parsedId.data, userId },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy giao dịch hoặc bạn không có quyền xoá.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã xoá giao dịch." };
  } catch {
    return {
      success: false,
      message: "Không thể xoá giao dịch. Vui lòng thử lại.",
    };
  }
}