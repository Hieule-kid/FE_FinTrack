/**
 * Formats a raw amount string with thousands separators as the user types,
 * keeping at most two decimal places. Returns "" for empty input.
 */
export function formatAmountInput(raw: string): string {
  let cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (cleaned === "") return "";
  const [intPart, decPart] = cleaned.split(".");
  const intFmt = intPart ? Number(intPart).toLocaleString("en-US") : "0";
  return cleaned.includes(".")
    ? `${intFmt}.${(decPart ?? "").slice(0, 2)}`
    : intFmt;
}

/**
 * Parses a display amount string (as produced by {@link formatAmountInput})
 * back into a number. Returns `NaN` for non-numeric input.
 */
export function parseAmountInput(display: string): number {
  return parseFloat(display.replace(/,/g, ""));
}
