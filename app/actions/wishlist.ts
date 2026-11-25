"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { wishlistSchema } from "@/lib/validations/wishlist";

export type WishlistActionState = {
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

function parseLocalDate(dateStr: string): Date {
  return dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(`${dateStr}T12:00:00`);
}

export async function createWishlistAction(
  _prevState: WishlistActionState,
  formData: FormData
): Promise<WishlistActionState> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  const rawDeadline = formData.get("deadline");
  const raw = {
    name: formData.get("name"),
    cost: formData.get("cost"),
    priority: formData.get("priority"),
    deadline: typeof rawDeadline === "string" ? rawDeadline : undefined,
  };

  const parsed = wishlistSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await prisma.wishlistItem.create({
      data: {
        userId: authResult.userId,
        name: parsed.data.name,
        cost: parsed.data.cost,
        priority: parsed.data.priority,
        deadline: parsed.data.deadline
          ? parseLocalDate(parsed.data.deadline)
          : null,
      },
    });

    revalidatePath("/");
    return { success: true, message: "Đã thêm món đồ vào Wishlist." };
  } catch {
    return {
      success: false,
      message: "Không thể thêm món đồ. Vui lòng thử lại.",
    };
  }
}

export async function updateWishlistAction(
  _prevState: WishlistActionState,
  formData: FormData
): Promise<WishlistActionState> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, message: "Thiếu mã món đồ cần cập nhật." };
  }

  const rawDeadline = formData.get("deadline");
  const raw = {
    name: formData.get("name"),
    cost: formData.get("cost"),
    priority: formData.get("priority"),
    deadline: typeof rawDeadline === "string" ? rawDeadline : undefined,
  };

  const parsed = wishlistSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const updated = await prisma.wishlistItem.updateMany({
      where: { id, userId: authResult.userId },
      data: {
        name: parsed.data.name,
        cost: parsed.data.cost,
        priority: parsed.data.priority,
        deadline: parsed.data.deadline
          ? parseLocalDate(parsed.data.deadline)
          : null,
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy món đồ hoặc bạn không có quyền sửa.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã cập nhật Wishlist." };
  } catch {
    return {
      success: false,
      message: "Không thể cập nhật Wishlist. Vui lòng thử lại.",
    };
  }
}

export async function deleteWishlistAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const authResult = await getAuthorizedUserId();
  if (!authResult.ok) {
    return { success: false, message: authResult.message };
  }

  const parsedId = z.string().min(1).safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "Mã món đồ không hợp lệ." };
  }

  try {
    const deleted = await prisma.wishlistItem.deleteMany({
      where: { id: parsedId.data, userId: authResult.userId },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        message: "Không tìm thấy món đồ hoặc bạn không có quyền xoá.",
      };
    }

    revalidatePath("/");
    return { success: true, message: "Đã xoá món đồ khỏi Wishlist." };
  } catch {
    return {
      success: false,
      message: "Không thể xoá món đồ. Vui lòng thử lại.",
    };
  }
}