/**
 * Greek for the deal events the server writes itself ("Added to the board",
 * "Moved to due diligence"). They are stored as English titles beside
 * founder-written ones ("Sent an updated deck"), which stay as written: this
 * returns undefined for anything it did not write, so a caller passes it as
 * `el` to BilingualText.
 */
const STAGE_EL: Record<string, string> = {
  discovered: 'Εντοπισμός',
  reviewing: 'Αξιολόγηση',
  meeting: 'Συνάντηση',
  due_diligence: 'Δέουσα επιμέλεια',
  negotiating: 'Διαπραγμάτευση',
  invested: 'Επένδυση',
};

export function dealEventTitleEl(title: string | null | undefined): string | undefined {
  const text = String(title ?? '').trim();
  if (text === 'Added to the board') return 'Προστέθηκε στον πίνακα';
  const moved = text.match(/^Moved to (.+)$/i);
  if (!moved) return undefined;
  const stage = moved[1].trim().toLowerCase().replace(/\s+/g, '_');
  if (stage === 'passed') return 'Απορρίφθηκε';
  return STAGE_EL[stage] ? `Πέρασε στο στάδιο «${STAGE_EL[stage]}»` : undefined;
}
