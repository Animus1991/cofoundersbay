/**
 * What a founding team still lacks, from the founder's own skills.
 *
 * Four areas an early team has to cover, the way accelerator applications
 * and co-founder guides ask about them: building the product, design,
 * bringing it to market, and running the company. A skill counts toward an
 * area by its name; an area nobody's skills cover is a gap, and the role
 * that fills it is what to look for. It reads only the founder's profile, so
 * it says "you", not "your team", and names what it cannot see.
 */

export type TeamArea = 'build' | 'design' | 'market' | 'operate';

export const TEAM_AREAS: Record<TeamArea, { en: string; el: string; role: { en: string; el: string }; words: string[] }> = {
  build: {
    en: 'Building the product', el: 'Κατασκευή του προϊόντος',
    role: { en: 'technical co-founder', el: 'τεχνικό συνιδρυτή' },
    words: ['engineer', 'develop', 'software', 'code', 'react', 'node', 'python', 'java', 'backend', 'frontend', 'full-stack', 'fullstack', 'mobile', 'machine learning', 'ml', 'ai', 'data', 'devops', 'cloud', 'cto', 'architecture', 'technical'],
  },
  design: {
    en: 'Design', el: 'Σχεδιασμός',
    role: { en: 'designer', el: 'σχεδιαστή' },
    words: ['design', 'ux', 'ui', 'product design', 'research', 'figma', 'brand'],
  },
  market: {
    en: 'Bringing it to market', el: 'Φέρνοντάς το στην αγορά',
    role: { en: 'co-founder for sales and marketing', el: 'συνιδρυτή για πωλήσεις και μάρκετινγκ' },
    words: ['sales', 'marketing', 'growth', 'go-to-market', 'gtm', 'business development', 'partnership', 'seo', 'content', 'community', 'customer'],
  },
  operate: {
    en: 'Running the company', el: 'Λειτουργία της εταιρείας',
    role: { en: 'operations and finance lead', el: 'υπεύθυνο λειτουργιών και οικονομικών' },
    words: ['operations', 'finance', 'fundraising', 'legal', 'accounting', 'hr', 'hiring', 'strategy', 'product management', 'project management', 'management', 'leadership'],
  },
};

const AREAS = Object.keys(TEAM_AREAS) as TeamArea[];

/** Which areas a list of skill names covers. */
export function coveredAreas(skills: readonly string[]): TeamArea[] {
  const names = skills.map((s) => s.toLowerCase());
  return AREAS.filter((area) => names.some((n) => TEAM_AREAS[area].words.some((w) => (w.length <= 3 ? n.split(/[^a-z0-9+#.-]+/).includes(w) : n.includes(w)))));
}

export type TeamGaps = { covered: TeamArea[]; gaps: TeamArea[] };

export function teamGaps(skills: readonly string[]): TeamGaps {
  const covered = coveredAreas(skills);
  return { covered, gaps: AREAS.filter((a) => !covered.includes(a)) };
}
