/**
 * Greek for the deal events the server writes itself ("Added to the board",
 * "Moved to due diligence"). They are stored as English titles beside
 * founder-written ones ("Sent an updated deck"), which stay as written: this
 * returns undefined for anything it did not write, so a caller passes it as
 * `el` to BilingualText.
 */
/**
 * One name per pipeline stage, on every investor page (docs §167). The board
 * said «Υπό εξέταση», the analytics «Σε αξιολόγηση», the deal page «Υπό
 * αξιολόγηση» and its events «Αξιολόγηση», for the same column.
 */
export const DEAL_STAGE_LABEL: Record<string, { en: string; el: string }> = {
  discovered: { en: 'Discovered', el: 'Εντοπίστηκε' },
  reviewing: { en: 'Reviewing', el: 'Υπό εξέταση' },
  meeting: { en: 'Meeting', el: 'Συνάντηση' },
  due_diligence: { en: 'Due diligence', el: 'Δέουσα επιμέλεια' },
  negotiating: { en: 'Negotiating', el: 'Διαπραγμάτευση' },
  invested: { en: 'Invested', el: 'Επένδυση' },
  passed: { en: 'Passed', el: 'Απορρίφθηκε' },
};

export function dealEventTitleEl(title: string | null | undefined): string | undefined {
  const text = String(title ?? '').trim();
  if (text === 'Added to the board') return 'Προστέθηκε στον πίνακα';
  const moved = text.match(/^Moved to (.+)$/i);
  if (!moved) return undefined;
  const stage = moved[1].trim().toLowerCase().replace(/\s+/g, '_');
  if (stage === 'passed') return DEAL_STAGE_LABEL.passed.el;
  return DEAL_STAGE_LABEL[stage] ? `Πέρασε στο στάδιο «${DEAL_STAGE_LABEL[stage].el}»` : undefined;
}
