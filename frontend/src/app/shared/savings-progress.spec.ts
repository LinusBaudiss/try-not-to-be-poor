import { describe, expect, it } from 'vitest';
import { MAX_CENTS } from './money';
import { savingsProgress } from './savings-progress';

describe('Savings progress', () => {
  it.each([
    [0, 100, '0 %', 0, 0], [-50, 100, '−50 %', 0, 0],
    [150, 100, '150 %', 100, 50], [1, 3, '33,33 %', 33.33, 0],
    [2, 3, '66,67 %', 66.67, 0], [1, 32, '3,13 %', 3.13, 0],
    [-1, 32, '−3,13 %', 0, 0],
    [MAX_CENTS, 1, '900.719.925.474.099.100 %', 100, MAX_CENTS - 1],
    [-MAX_CENTS, 1, '−900.719.925.474.099.100 %', 0, 0],
  ] as const)('preserves actual %i/%i and clamps only the bar', (progress, target, percent, barPercent, excessCents) => {
    expect(savingsProgress(progress, target)).toEqual({ percent, barPercent, excessCents });
  });
  it.each([[1, 0], [1, -1], [1.5, 100], [MAX_CENTS + 1, 1], [1, Infinity]] as const)('rejects invalid %s/%s', (progress, target) => expect(() => savingsProgress(progress, target)).toThrow(RangeError));
});
