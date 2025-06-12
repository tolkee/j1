/**
 * Format currency based on the account's currency
 * @param amount - The amount to format
 * @param currency - The currency type (USD or EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: "USD" | "EUR" = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Get currency symbol
 * @param currency - The currency type (USD or EUR)
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: "USD" | "EUR" = "USD"): string {
  return currency === "EUR" ? "€" : "$";
}

/**
 * Get currency options for selection
 */
export const CURRENCY_OPTIONS = [
  { value: "USD" as const, label: "US Dollar ($)", symbol: "$" },
  { value: "EUR" as const, label: "Euro (€)", symbol: "€" },
];
