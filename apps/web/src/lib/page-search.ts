import { PAGE_REGISTRY, getPageMeta } from '@/lib/page-registry';

/**
 * Pages found by what a person types into the command palette.
 *
 * The palette held sixteen English commands matched letter for letter, so
 * "cofounder" or «συνιδρυτής» found nothing. This searches every static page
 * in the registry by its English and Greek title and description, accents
 * ignored, plus the everyday words people use for the main pages, and shows
 * only the pages meant for the reader's role.
 */

export type PageHit = { path: string; title: string; titleEl?: string; description: string; descriptionEl?: string };

/** Everyday words for pages whose titles do not contain them. */
const SYNONYMS: Record<string, string[]> = {
  '/matches': ['cofounder', 'co-founder', 'partner', 'match', 'συνιδρυτ', 'ταιρι', 'συνεταιρ'],
  '/discover': ['find people', 'search people', 'browse', 'βρες', 'αναζητηση ατομων'],
  '/messages': ['chat', 'inbox', 'dm', 'συνομιλ', 'εισερχομενα'],
  '/commitments': ['need card', 'need cards', 'ladder', 'καρτα αναγκ', 'καρτες αναγκ'],
  '/scout': ['scout', 'ανιχνευτ'],
  '/perks': ['discount', 'deal', 'credits', 'coupon', 'εκπτωσ', 'κουπον', 'πιστωσ'],
  '/mentoring': ['mentor', 'advisor', 'coach', 'μεντορ', 'συμβουλ'],
  '/investors': ['investor', 'angel', 'vc', 'επενδυτ'],
  '/fundraising': ['raise', 'funding', 'round', 'χρηματοδοτ', 'γυρος'],
  '/settings': ['how you work', 'compatibility', 'privacy', 'συμβατοτ', 'απορρητ', 'πως σας αρεσει'],
  '/intros': ['introduction', 'warm intro', 'συσταση γνωριμ'],
  '/updates': ['investor update', 'founder update', 'ενημερωσ'],
  '/help': ['faq', 'support', 'βοηθεια', 'υποστηριξ'],
};

export function foldText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ');
}

function visibleTo(section: string | undefined, audience: string[] | undefined, role: string | null | undefined): boolean {
  if (section === 'Auth') return false;
  const admin = role === 'admin' || role === 'super_admin';
  if (section === 'Admin') return admin;
  if (!audience?.length || !role || admin) return true;
  if (audience.includes(role)) return true;
  // Facets rather than roles: providers can be anyone; tenant admins are organisations.
  if (audience.includes('service_provider')) return true;
  if (audience.includes('tenant_admin')) return role === 'org';
  return false;
}

/** Up to `limit` pages for the words typed, best first. */
export function searchPages(query: string, role?: string | null, limit = 8): PageHit[] {
  const words = foldText(query).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const scored: Array<{ hit: PageHit; score: number }> = [];
  for (const entry of PAGE_REGISTRY) {
    if (entry.path.includes('[') || !visibleTo(entry.section, entry.audience, role)) continue;
    const meta = getPageMeta(entry.path) ?? entry;
    const title = foldText(`${meta.title} ${meta.titleEl ?? ''}`);
    const rest = foldText(`${meta.description} ${meta.descriptionEl ?? ''} ${entry.path} ${(SYNONYMS[entry.path] ?? []).join(' ')}`);
    // Greek inflects: a typed word also matches a stem it starts with
    // («συνιδρυτή» finds the stem «συνιδρυτ»), as long as the stem is a word, not a letter.
    const stems = (SYNONYMS[entry.path] ?? []).map(foldText);
    const synonym = (w: string) => stems.some((k) => k.includes(w) || (k.length >= 4 && w.startsWith(k)));
    if (!words.every((w) => title.includes(w) || rest.includes(w) || synonym(w))) continue;
    const score = words.reduce((sum, w) => sum + (title.startsWith(w) ? 3 : title.includes(w) || synonym(w) ? 2 : 1), 0);
    scored.push({ hit: { path: entry.path, title: meta.title, titleEl: meta.titleEl, description: meta.description, descriptionEl: meta.descriptionEl }, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.hit.path.length - b.hit.path.length).slice(0, limit).map((s) => s.hit);
}
