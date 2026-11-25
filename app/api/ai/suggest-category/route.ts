import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { CATEGORY_LABELS } from "@/lib/constants";
import { requireUser, UnauthorizedError } from "@/lib/dal";
import {
  GeminiServiceError,
  suggestCategoryWithGemini,
} from "@/lib/gemini-category";
import { checkRateLimit } from "@/lib/rate-limit";
import { suggestCategoryInputSchema } from "@/lib/validations/ai-category";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const rateLimit = checkRateLimit(`ai-suggest:${user.id}`, {
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Bạn đã dùng vượt giới hạn gợi ý AI. Vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Dữ liệu gửi lên không đúng định dạng JSON." },
      { status: 400 }
    );
  }

  const parsed = suggestCategoryInputSchema.safeParse(body);
  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    const firstMessage =
      flattened.fieldErrors.description?.[0] ??
      flattened.fieldErrors.type?.[0] ??
      "Dữ liệu đầu vào không hợp lệ.";

    return NextResponse.json(
      {
        error: firstMessage,
        fieldErrors: flattened.fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const category = await suggestCategoryWithGemini({
      description: parsed.data.description,
      type: parsed.data.type,
    });

    return NextResponse.json(
      {
        category,
        label: CATEGORY_LABELS[category],
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }

    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi gợi ý danh mục." },
      { status: 500 }
    );
  }
}