export type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60_000;

const requestLogStore = new Map<string, number[]>();

function pruneExpiredTimestamps(
  timestamps: number[],
  windowStart: number
): number[] {
  return timestamps.filter((ts) => ts > windowStart);
}

/**
 * Kiểm tra và ghi nhận lượt gọi theo sliding window cho một key (ví dụ: userId).
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = requestLogStore.get(key) ?? [];
  const activeTimestamps = pruneExpiredTimestamps(existing, windowStart);

  if (activeTimestamps.length >= limit) {
    const oldestActive = activeTimestamps[0] ?? now;
    const retryAfterMs = Math.max(0, oldestActive + windowMs - now);
    requestLogStore.set(key, activeTimestamps);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  activeTimestamps.push(now);
  requestLogStore.set(key, activeTimestamps);

  return {
    allowed: true,
    remaining: Math.max(0, limit - activeTimestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Dùng cho unit test để dọn sạch trạng thái rate limit giữa các test case.
 */
export function resetRateLimitStore(): void {
  requestLogStore.clear();
}