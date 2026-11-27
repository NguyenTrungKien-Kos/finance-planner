"use client";

import { useState } from "react";
import { ChartPie } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { CATEGORY_LABELS, type CATEGORIES } from "@/lib/constants";
import type { CategoryExpenseItem } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const CATEGORY_COLORS: Record<(typeof CATEGORIES)[number], string> = {
  FOOD: "#f97316",
  TRANSPORT: "#5b5ce6",
  ENTERTAINMENT: "#8b5cf6",
  SHOPPING: "#f43f5e",
  BILLS: "#06b6d4",
  SALARY: "#10b981",
  INVESTMENT: "#f59e0b",
  OTHER: "#94a3b8",
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatCompactVND(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr ₫`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k ₫`;
  }
  return `${amount} ₫`;
}

export function ExpensePieChart({ data }: { data: CategoryExpenseItem[] }) {
  const [showTable, setShowTable] = useState(false);

  const chartData = data.map((item) => {
    const label =
      CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ??
      item.category;
    const fill =
      CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ??
      "#94a3b8";
    return {
      ...item,
      label,
      fill,
    };
  });

  const totalExpense = chartData.reduce((sum, item) => sum + item.amount, 0);

  const chartConfig = chartData.reduce<ChartConfig>((acc, item) => {
    acc[item.category] = {
      label: item.label,
      color: item.fill,
    };
    return acc;
  }, {});

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400"
          >
            <ChartPie className="size-4" />
          </span>
          <div>
            <CardTitle>Chi tiêu tháng hiện tại theo danh mục</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Tỉ lệ các khoản chi trong tháng này
            </p>
          </div>
        </div>

        {data.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={showTable}
            aria-controls="expense-breakdown-table"
            onClick={() => setShowTable((prev) => !prev)}
          >
            {showTable ? "Ẩn bảng số liệu" : "Xem bảng số liệu"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center">
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có khoản chi tiêu nào trong tháng hiện tại.
          </p>
        ) : (
          <div>
            <div
              role="region"
              aria-label="Biểu đồ tròn tỉ lệ chi tiêu theo danh mục tháng hiện tại"
              className="relative"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center justify-center text-center"
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  Tổng chi
                </span>
                <span className="font-mono text-sm font-bold tracking-tight tabular-nums">
                  {formatCompactVND(totalExpense)}
                </span>
              </div>

              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[290px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="category"
                        formatter={(value) => formatVND(Number(value))}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={62}
                    outerRadius={94}
                    paddingAngle={3}
                    cornerRadius={6}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={
                      <ChartLegendContent
                        nameKey="category"
                        className="flex-wrap gap-x-4 gap-y-1.5"
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            </div>

            <table
              id="expense-breakdown-table"
              className={
                showTable
                  ? "mt-4 w-full border-collapse text-sm"
                  : "sr-only"
              }
            >
              <caption className="sr-only">
                Bảng số liệu chi tiêu tháng hiện tại theo danh mục
              </caption>
              <thead>
                <tr className="border-b text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th scope="col" className="py-2 font-medium">
                    Danh mục
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Số tiền
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Tỉ lệ
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr
                    key={row.category}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2 font-medium">{row.label}</td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {formatVND(row.amount)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {row.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}