"use client";

import { useState } from "react";
import {
  convertFromVnd,
  convertToVnd,
  type ExchangeRatesResult,
  type ForeignCurrency,
} from "@/lib/exchange-rates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatForeign(amount: number, currency: ForeignCurrency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CurrencyConverterCard({
  balanceVnd,
  rates,
}: {
  balanceVnd: number;
  rates: ExchangeRatesResult;
}) {
  const [amountInput, setAmountInput] = useState("100");
  const [currency, setCurrency] = useState<ForeignCurrency>("USD");

  const parsedAmount = Number(amountInput);
  const convertedVnd = convertToVnd(parsedAmount, currency, rates);

  const balanceUsd = convertFromVnd(balanceVnd, "USD", rates);
  const balanceEur = convertFromVnd(balanceVnd, "EUR", rates);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Quy đổi đa tiền tệ (USD / EUR → VND)</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Nguồn tỉ giá:{" "}
            <a
              href="https://open.er-api.com"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {rates.source}
            </a>{" "}
            (cache 1 giờ · 1 USD = {formatVND(rates.usdToVnd)} · 1 EUR ={" "}
            {formatVND(rates.eurToVnd)})
          </p>
        </div>

        {rates.isFallback && (
          <Badge variant="outline">Đang dùng tỉ giá dự phòng</Badge>
        )}
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Số dư hiện tại quy đổi
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">USD</p>
              <p className="text-lg font-bold font-mono">
                {formatForeign(balanceUsd, "USD")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">EUR</p>
              <p className="text-lg font-bold font-mono">
                {formatForeign(balanceEur, "EUR")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
            <div className="space-y-1.5">
              <Label htmlFor="currency-amount">Số tiền ngoại tệ</Label>
              <Input
                id="currency-amount"
                type="number"
                min="0"
                step="any"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Nhập số tiền..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency-select">Loại tiền</Label>
              <Select
                value={currency}
                onValueChange={(value) =>
                  setCurrency(value as ForeignCurrency)
                }
              >
                <SelectTrigger id="currency-select" aria-label="Chọn ngoại tệ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm">
            Quy đổi sang VND:{" "}
            <span className="font-mono font-bold">
              {formatVND(convertedVnd)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}