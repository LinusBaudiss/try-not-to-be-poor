export const MAX_CENTS = 9007199254740991;

/** Ungruppierte Euroeingabe ohne Gleitkommamultiplikation oder Rundung lesen. */
export function parseEuro(input: string): number | null {
  const value = input.trim();
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(value)) return null;
  const [euros, fraction = ''] = value.split(/[,.]/);
  const cents = BigInt(euros) * 100n + BigInt(fraction.padEnd(2, '0'));
  return cents <= BigInt(MAX_CENTS) ? Number(cents) : null;
}

export function euroInput(amountCents: number): string {
  const cents = exactCents(amountCents);
  return `${cents / 100n},${(cents % 100n).toString().padStart(2, '0')}`;
}

export function formatEuro(amountCents: number): string {
  const [euros, fraction] = euroInput(amountCents).split(',');
  return `${euros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}\u00a0€`;
}

function exactCents(amountCents: number): bigint {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > MAX_CENTS) throw new RangeError('Ungültiger Centbetrag.');
  return BigInt(amountCents);
}

/** Signierter Gesamtfortschritt; andere Geldfelder verwenden weiterhin parseEuro/euroInput. */
export function parseSignedEuro(input: string): number | null {
  const value = input.trim();
  if (!/^-?\d+(?:[,.]\d{1,2})?$/.test(value)) return null;
  const negative = value.startsWith('-');
  const cents = parseEuro(negative ? value.slice(1) : value);
  return cents === null ? null : negative ? -cents : cents;
}

export function signedEuroInput(amountCents: number): string {
  if (!Number.isSafeInteger(amountCents) || Math.abs(amountCents) > MAX_CENTS) throw new RangeError('Ungültiger Centbetrag.');
  return `${amountCents < 0 ? '-' : ''}${euroInput(Math.abs(amountCents))}`;
}

/** Signierte Anzeige. */
export function formatSignedEuro(amountCents: number): string {
  if (!Number.isSafeInteger(amountCents) || Math.abs(amountCents) > MAX_CENTS) throw new RangeError('Ungültiger Centbetrag.');
  return `${amountCents < 0 ? '−' : ''}${formatEuro(Math.abs(amountCents))}`;
}
