/**
 * Utility functions for formatting and normalizing GST (Goods and Services Tax) slabs.
 * Ensures consistent percentage representation (e.g. 0.05 -> "5%", 0.12 -> "12%", 5 -> "5%", "5%" -> "5%").
 */

export function formatGst(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '12%';
  }

  const str = String(value).trim();
  if (!str) {
    return '12%';
  }

  // Strip '%' sign and check numeric value
  const cleaned = str.replace(/%/g, '').trim();
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    // If it's a non-numeric string (e.g., "Exempt", "NIL"), return as is
    return str;
  }

  // If decimal fraction between 0 and 1 (exclusive), like 0.05, 0.12, 0.18, 0.28
  // Excel commonly provides percentages as decimals (0.05 = 5%)
  if (num > 0 && num < 1) {
    const pct = Math.round(num * 100 * 100) / 100;
    return `${pct}%`;
  }

  // If exactly 0
  if (num === 0) {
    return '0%';
  }

  // Standard integer/float percentages >= 1 (e.g., 5, 12, 18, 28)
  const pct = Math.round(num * 100) / 100;
  return `${pct}%`;
}
