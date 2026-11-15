import { describe, expect, it } from 'vitest';
import { MAX_CENTS, parseEuro, parseSignedEuro, euroInput, signedEuroInput, formatEuro, formatSignedEuro } from './money';

describe('Exact EUR cents', () => {
  it.each([
    ['0', 0], ['0,01', 1], ['12.50', 1250], [' 12,5 ', 1250],
    ['90071992547409,91', MAX_CENTS], ['00001,02', 102],
  ] as const)('parses %s without rounding', (input, cents) => expect(parseEuro(input)).toBe(cents));
  it.each(['', '-1', '+1', '1,001', '1.000,00', '1e2', 'Infinity', '1,', ',50', '90071992547409,92'])('rejects %s', input => expect(parseEuro(input)).toBeNull());
  it.each([[0, '0,00'], [1, '0,01'], [99, '0,99'], [100, '1,00'], [100001, '1000,01'], [MAX_CENTS, '90071992547409,91']] as const)('round trips %i exactly', (cents, expected) => {
    expect(euroInput(cents)).toBe(expected); expect(signedEuroInput(cents)).toBe(expected);
    expect(parseEuro(euroInput(cents))).toBe(cents);
  });
  it('formats the maximum with German grouping and a nonbreaking currency space', () => expect(formatEuro(MAX_CENTS)).toBe('90.071.992.547.409,91\u00a0€'));
  it('retains signed extremes and uses a typographic display minus', () => {
    expect(parseSignedEuro('-90071992547409,91')).toBe(-MAX_CENTS);
    expect(signedEuroInput(-MAX_CENTS)).toBe('-90071992547409,91');
    expect(formatSignedEuro(-MAX_CENTS)).toBe('−90.071.992.547.409,91\u00a0€');
    expect(parseSignedEuro('-90071992547409,92')).toBeNull();
  });
  it.each([NaN, Infinity, 0.1, MAX_CENTS + 1])('rejects unsafe display cents %s', cents => {
    expect(() => formatSignedEuro(cents)).toThrow(RangeError);
    expect(() => signedEuroInput(cents)).toThrow(RangeError);
    expect(() => euroInput(cents)).toThrow(RangeError);
  });
  it('keeps ordinary fields unsigned', () => expect(() => formatEuro(-1)).toThrow(RangeError));
});
