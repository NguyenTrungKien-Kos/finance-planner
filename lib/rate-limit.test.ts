import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cho phép các lượt gọi trong giới hạn và giảm dần remaining", () => {
    const first = checkRateLimit("user-1", { limit: 3, windowMs: 60_000 });
    const second = checkRateLimit("user-1", { limit: 3, windowMs: 60_000 });
    const third = checkRateLimit("user-1", { limit: 3, windowMs: 60_000 });

    expect(first).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
    expect(second).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });
    expect(third).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    });
  });

  it("chặn lượt gọi vượt ngưỡng và trả về retryAfterSeconds hợp lệ", () => {
    checkRateLimit("user-1", { limit: 2, windowMs: 60_000 });
    checkRateLimit("user-1", { limit: 2, windowMs: 60_000 });

    const blocked = checkRateLimit("user-1", { limit: 2, windowMs: 60_000 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("tách biệt giới hạn giữa các user khác nhau", () => {
    checkRateLimit("user-1", { limit: 1, windowMs: 60_000 });
    const blockedUser1 = checkRateLimit("user-1", { limit: 1, windowMs: 60_000 });
    const allowedUser2 = checkRateLimit("user-2", { limit: 1, windowMs: 60_000 });

    expect(blockedUser1.allowed).toBe(false);
    expect(allowedUser2.allowed).toBe(true);
  });

  it("cho phép gọi lại sau khi hết cửa sổ thời gian", () => {
    checkRateLimit("user-1", { limit: 1, windowMs: 60_000 });
    expect(checkRateLimit("user-1", { limit: 1, windowMs: 60_000 }).allowed).toBe(
      false
    );

    vi.advanceTimersByTime(60_001);

    const afterWindow = checkRateLimit("user-1", { limit: 1, windowMs: 60_000 });
    expect(afterWindow.allowed).toBe(true);
  });
});