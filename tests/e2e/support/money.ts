/** Định dạng giống formatVND của apps/web/src/lib/format-currency.ts: 35000 -> "35.000đ". */
export function vnd(amount: number): string {
  const digits = String(Math.trunc(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${digits}đ`;
}
