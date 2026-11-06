import { describe, expect, it } from 'vitest';
import { lineTotal, refundTotal } from './money';

describe('money rules', () => {
  it('calculates six damaged cupcakes as fifteen dollars', () => expect(refundTotal(6, 250, 6000)).toBe(1500));
  it('rejects a refund larger than the remaining payment', () => expect(() => refundTotal(6, 250, 1000)).toThrow());
  it('rejects negative and fractional quantities', () => {
    expect(() => lineTotal(-1, 250)).toThrow();
    expect(() => lineTotal(1.5, 250)).toThrow();
  });
  it('avoids fractional-cent prices and unsafe totals', () => {
    expect(() => lineTotal(2, 2.5)).toThrow();
    expect(() => lineTotal(Number.MAX_SAFE_INTEGER, 250)).toThrow();
  });
});
