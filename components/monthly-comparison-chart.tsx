"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartColumn, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { MonthlyComparisonItem, SpendingTrend } from "@/lib/finance";
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

const chartConfig = {
  income: {
    label: "Tổng thu",
    color: "#5b5ce6",
  },
  expense: {
    label: "Tổng chi",
    color: "#c2c9fa",
  },
} satisfies ChartConfig;

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatCompactVND(value: number): string {
  if (value >= 1_000_000) {
    return `${Math.round((value / 1_000_000) * 10) / 10}tr`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(value);
}

function TrendSummary({ trend }: { trend: SpendingTrend }) {
  if (trend.previousExpense === 0 && trend.currentExpense === 0) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Chưa có dữ liệu chi tiêu ở tháng này và tháng trước.</span>
      </p>
    );
  }

  if (trend.previousExpense === 0 && trend.currentExpense > 0) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp
          className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400"
          aria-hidden="true"
        />
        <span>
          Tháng này chi {formatVND(trend.currentExpense)} (tháng trước chưa ghi
          nhận chi tiêu).
        </span>
      </p>
    );
  }

  if (trend.direction === "up") {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Chi tiêu tháng này tăng {formatVND(trend.difference)} (
          {trend.percentageChange !== null ? `+${trend.percentageChange}%` : ""}
          ) so với tháng trước.
        </span>
      </p>
    );
  }

  if (trend.direction === "down") {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Chi tiêu tháng này giảm {formatVND(Math.abs(trend.difference))} (
          {trend.percentageChange !== null ? `${trend.percentageChange}%` : ""})
          so với tháng trước.
        </span>
      </p>
    );
  }

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Chi tiêu tháng này bằng tháng trước ({formatVND(trend.currentExpense)}).
      </span>
    </p>
  );
}

export function MonthlyComparisonChart({
  data,
  trend,
}: {
  data: MonthlyComparisonItem[];
  trend: SpendingTrend;
}) {
  const [showTable, setShowTable] = useState(false);
  const hasAnyData = data.some((item) => item.income > 0 || item.expense > 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
          >
            <ChartColumn className="size-4" />
          </span>
          <div>
            <CardTitle>So sánh thu chi 6 tháng gần nhất</CardTitle>
            <TrendSummary trend={trend} />
          </div>
        </div>

        {hasAnyData && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={showTable}
            aria-controls="monthly-comparison-table"
            onClick={() => setShowTable((prev) => !prev)}
          >
            {showTable ? "Ẩn bảng số liệu" : "Xem bảng số liệu"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center">
        {!hasAnyData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu giao dịch trong 6 tháng gần nhất.
          </p>
        ) : (
          <div>
            <div
              role="region"
              aria-label="Biểu đồ cột so sánh thu nhập và chi tiêu 6 tháng gần nhất"
            >
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[270px] w-full"
              >
                <BarChart data={data} barGap={6} accessibilityLayer>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={formatCompactVND}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.45 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    name === "income"
                                      ? chartConfig.income.color
                                      : chartConfig.expense.color,
                                }}
                              />
                              {name === "income" ? "Tổng thu" : "Tổng chi"}
                            </span>
                            <span className="font-mono font-semibold text-foreground tabular-nums">
                              {formatVND(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="income"
                    fill="var(--color-income)"
                    radius={[8, 8, 8, 8]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="expense"
                    fill="var(--color-expense)"
                    radius={[8, 8, 8, 8]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            <table
              id="monthly-comparison-table"
              className={
                showTable
                  ? "mt-5 w-full border-collapse text-sm"
                  : "sr-only"
              }
            >
              <caption className="sr-only">
                Bảng số liệu so sánh thu chi 6 tháng gần nhất
              </caption>
              <thead>
                <tr className="border-b text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th scope="col" className="py-2.5 font-medium">
                    Tháng
                  </th>
                  <th scope="col" className="py-2.5 text-right font-medium">
                    Tổng thu
                  </th>
                  <th scope="col" className="py-2.5 text-right font-medium">
                    Tổng chi
                  </th>
                  <th scope="col" className="py-2.5 text-right font-medium">
                    Chênh lệch
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.monthKey}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2.5 font-medium">{row.label}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-600 tabular-nums dark:text-emerald-400">
                      {formatVND(row.income)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-rose-600 tabular-nums dark:text-rose-400">
                      {formatVND(row.expense)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono tabular-nums ${
                        row.balance >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {row.balance > 0 ? "+" : ""}
                      {formatVND(row.balance)}
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