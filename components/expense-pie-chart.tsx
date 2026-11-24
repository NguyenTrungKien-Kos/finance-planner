"use client";

import { useState } from "react";
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
  FOOD: "#ea580c",
  TRANSPORT: "#2563eb",
  ENTERTAINMENT: "#9333ea",
  SHOPPING: "#e11d48",
  BILLS: "#0891b2",
  SALARY: "#16a34a",
  INVESTMENT: "#ca8a04",
  OTHER: "#64748b",
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function ExpensePieChart({ data }: { data: CategoryExpenseItem[] }) {
  const [showTable, setShowTable] = useState(false);

  const chartData = data.map((item) => {
    const label =
      CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ??
      item.category;
    const fill =
      CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ??
      "#64748b";
    return {
      ...item,
      label,
      fill,
    };
  });

  const chartConfig = chartData.reduce<ChartConfig>((acc, item) => {
    acc[item.category] = {
      label: item.label,
      color: item.fill,
    };
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Chi tiêu tháng hiện tại theo danh mục</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Tỉ lệ các khoản chi trong tháng này
          </p>
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

      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có khoản chi tiêu nào trong tháng hiện tại.
          </p>
        ) : (
          <div>
            <div
              role="region"
              aria-label="Biểu đồ tròn tỉ lệ chi tiêu theo danh mục tháng hiện tại"
            >
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[300px]"
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
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="category" className="flex-wrap gap-x-4 gap-y-1.5" />}
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
                <tr className="border-b text-left text-muted-foreground">
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
                  <tr key={row.category} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.label}</td>
                    <td className="py-2 text-right font-mono">
                      {formatVND(row.amount)}
                    </td>
                    <td className="py-2 text-right font-mono">
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