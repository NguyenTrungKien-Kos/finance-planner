import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GeminiServiceError,
  sanitizeDescriptionForAI,
  suggestCategoryWithGemini,
} from "@/lib/gemini-category";

describe("sanitizeDescriptionForAI", () => {
  it("che email và số điện thoại/số tài khoản trước khi gửi sang AI", () => {
    const raw =
      "Chuyển tiền cho an.nguyen@example.com SĐT 0912345678 STK 19034567890123";
    const sanitized = sanitizeDescriptionForAI(raw);

    expect(sanitized).not.toContain("an.nguyen@example.com");
    expect(sanitized).not.toContain("0912345678");
    expect(sanitized).not.toContain("19034567890123");
    expect(sanitized).toContain("[email]");
    expect(sanitized).toContain("[number]");
  });

  it("giữ nguyên mô tả giao dịch thông thường", () => {
    expect(sanitizeDescriptionForAI("  Cơm trưa văn phòng 45k  ")).toBe(
      "Cơm trưa văn phòng 45k"
    );
  });
});

describe("suggestCategoryWithGemini", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ném lỗi 503 khi thiếu GEMINI_API_KEY ở server", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      suggestCategoryWithGemini({ description: "Cơm trưa", type: "EXPENSE" })
    ).rejects.toMatchObject({
      name: "GeminiServiceError",
      status: 503,
    });
  });

  it("trả về danh mục hợp lệ và không gửi dữ liệu cá nhân trong request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ category: "FOOD" }) }],
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const category = await suggestCategoryWithGemini({
      description: "Ăn trưa với test@gmail.com 0987654321",
      type: "EXPENSE",
    });

    expect(category).toBe("FOOD");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = String(init.body);
    expect(sentBody).not.toContain("test@gmail.com");
    expect(sentBody).not.toContain("0987654321");
    expect(sentBody).toContain("[email]");
    expect(sentBody).toContain("[number]");
  });

  it("ném lỗi 429 khi Gemini API báo vượt giới hạn", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }))
    );

    await expect(
      suggestCategoryWithGemini({ description: "Đổ xăng", type: "EXPENSE" })
    ).rejects.toThrow(GeminiServiceError);

    await expect(
      suggestCategoryWithGemini({ description: "Đổ xăng", type: "EXPENSE" })
    ).rejects.toMatchObject({ status: 429 });
  });

  it("ném lỗi 502 khi AI trả về danh mục không nằm trong danh sách hỗ trợ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ category: "UNKNOWN_CAT" }) }],
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    await expect(
      suggestCategoryWithGemini({ description: "Mua sách", type: "EXPENSE" })
    ).rejects.toMatchObject({ status: 502 });
  });
});