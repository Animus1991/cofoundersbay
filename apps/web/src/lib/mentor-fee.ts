/**
 * Mentor fees are in euros (docs §101): the listing form, the directory,
 * the homes, coaching and earnings all write them through here, so a rate
 * reads the same everywhere. A rate stored in another currency keeps it:
 * changing the sign without converting the amount would misstate it.
 */
export const MENTOR_FEE_CURRENCY = 'EUR';

export function formatFee(amount: number, currency?: string | null, decimals = 0): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || MENTOR_FEE_CURRENCY,
    // "$150", not en-GB's "US$150", as the pricing page writes money.
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
