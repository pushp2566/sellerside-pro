export function lineTotal(quantity: number, unitPriceCents: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) throw new Error('Invalid quantity or price');
  const total = quantity * unitPriceCents;
  if (!Number.isSafeInteger(total)) throw new Error('Amount too large');
  return total;
}

export function refundTotal(quantity: number, unitPriceCents: number, refundableCents: number): number {
  const total = lineTotal(quantity, unitPriceCents);
  if (!Number.isSafeInteger(refundableCents) || refundableCents < 0 || total > refundableCents) throw new Error('Refund exceeds remaining payment');
  return total;
}

export const usd = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
