// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MonthlyComparisonChart } from "@/components/monthly-comparison-chart";
import type { MonthlyComparisonItem, SpendingTrend } from "@/lib/finance";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverMock;
}

afterEach(() => {
  cleanup();
});

const SAMPLE_DATA: MonthlyComparisonItem[] = [
  {
    monthKey: "2026-10",
    label: "T10/2026",
    income: 15_000_000,
    expense: 4_000_000,
    balance: 11_000_000,
  },
  {
    monthKey: "2026-11",
    label: "T11/2026",
    income: 18_000_000,
    expense: 5_000_000,
    balance: 13_000_000,
  },
];

const SAMPLE_TREND: SpendingTrend = {
  currentExpense: 5_000_000,
  previousExpense: 4_000_000,
  difference: 1_000_000,
  percentageChange: 25,
  direction: "up",
};

describe("MonthlyComparisonChart", () => {
  it("hiển thị xu hướng chi tiêu và bật/tắt bảng số liệu A11y khi bấm nút", () => {
    render(<MonthlyComparisonChart data={SAMPLE_DATA} trend={SAMPLE_TREND} />);

    expect(
      screen.getByText("So sánh thu chi 6 tháng gần nhất")
    ).toBeInTheDocument();
    expect(screen.getByText(/\+25%/)).toBeInTheDocument();

    const toggleButton = screen.getByRole("button", {
      name: "Xem bảng số liệu",
    });
    const table = document.getElementById("monthly-comparison-table");

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(table).toHaveClass("sr-only");

    fireEvent.click(toggleButton);

    expect(
      screen.getByRole("button", { name: "Ẩn bảng số liệu" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(table).not.toHaveClass("sr-only");
    expect(screen.getByText("T10/2026")).toBeInTheDocument();
    expect(screen.getByText("T11/2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ẩn bảng số liệu" }));
    expect(table).toHaveClass("sr-only");
  });

  it("hiển thị trạng thái rỗng và ẩn nút xem bảng khi chưa có giao dịch", () => {
    render(
      <MonthlyComparisonChart
        data={[
          {
            monthKey: "2026-11",
            label: "T11/2026",
            income: 0,
            expense: 0,
            balance: 0,
          },
        ]}
        trend={{
          currentExpense: 0,
          previousExpense: 0,
          difference: 0,
          percentageChange: null,
          direction: "flat",
        }}
      />
    );

    expect(
      screen.getByText("Chưa có dữ liệu giao dịch trong 6 tháng gần nhất.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Xem bảng số liệu" })
    ).not.toBeInTheDocument();
  });
});