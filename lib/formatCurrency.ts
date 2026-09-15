const DEFAULT_CURRENCY = "HKD";

export function normalizeCurrency(currency: string | null | undefined): string {
  const c = currency?.trim();
  return c || DEFAULT_CURRENCY;
}

export function formatMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY,
): string {
  if (value == null || String(value).trim() === "") return "—";
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPsf(
  value: string | number | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY,
): string {
  if (value == null || String(value).trim() === "") return "—";
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(value);
  const cur = normalizeCurrency(currency);
  return `${new Intl.NumberFormat("en-HK", { maximumFractionDigits: 2 }).format(n)} ${cur}/sq ft`;
}

/** PSF as currency (e.g. HK$65) for compact property-detail tables. */
export function formatCurrencyPsf(
  value: string | number | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY,
): string {
  if (value == null || String(value).trim() === "") return "—";
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function parseNumericInput(value: string | number | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function formatThousands(value: string | number | null | undefined): string {
  const n = parseNumericInput(value);
  if (n == null) return "";
  return new Intl.NumberFormat("en-HK", { maximumFractionDigits: 0 }).format(n);
}

export function formatAreaSqft(value: string | number | null | undefined): string {
  if (value == null || String(value).trim() === "") return "—";
  const formatted = formatThousands(value);
  return formatted || String(value);
}

export const V1_CURRENCIES = ["HKD", "USD", "CNY"] as const;
