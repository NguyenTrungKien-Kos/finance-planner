// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BudgetSection } from "@/components/budget-section";
import type { BudgetStatusItem } from "@/lib/finance";

afterEach(() => {
  cleanup();
});

const SAMPLE_STATUSES: BudgetStatusItem[] = [
  {
    id: "b-1",
    category: "SHOPPING",
    month: 11,
    year: 2026,
    limit: 2_000_000,
    spent: 2_200_000,
    remaining: -200_000,
    percentage: 110,
    progressPercent: 100,
    alertLevel: "EXCEEDED",
  },
  {
    id: "b-2",
    category: "FOOD",
    month: 11,
    year: 2026,
    limit: 3_000_000,
    spent: 2_550_000,
    remaining: 450_000,
    percentage: 85,
    progressPercent: 85,
    alertLevel: "WARNING",
  },
  {
    id: "b-3",
    category: "TRANSPORT",
    month: 11,
    year: 2026,
    limit: 1_000_000,
    spent: 400_000,
    remaining: 600_000,
    percentage: 40,
    progressPercent: 40,
    alertLevel: "SAFE",
  },
];

describe("BudgetSection", () => {
  it("hiển thị danh sách ngân sách kèm badge cảnh báo An toàn / ≥80% / Vượt 100%", () => {
    render(
      <BudgetSection month={11} year={2026} statuses={SAMPLE_STATUSES} />
    );

    expect(
      screen.getByText("Ngân sách tháng 11/2026 (3 danh mục)")
    ).toBeInTheDocument();
    expect(screen.getByText("Mua sắm")).toBeInTheDocument();
    expect(screen.getByText("Ăn uống")).toBeInTheDocument();
    expect(screen.getByText("Di chuyển")).toBeInTheDocument();

    expect(screen.getByText("Vượt 100%")).toBeInTheDocument();
    expect(screen.getByText("Cảnh báo ≥80%")).toBeInTheDocument();
    expect(screen.getByText("An toàn")).toBeInTheDocument();

    expect(screen.getByText("Đã dùng 110% hạn mức")).toBeInTheDocument();
    expect(screen.getByText("Đã dùng 85% hạn mức")).toBeInTheDocument();
    expect(screen.getByText("Đã dùng 40% hạn mức")).toBeInTheDocument();
  });

  it("hiển thị trạng thái rỗng khi chưa có ngân sách trong tháng", () => {
    render(<BudgetSection month={11} year={2026} statuses={[]} />);

    expect(
      screen.getByText("Ngân sách tháng 11/2026 (0 danh mục)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chưa có ngân sách nào cho tháng 11\/2026/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Đặt ngân sách/ })
    ).toBeInTheDocument();
  });
});