export type ForeignCurrency = "USD" | "EUR";

export type ExchangeRateValues = {
  usdToVnd: number;
  eurToVnd: number;
};

export type ExchangeRatesResult = ExchangeRateValues & {
  source: string;
  updatedAt: string | null;
  isFallback: boolean;
};

export const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/USD";
export const EXCHANGE_RATE_SOURCE = "open.er-api.com";

export const DEFAULT_EXCHANGE_RATES: ExchangeRateValues = {
  usdToVnd: 25_400,
  eurToVnd: 27_600,
};

export function parseExchangeRatesPayload(
  payload: unknown
): (ExchangeRateValues & { updatedAt: string | null }) | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    result?: unknown;
    time_last_update_utc?: unknown;
    rates?: Record<string, unknown>;
  };

  if (record.result !== "success" || !record.rates) {
    return null;
  }

  const vndPerUsd = record.rates.VND;
  const eurPerUsd = record.rates.EUR;

  if (
    typeof vndPerUsd !== "number" ||
    !Number.isFinite(vndPerUsd) ||
    vndPerUsd <= 0 ||
    typeof eurPerUsd !== "number" ||
    !Number.isFinite(eurPerUsd) ||
    eurPerUsd <= 0
  ) {
    return null;
  }

  return {
    usdToVnd: Math.round(vndPerUsd),
    eurToVnd: Math.round(vndPerUsd / eurPerUsd),
    updatedAt:
      typeof record.time_last_update_utc === "string"
        ? record.time_last_update_utc
        : null,
  };
}

export function convertToVnd(
  amount: number,
  currency: ForeignCurrency,
  rates: ExchangeRateValues
): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  const rate = currency === "USD" ? rates.usdToVnd : rates.eurToVnd;
  return Math.round(amount * rate);
}

export function convertFromVnd(
  amountVnd: number,
  currency: ForeignCurrency,
  rates: ExchangeRateValues
): number {
  if (!Number.isFinite(amountVnd)) {
    return 0;
  }
  const rate = currency === "USD" ? rates.usdToVnd : rates.eurToVnd;
  if (rate <= 0) {
    return 0;
  }
  return Math.round((amountVnd / rate) * 100) / 100;
}

export async function fetchExchangeRates(): Promise<ExchangeRatesResult> {
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json: unknown = await response.json();
    const parsed = parseExchangeRatesPayload(json);
    if (!parsed) {
      throw new Error("Invalid exchange rate payload");
    }

    return {
      ...parsed,
      source: EXCHANGE_RATE_SOURCE,
      isFallback: false,
    };
  } catch {
    return {
      ...DEFAULT_EXCHANGE_RATES,
      source: EXCHANGE_RATE_SOURCE,
      updatedAt: null,
      isFallback: true,
    };
  }
}