import { describe, expect, it } from 'vitest';

import { CartError, multiplyPrice, sumPrices } from '@/lib/cart';

describe('multiplyPrice', () => {
  it('calculates a line total for a whole-number price', () => {
    expect(multiplyPrice('120', 3)).toBe('360');
  });

  it('calculates a single-unit line total', () => {
    expect(multiplyPrice('249.99', 1)).toBe('249.99');
  });

  it('keeps decimal precision', () => {
    expect(multiplyPrice('10.25', 3)).toBe('30.75');
    expect(multiplyPrice('0.5', 4)).toBe('2');
  });

  it('drops insignificant trailing zeros', () => {
    expect(multiplyPrice('99.50', 2)).toBe('199');
  });

  it('rejects a price that is not a plain decimal number', () => {
    expect(() => multiplyPrice('free', 2)).toThrow(CartError);
    expect(() => multiplyPrice('1.2.3', 2)).toThrow(CartError);
    expect(() => multiplyPrice('-10', 2)).toThrow(CartError);
    expect(() => multiplyPrice('', 2)).toThrow(CartError);
  });
});

describe('sumPrices', () => {
  it('returns zero for an empty cart', () => {
    expect(sumPrices([])).toBe('0');
  });

  it('adds whole-number line totals', () => {
    expect(sumPrices(['100', '200', '49'])).toBe('349');
  });

  it('adds prices with different decimal scales exactly', () => {
    expect(sumPrices(['0.1', '0.2'])).toBe('0.3');
    expect(sumPrices(['10.10', '20.05'])).toBe('30.15');
    expect(sumPrices(['99.99', '0.01'])).toBe('100');
    expect(sumPrices(['0.05', '0.05', '0.9'])).toBe('1');
  });

  it('calculates a multi-variant subtotal the way the cart does', () => {
    const lineTotals = [
      multiplyPrice('310.50', 2),
      multiplyPrice('149', 3),
      multiplyPrice('0.25', 4),
    ];

    expect(lineTotals).toEqual(['621', '447', '1']);
    expect(sumPrices(lineTotals)).toBe('1069');
  });
});
