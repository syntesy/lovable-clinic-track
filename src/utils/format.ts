/** Returns "X%" for num/den, or "0%" when den is zero. */
export function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}
