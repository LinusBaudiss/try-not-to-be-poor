import { MAX_CENTS } from './money';

/** Kaufmännisch gerundeter Prozentwert; auch Maximum / 1 Cent bleibt exakt. */
export function savingsProgress(progressCents: number, targetAmountCents: number): {
  percent: string; barPercent: number; excessCents: number;
} {
  if (!Number.isSafeInteger(progressCents) || progressCents < -MAX_CENTS || progressCents > MAX_CENTS
    || !Number.isSafeInteger(targetAmountCents) || targetAmountCents <= 0 || targetAmountCents > MAX_CENTS)
    throw new RangeError('Ungültiger Sparzielfortschritt.');
  const progress = BigInt(progressCents), target = BigInt(targetAmountCents);
  const magnitude = progress < 0 ? -progress : progress;
  const hundredths = (magnitude * 10_000n + target / 2n) / target;
  const whole = (hundredths / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fraction = (hundredths % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return {
    percent: `${progress < 0 ? '−' : ''}${whole}${fraction ? ',' + fraction : ''} %`,
    barPercent: Number(progress < 0 ? 0n : hundredths > 10_000n ? 10_000n : hundredths) / 100,
    excessCents: progress > target ? Number(progress - target) : 0
  };
}
