import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("trả về đầy đủ thông tin manifest và 2 kích thước icon chuẩn PWA", () => {
    const data = manifest();

    expect(data.name).toBe("Finance Planner");
    expect(data.start_url).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icon-512.png", sizes: "512x512" }),
      ])
    );
  });
});