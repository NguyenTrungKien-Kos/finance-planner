"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
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

function UsFlagCircle() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0 rounded-full" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#FFFFFF" />
      <clipPath id="fp-us-flag">
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath="url(#fp-us-flag)">
        <rect y="0" width="24" height="2" fill="#DC2626" />
        <rect y="4" width="24" height="2" fill="#DC2626" />
        <rect y="8" width="24" height="2" fill="#DC2626" />
        <rect y="12" width="24" height="2" fill="#DC2626" />
        <rect y="16" width="24" height="2" fill="#DC2626" />
        <rect y="20" width="24" height="2" fill="#DC2626" />
        <rect width="12" height="12" fill="#1D4ED8" />
        <circle cx="4" cy="4" r="1" fill="#FFFFFF" />
        <circle cx="8" cy="4" r="1" fill="#FFFFFF" />
        <circle cx="6" cy="6.5" r="1" fill="#FFFFFF" />
        <circle cx="4" cy="9" r="1" fill="#FFFFFF" />
        <circle cx="8" cy="9" r="1" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

function EuFlagCircle() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0 rounded-full" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1E40AF" />
      <circle cx="12" cy="5.5" r="1" fill="#FACC15" />
      <circle cx="16.5" cy="7.5" r="1" fill="#FACC15" />
      <circle cx="18.5" cy="12" r="1" fill="#FACC15" />
      <circle cx="16.5" cy="16.5" r="1" fill="#FACC15" />
      <circle cx="12" cy="18.5" r="1" fill="#FACC15" />
      <circle cx="7.5" cy="16.5" r="1" fill="#FACC15" />
      <circle cx="5.5" cy="12" r="1" fill="#FACC15" />
      <circle cx="7.5" cy="7.5" r="1" fill="#FACC15" />
    </svg>
  );
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

  const wallets = [
    {
      code: "USD" as const,
      amount: balanceUsd,
      rate: rates.usdToVnd,
      flag: <UsFlagCircle />,
    },
    {
      code: "EUR" as const,
      amount: balanceEur,
      rate: rates.eurToVnd,
      flag: <EuFlagCircle />,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/12 text-cyan-600 dark:text-cyan-400"
          >
            <ArrowLeftRight className="size-4" />
          </span>
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
              (cache 1 giờ)
            </p>
          </div>
        </div>

        {rates.isFallback && (
          <Badge variant="outline">Đang dùng tỉ giá dự phòng</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thẻ ví ngoại tệ kiểu Finova */}
        <div className="grid gap-3 sm:grid-cols-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.code}
              className="rounded-2xl border border-border/75 bg-muted/30 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {wallet.flag}
                  <span className="text-sm font-semibold">{wallet.code}</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Hoạt động
                </span>
              </div>
              <p className="mt-3 font-mono text-lg font-bold tracking-tight tabular-nums">
                {formatForeign(wallet.amount, wallet.code)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                1 {wallet.code} = {formatVND(wallet.rate)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-border/75 bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_116px]">
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
                <SelectTrigger
                  id="currency-select"
                  className="h-10 w-full rounded-xl"
                  aria-label="Chọn ngoại tệ"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary/8 px-3.5 py-2.5 text-sm">
            <span className="text-muted-foreground">Quy đổi sang VND</span>
            <span className="font-mono font-bold text-primary tabular-nums">
              {formatVND(convertedVnd)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}