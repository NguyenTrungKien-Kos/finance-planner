import {
  CATEGORIES,
  CATEGORY_LABELS,
  type TRANSACTION_TYPES,
} from "@/lib/constants";
import { suggestCategoryOutputSchema } from "@/lib/validations/ai-category";

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
] as const;

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_TIMEOUT_MS = 6_000;

export type CategoryCode = (typeof CATEGORIES)[number];
type TransactionType = (typeof TRANSACTION_TYPES)[number];

export class GeminiServiceError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status = 502, retryable = false) {
    super(message);
    this.name = "GeminiServiceError";
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Loại bỏ thông tin cá nhân nhạy cảm (email, số điện thoại, số tài khoản/CCCD)
 * trước khi gửi mô tả giao dịch sang dịch vụ AI bên ngoài.
 */
export function sanitizeDescriptionForAI(rawDescription: string): string {
  return rawDescription
    .trim()
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]")
    .replace(/\b(?:\+?\d[\d\s.-]{6,}\d)\b/g, "[number]")
    .slice(0, 120)
    .trim();
}

function buildPrompt(
  sanitizedDescription: string,
  type?: TransactionType
): string {
  const categoryGuide = CATEGORIES.map(
    (code) => `- ${code}: ${CATEGORY_LABELS[code]}`
  ).join("\n");

  const typeLine = type
    ? `Loại giao dịch: ${type === "INCOME" ? "Thu nhập (INCOME)" : "Chi tiêu (EXPENSE)"}`
    : "Loại giao dịch: Không xác định";

  return [
    "Bạn là bộ phân loại giao dịch tài chính cá nhân.",
    "Hãy chọn đúng 1 mã danh mục phù hợp nhất với mô tả dưới đây.",
    typeLine,
    `Mô tả giao dịch: "${sanitizedDescription}"`,
    "Danh sách mã danh mục hợp lệ:",
    categoryGuide,
  ].join("\n");
}

type GeminiResponsePayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

async function requestGeminiModel(params: {
  model: string;
  apiKey: string;
  prompt: string;
}): Promise<CategoryCode> {
  const endpoint = `${GEMINI_API_BASE}/${params.model}:generateContent`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: {
                type: "STRING",
                enum: [...CATEGORIES],
              },
            },
            required: ["category"],
          },
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new GeminiServiceError(
        "Dịch vụ AI phản hồi quá lâu. Vui lòng thử lại sau.",
        504,
        true
      );
    }
    throw new GeminiServiceError(
      "Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.",
      502,
      true
    );
  }

  if (response.status === 429) {
    throw new GeminiServiceError(
      "Hệ thống AI đang quá tải giới hạn lượt gọi. Vui lòng thử lại sau ít phút.",
      429,
      true
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new GeminiServiceError(
      "Cấu hình khóa API AI không hợp lệ trên máy chủ.",
      502,
      false
    );
  }

  if (!response.ok) {
    let errorMessage = "";
    try {
      const errorPayload = (await response.json()) as GeminiResponsePayload;
      errorMessage = errorPayload.error?.message ?? "";
    } catch {
      // Bỏ qua nếu body lỗi không phải JSON
    }

    if (
      response.status === 400 &&
      errorMessage.toLowerCase().includes("api key")
    ) {
      throw new GeminiServiceError(
        "Cấu hình khóa API AI không hợp lệ trên máy chủ.",
        502,
        false
      );
    }

    const isRetryableStatus =
      response.status === 404 || response.status >= 500;
    const status = response.status === 503 ? 503 : 502;
    throw new GeminiServiceError(
      "Dịch vụ AI tạm thời gặp sự cố. Vui lòng chọn danh mục thủ công.",
      status,
      isRetryableStatus
    );
  }

  const payload = (await response.json()) as GeminiResponsePayload;
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new GeminiServiceError(
      "AI không trả về kết quả hợp lệ. Vui lòng thử lại.",
      502
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new GeminiServiceError(
      "Dữ liệu phản hồi từ AI không đúng định dạng.",
      502
    );
  }

  const validated = suggestCategoryOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new GeminiServiceError(
      "AI trả về danh mục không nằm trong danh sách hỗ trợ.",
      502
    );
  }

  return validated.data.category;
}

export async function suggestCategoryWithGemini(params: {
  description: string;
  type?: TransactionType;
}): Promise<CategoryCode> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiServiceError(
      "Tính năng gợi ý AI chưa được cấu hình trên máy chủ.",
      503
    );
  }

  const sanitizedDescription = sanitizeDescriptionForAI(params.description);
  if (!sanitizedDescription) {
    throw new GeminiServiceError(
      "Mô tả không đủ thông tin để gợi ý danh mục.",
      400
    );
  }

  const prompt = buildPrompt(sanitizedDescription, params.type);
  const customModel = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = customModel
    ? [customModel]
    : [...GEMINI_MODELS];

  let lastError: GeminiServiceError | null = null;

  for (const model of modelsToTry) {
    try {
      return await requestGeminiModel({ model, apiKey, prompt });
    } catch (error) {
      if (!(error instanceof GeminiServiceError)) {
        throw error;
      }

      lastError = error;

      // Chỉ thử model dự phòng khi lỗi có thể khắc phục bằng model khác (404, 429, 5xx, timeout)
      if (!error.retryable) {
        throw error;
      }
    }
  }

  throw (
    lastError ??
    new GeminiServiceError(
      "Dịch vụ AI tạm thời gặp sự cố. Vui lòng chọn danh mục thủ công.",
      502
    )
  );
}
