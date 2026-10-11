export const currencyOptions = [
  { label: "USD ($)", value: "USD" },
  { label: "VND (₫)", value: "VND" },
];

export function formatCurrency(value: number, currency = "USD") {
  try {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${value.toLocaleString("en-US")} ${currency}`;
  }
}

/**
 * Compact display form for stat cards (e.g. "₫10B"). Accepts the API's decimal strings;
 * Number() is display-only and safe for the magnitudes shown at one-decimal precision.
 */
export function formatCurrencyCompact(value: string | number, currency: string) {
  const amount = Number(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount)} ${currency}`;
  }
}
