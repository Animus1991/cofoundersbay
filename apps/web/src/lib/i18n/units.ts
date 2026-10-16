/**
 * Greek for the short durations that arrive as English text ("45 min read",
 * "< 24h", "138 d", "40 h/week"): sample data and a few server fields carry
 * them that way, and with one language on screen the English stood alone on
 * a Greek page. Returns undefined for anything else, so a caller passes it as
 * `el` to BilingualText and unknown text shows as given.
 */
const RULES: Array<[RegExp, (n: string) => string]> = [
  [/^(\d+(?:[.,]\d+)?)\s*min(?:ute)?s?\s+read$/i, (n) => `${n} λεπτά ανάγνωσης`],
  [/^(\d+(?:[.,]\d+)?)\s*min(?:ute)?s?$/i, (n) => `${n} λεπτά`],
  [/^(\d+(?:[.,]\d+)?)\s*h(?:ours?|rs?)?\s*\/\s*week$/i, (n) => `${n} ώρ./εβδ.`],
  [/^(\d+(?:[.,]\d+)?)\s*(?:h|hrs?|hours?)$/i, (n) => `${n} ώρ.`],
  [/^(\d+)\s*(?:d|days?)$/i, (n) => `${n} ημ.`],
  [/^(\d+)\s*(?:w|weeks?)$/i, (n) => `${n} εβδ.`],
];

export function durationEl(text: string | null | undefined): string | undefined {
  const source = String(text ?? '').trim();
  if (!source) return undefined;
  // "< 24h", "≈ 3 weeks": keep the sign, translate the rest.
  const lead = source.match(/^([<>≤≥~≈]\s*)(.+)$/);
  const [prefix, body] = lead ? [lead[1], lead[2]] : ['', source];
  for (const [re, el] of RULES) {
    const m = body.match(re);
    if (m) return `${prefix}${el(m[1])}`;
  }
  return undefined;
}
