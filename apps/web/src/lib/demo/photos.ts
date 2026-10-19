/**
 * Photos for the demo, each one chosen by eye (2026-10-18, docs §57).
 *
 * People get a real portrait. The demo's cast has one each, and anyone else a
 * portrait that matches the gender of their first name, the same one every
 * time. A name the lists below do not know keeps its initials, as a member
 * without a photo does: a face that contradicts the name would be worse than
 * none. Alex Demo is the reader's own account, so it keeps the neutral
 * picture it always had (golden grass) instead of a stranger's face.
 *
 * Events, programmes, communities, courses and organisations get a photo of
 * what they are about. The title picks a theme first ("pitch" → a speaker on
 * stage, "coffee" → cups on a table, "energy" → wind turbines, "Athens" → the
 * Acropolis), then the type or sector, then what kind of thing it is; the id
 * picks one photo of that theme, so an event has the same cover on every page.
 *
 * Every photo is from Unsplash (free to use; hotlinking is how Unsplash asks
 * to be used) except Alex's, the picsum photo the account had before. A URL
 * already set is never replaced.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-';

/** The reader's own account: a neutral picture, not someone's face. */
export const DEMO_ACCOUNT_PHOTO = 'https://picsum.photos/id/413/200/200';

const THEMES = {
  stage: ['1544531586-fde5298cdd40', '1475721027785-f74eccf877e2', '1587825140708-dfaf72ae4b04', '1582192730841-2a682d7375f9'],
  panel: ['1561489396-888724a1543d', '1591115765373-5207764f72e7'],
  talk: ['1591115765373-5207764f72e7', '1556761175-5973dc0f32e7', '1505373877841-8d25f7d46678', '1559223607-a43c990c692c'],
  conference: ['1540575467063-178a50c2df87', '1560439514-4e9645039924', '1523580494863-6f3031224c94', '1511578314322-379afb476865'],
  coffee: ['1495474472287-4d71bcdd2085', '1554118811-1e0d58224f24', '1501339847302-ac426a4a7cbb', '1445116572660-236099ec97a0'],
  workshop: ['1552664730-d307ca884978', '1512758017271-d7b84c2113f1', '1519389950473-47ba0277781c', '1581291518857-4e27b48ff24e'],
  meeting: ['1517245386807-bb43f82c33c4', '1543269865-cbf427effbad', '1542744173-8e7e53415bb0', '1517048676732-d65bc937f952'],
  networking: ['1515169067868-5387ec356754', '1517457373958-b7bdd4587205', '1528605248644-14dd04022da1', '1515187029135-18ee286d815b'],
  women: ['1522202176988-66273c2fd55f', '1573164713988-8665fc963095', '1531482615713-2afd69097998'],
  energy: ['1466611653911-95081537e5b7', '1509391366360-2e959784a276', '1532601224476-15c79f2f7a51', '1473341304170-971dccb5ac1e', '1508514177221-188b1cf16e9d'],
  health: ['1576091160399-112ba8d25d1d'],
  food: ['1504674900247-0877df9cc836', '1488459716781-31db52582fe9', '1555396273-367ea4eb4db5'],
  agri: ['1500382017468-9049fed747ef'],
  logistics: ['1494412574643-ff11b0a5c1c3', '1586528116311-ad8dd3c8310d'],
  circular: ['1532996122724-e3c354a0b15b'],
  hardware: ['1518770660439-4636190af475', '1581091226825-a6a2a5aee158', '1581092160562-40aa08e78837'],
  ai: ['1677442136019-21780ecad995', '1485827404703-89b55fcc595e', '1451187580459-43490279c0fa', '1620712943543-bcc4688e7485'],
  cloud: ['1573164713988-8665fc963095', '1563986768609-322da13575f3'],
  payments: ['1563013544-824ae1b704d3', '1556742049-0cfed4f6a45d', '1556745757-8d76bdb6984b', '1559526324-4b87b5e36e44'],
  legal: ['1450101499163-c8848c66ca85', '1589829545856-d10d557cf95f', '1554224155-6726b3ff858f'],
  design: ['1581291518857-4e27b48ff24e', '1586717791821-3f44a563fa4c', '1561070791-2526d30994b5', '1559028012-481c04fa702d'],
  code: ['1498050108023-c5249f4df085', '1531482615713-2afd69097998', '1555066931-4365d14bab8c', '1551434678-e076c223a692'],
  office: ['1559136555-9303baea8ebd', '1504384308090-c894fdcc538d', '1497366811353-6870744d04b2', '1524758631624-e2822e304c36', '1556761175-4b46a572b786'],
  // No stock-market chart: raising a round is not trading.
  fundraising: ['1579621970563-ebec7560ff3e', '1542744173-8e7e53415bb0', '1600880292203-757bb62b4baf', '1559526324-4b87b5e36e44'],
  metrics: ['1460925895917-afdab827c52f', '1551288049-bebda4e38f71', '1543286386-713bdd548da4', '1454165804606-c3d57bc86b40'],
  marketing: ['1533750349088-cd871a92f312', '1557838923-2985c318be48', '1543286386-713bdd548da4'],
  deal: ['1521791136064-7986c2920216', '1600880292089-90a7e086ee0c', '1600880292203-757bb62b4baf'],
  learning: ['1523240795612-9a054b0db644', '1513258496099-48168024aec0', '1488190211105-8b0e65b80b4e', '1434030216411-0b793f4b4173', '1501504905252-473c47e087f8'],
  research: ['1481627834876-b7833e8f5570', '1505664194779-8beaceb93744'],
  athens: ['1603565816030-6b389eeb23cb', '1555993539-1732b0258235', '1503152394-c571994fd383'],
  islands: ['1570077188670-e3a8d69ac5ff', '1533105079780-92b9be482077', '1601581875309-fafbf2d3ed3a'],
  team: ['1522071820081-009f0129c71c', '1531545514256-b1400bc00f31', '1556761175-b413da4baf72', '1521737604893-d14cc237f11d'],
} as const satisfies Record<string, readonly string[]>;

export type PhotoTheme = keyof typeof THEMES;

/*
 * Words that pick a theme, tried in order: what happens at an event, then the
 * sector, the kind of programme, the topic, the place and last "people
 * together". A Latin word matches where a word starts ("fundrais" finds
 * "fundraising"); a trailing "$" means the whole word ("ai$" is not "said").
 * Greek stems are written without accents, as the text is compared.
 */
const RULES: ReadonlyArray<readonly [PhotoTheme, readonly string[]]> = [
  ['stage', ['pitch', 'demo day', 'demo-day', 'demoday', 'παρουσιασ']],
  ['panel', ['panel', 'fireside', 'debate', 'πανελ', 'στρογγυλ']],
  ['talk', ['webinar', 'livestream', 'keynote', 'ama$', 'talk$', 'talks$', 'ομιλι', 'διαλεξ']],
  ['conference', ['summit', 'conference', 'expo$', 'festival', 'συνεδριο', 'συνεδριου']],
  ['coffee', ['coffee', 'breakfast', 'brunch', 'καφε', 'πρωινο']],
  ['workshop', ['workshop', 'discovery', 'sprint', 'hackathon', 'interview', 'mvp$', 'prototyp', 'validat', 'εργαστηρι', 'συνεντευξ']],
  ['meeting', ['office hours', 'mentor', 'coaching', 'coach$', 'one-on-one', 'advisory', 'consult', 'ωρες γραφειου', 'μεντορ', 'καθοδηγ', 'συνεδρια', 'συμβουλ']],
  ['networking', ['meetup', 'networking', 'mixer', 'social$', 'happy hour', 'dinner', 'drinks', 'δικτυωσ', 'δειπνο', 'γνωριμι']],
  ['women', ['women', 'γυναικ']],
  ['energy', ['energy', 'climate', 'solar', 'wind$', 'grid$', 'cleantech', 'clean tech', 'green', 'battery', 'storage', 'anemos', 'kyma', 'ενεργει', 'κλιμα', 'ηλιακ', 'ανεμ', 'πρασιν']],
  ['health', ['health', 'medical', 'medtech', 'clinic', 'biotech', 'υγει', 'ιατρ']],
  ['food', ['food', 'restaurant', 'taverna', 'hospitality', 'τροφιμ', 'εστιατορ', 'ταβερν', 'φιλοξενι']],
  ['agri', ['agri', 'farm', 'γεωργ', 'αγροτ']],
  // Not "shipping": in a founder's mouth it means releasing ("shipping AI
  // features"), and the AI event got a warehouse.
  ['logistics', ['logistic', 'supply chain', 'freight', 'maritime', 'ναυτιλ', 'εφοδιαστ', 'μεταφορ']],
  ['circular', ['circular', 'recycl', 'waste', 'ανακυκλ', 'αποβλητ']],
  ['hardware', ['hardware', 'iot$', 'robot', 'electronic', 'chip$', 'chips$', 'manufactur', 'deep tech', 'deeptech', 'ρομποτ', 'ηλεκτρονικ']],
  ['ai', ['ai$', 'machine learning', 'ml$', 'llm', 'neural', 'genai', 'data science', 'τεχνητη νοημοσυνη', 'δεδομεν']],
  ['cloud', ['cloud', 'system design', 'architecture', 'devops', 'infrastructure', 'server', 'security', 'cyber', 'υποδομ', 'ασφαλει']],
  ['payments', ['fintech', 'payment', 'bank', 'invoice', 'insurtech', 'πληρωμ', 'τραπεζ', 'τιμολογ']],
  ['legal', ['legal', 'law$', 'lawyer', 'contract', 'gdpr', 'compliance', 'trademark', 'ip$', 'νομικ', 'δικηγορ', 'συμβολαι']],
  ['design', ['design', 'ux$', 'ui$', 'brand', 'craft', 'studio', 'figma', 'σχεδιασ', 'σχεδιο']],
  ['code', ['engineer', 'developer', 'coding', 'code$', 'full-stack', 'fullstack', 'typescript', 'react$', 'backend', 'frontend', 'open source', 'api$', 'dev$', 'κωδικ', 'μηχανικ', 'προγραμματιστ']],
  ['office', ['accelerator', 'incubator', 'bootcamp', 'cohort', 'programme', 'program$', 'lab$', 'labs$', 'hub$', 'coworking', 'επιταχυντ', 'θερμοκοιτιδ', 'κοορτ', 'προγραμμα']],
  ['fundraising', ['fundrais', 'invest', 'angel', 'ventures', 'capital', 'pre-seed', 'seed$', 'safe$', 'term sheet', 'cap table', 'vc$', 'family office', 'χρηματοδοτ', 'επενδυ', 'αγγελ', 'κεφαλαι']],
  ['metrics', ['saas$', 'metric', 'analytics', 'kpi', 'benchmark', 'dashboard', 'retention', 'churn', 'revenue', 'μετρικ', 'αναλυτικ', 'εσοδ']],
  ['marketing', ['marketing', 'growth', 'go-to-market', 'gtm$', 'seo$', 'content', 'launch', 'αναπτυξ', 'μαρκετινγκ', 'προωθησ']],
  ['deal', ['sales', 'b2b$', 'crm$', 'outbound', 'partnership', 'deal$', 'deals$', 'πωλησ', 'συνεργασι']],
  ['learning', ['course', 'learn', 'edtech', 'education', 'εκπαιδευ', 'academy', 'school', 'university', 'lesson', 'masterclass', 'playbook', 'guide', 'μαθημα', 'μαθηση', 'ακαδημ', 'σχολ', 'πανεπιστημ', 'οδηγ']],
  ['research', ['research', 'paper', 'study', 'report', 'ερευν', 'μελετ', 'αναφορ']],
  ['athens', ['athens', 'acropolis', 'αθην', 'ακροπολ']],
  ['islands', ['greece', 'greek', 'aegean', 'mediterranean', 'island', 'santorini', 'crete', 'cyclades', 'ελλαδ', 'ελληνικ', 'αιγαι', 'μεσογει', 'νησ', 'σαντοριν', 'κρητ', 'κυκλαδ']],
  ['team', ['founders', 'founder', 'community', 'club', 'circle', 'members', 'group', 'team', 'builders', 'ιδρυτ', 'κοινοτητ', 'λεσχη', 'κυκλος', 'μελη', 'ομαδ']],
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const RULE_PATTERNS: ReadonlyArray<readonly [PhotoTheme, RegExp]> = RULES.map(([theme, words]) => {
  const alternatives = words.map((word) => {
    const whole = word.endsWith('$');
    const body = escapeRegExp(whole ? word.slice(0, -1) : word) + (whole ? '(?![a-z0-9])' : '');
    // Greek stems match anywhere; a Latin word must start a word. (No
    // lookbehind: older Safari cannot parse it and the module would fail.)
    return /^[a-z0-9]/.test(word) ? `(?:^|[^a-z0-9])${body}` : body;
  });
  return [theme, new RegExp(alternatives.join('|'))] as const;
});

/** Lower case without accents, so "Εργαστήριο" reads "εργαστηριο". */
function plain(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** The theme a text is about, or null when no word in it picks one. */
export function photoThemeOf(text: string | null | undefined): PhotoTheme | null {
  if (!text) return null;
  const haystack = plain(text);
  for (const [theme, pattern] of RULE_PATTERNS) {
    if (pattern.test(haystack)) return theme;
  }
  return null;
}

/** FNV-1a: a small stable hash, so a seed always picks the same photo. */
function hashOf(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pick<T>(pool: readonly T[], seed: string): T {
  return pool[hashOf(seed) % pool.length];
}

/**
 * A portrait is cropped around the face; anything else around its busiest
 * part ("entropy"), so a cover shown as a wide strip keeps its subject: a
 * centre crop of the solar-panel photo was all sky.
 */
function unsplash(id: string, width: number, height: number, face = false): string {
  return `${UNSPLASH}${id}?w=${width}&h=${height}&fit=crop&crop=${face ? 'faces' : 'entropy'}&auto=format&q=75`;
}

/** Every photo the themes can return, for tests and the docs. */
export function themePhotos(theme: PhotoTheme): readonly string[] {
  return THEMES[theme];
}

/**
 * A cover for `seed` (an id, slug or title). The theme comes from `about`
 * (a title, then a type or sector) when given, else from the seed itself,
 * else `fallback`.
 */
export function demoCover(
  seed: string,
  width = 960,
  height = 540,
  about: ReadonlyArray<string | null | undefined> = [],
  fallback: PhotoTheme = 'office',
): string {
  const theme = [...about, seed].map(photoThemeOf).find((found): found is PhotoTheme => found != null) ?? fallback;
  return unsplash(pick(THEMES[theme], seed.trim()), width, height);
}

/** A square picture for an organisation without a logo, from its name and sector. */
export function demoLogo(name: string, about: ReadonlyArray<string | null | undefined> = [], size = 160): string {
  return demoCover(name, size, size, [name, ...about], 'office');
}

/**
 * Whether this browser is in the demo. A copy of `isPreviewDemo`, because
 * preview-demo.ts imports this module (the account's picture) and importing it
 * back would read that constant before it exists.
 */
function inDemoBrowser(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return (
      document.cookie.includes('cfb_preview_demo=1') ||
      document.cookie.includes('cfb_session=preview-demo') ||
      window.localStorage.getItem('cfb_demo_data') === '1' ||
      window.location.hostname.endsWith('.trycloudflare.com')
    );
  } catch {
    return false;
  }
}

/**
 * A picture for a mark a page draws from a name (a startup read from a
 * headline, a cohort, a community), in the demo only: a real account keeps
 * its initials or icon until an organisation uploads a logo. Radix shows the
 * image only after it loads, so the server's render (no picture) still matches.
 */
export function demoMark(
  name: string | null | undefined,
  about: ReadonlyArray<string | null | undefined> = [],
  size = 160,
): string | undefined {
  const text = name?.trim();
  if (!text || !inDemoBrowser()) return undefined;
  return demoLogo(text, about, size);
}

/* ---------------------------------------------------------------- people */

const WOMEN = new Set([
  'anna', 'maria', 'elena', 'eleni', 'helena', 'helen', 'sofia', 'sophia', 'katerina', 'catherine', 'christina', 'ioanna',
  'joanna', 'irini', 'eirini', 'irene', 'lydia', 'chrysa', 'vasso', 'vasiliki', 'georgia', 'dimitra', 'despina', 'athena',
  'penelope', 'zoe', 'nefeli', 'danae', 'sarah', 'sara', 'jane', 'emma', 'lisa', 'priya', 'andreea', 'olivia', 'emily',
  'laura', 'julia', 'anastasia', 'natalia', 'alexandra', 'eva', 'mia', 'marina', 'theodora', 'angeliki', 'konstantina',
  'panagiota', 'fotini', 'stella', 'rena', 'niki', 'kalliopi', 'effie', 'myrto', 'artemis', 'evi', 'kate', 'rachel',
  'jessica', 'amanda', 'linda', 'susan', 'karen', 'nancy', 'amy', 'ana', 'lucia', 'chloe', 'grace',
  'αννα', 'μαρια', 'ελενα', 'ελενη', 'σοφια', 'κατερινα', 'χριστινα', 'ιωαννα', 'ειρηνη', 'λυδια', 'χρυσα', 'βασω',
  'γεωργια', 'δημητρα', 'δεσποινα', 'αθηνα', 'πηνελοπη', 'ζωη', 'νεφελη', 'δαναη', 'σταυρουλα', 'μυρτω', 'φωτεινη',
]);

const MEN = new Set([
  'marcus', 'nikos', 'nick', 'nicholas', 'nikolas', 'yannis', 'giannis', 'john', 'james', 'dimitris', 'giorgos', 'george',
  'thanos', 'athanasios', 'stavros', 'spyros', 'petros', 'peter', 'mike', 'michael', 'michalis', 'kostas', 'konstantinos',
  'fotis', 'david', 'andreas', 'andrew', 'tom', 'thomas', 'klaus', 'alexis', 'alexandros', 'christos', 'vasilis', 'panagiotis',
  'manolis', 'antonis', 'stelios', 'lefteris', 'sotiris', 'ilias', 'elias', 'aris', 'haris', 'pavlos', 'paul', 'mark',
  'daniel', 'robert', 'richard', 'william', 'joseph', 'charles', 'matthew', 'ben', 'jack', 'ryan', 'kevin', 'brian',
  'jason', 'eric', 'steven', 'raj', 'arjun', 'omar', 'ali', 'lukas', 'jonas', 'felix', 'leo', 'max',
  'νικος', 'γιαννης', 'δημητρης', 'γιωργος', 'θανος', 'σταυρος', 'σπυρος', 'πετρος', 'κωστας', 'φωτης', 'ανδρεας',
  'μιχαλης', 'αλεξης', 'χρηστος', 'βασιλης', 'παναγιωτης', 'μανωλης', 'αντωνης', 'στελιος', 'ηλιας', 'αρης', 'παυλος',
]);

/**
 * The demo's cast, one portrait each, so no two people share a face. Faces
 * were matched to names and roles by eye: an investor in a suit, mentors who
 * look the part, East Asian faces for Kim, Chen, Zhang and Park.
 */
const CAST: Record<string, string> = {
  'elena papadopoulos': '1567532939604-b6b5b0db2604',
  'marcus chen': '1611403119860-57c4937ef987',
  'sarah kim': '1573497019236-17f8177b81e8',
  'sofia alexiou': '1580489944761-15a19d654956',
  'nikos andreou': '1560250097-0b93528c311a',
  'yannis petrou': '1547425260-76bcadfb4f2c',
  'maria georgiou': '1607746882042-944635dfe10e',
  'dimitris kostas': '1545167622-3a6ac756afa4',
  'katerina nikolaou': '1544005313-94ddf0286df2',
  'giorgos vlachos': '1507003211169-0a1dd7228f2d',
  'christina mavrou': '1494790108377-be9c29b29330',
  'ioanna pappa': '1573496359142-b8d87734a5a2',
  'anna lambrou': '1438761681033-6461ffad8d80',
  'thanos rigas': '1618077360395-f3068be8e001',
  'alex dimitriou': '1500648767791-00dcc994a43e',
  'alex kumar': '1633332755192-727a05c4013d',
  'alex georgiou': '1531427186611-ecfd6d936c79',
  'james wilson': '1506794778202-cad84cf45f1d',
  'sarah chen': '1614644147724-2d4785d69962',
  'sarah johnson': '1594744803329-e58b31de8bf5',
  'sarah williams': '1508214751196-bcfd4ca60f91',
  'maria santos': '1531123897727-8f129e1688ce',
  'jane smith': '1499952127939-9bbf5af6c51c',
  'vasso kyriakou': '1609505848912-b7c3b8b4beda',
  'sofia mela': '1619895862022-09114b41f16f',
  'maria sotiropoulou': '1573497019940-1c28c88b4f3e',
  'lydia karra': '1592621385612-4d7129426394',
  'lisa zhang': '1548142813-c348350df52b',
  'lisa park': '1573496799652-408c2ac9fe98',
  'irini stathopoulou': '1611432579699-484f7990b127',
  'ioanna vlachou': '1525134479668-1bee5c7c6845',
  'emma davis': '1554151228-14d9def656e4',
  'eleni markou': '1618835962148-cf177563c6c0',
  'elena kosta': '1601412436009-d964bd02edbc',
  'chrysa vlachou': '1534528741775-53994a69daeb',
  'anna kowalski': '1489424731084-a5d8b219a5bb',
  'andreea ionescu': '1546961329-78bef0414d7c',
  'priya nair': '1488426862026-3ee34a7d66df',
  'helena brandt': '1566616213894-2d4e1baee5d8',
  'stavros mitsos': '1599566150163-29194dcaad36',
  'spyros karras': '1570295999919-56ceb5ecca61',
  'petros ioannou': '1590086782957-93c06ef21604',
  'nikos papas': '1590086782792-42dd2350140d',
  'mike ross': '1527980965255-d3b416303d12',
  'mike johnson': '1535713875002-d1d0cf377fde',
  'michael chen': '1566492031773-4f4e44671857',
  'kostas panou': '1600180758890-6b94519a8ba6',
  'kostas dimou': '1629425733761-caae3b5f2e50',
  'john doe': '1472099645785-5658abf4ff4e',
  'fotis lazarou': '1557862921-37829c790f19',
  'dimitris alexiou': '1474176857210-7287d38d27c6',
  'david park': '1568602471122-7832951cc4c5',
  'david kim': '1615109398623-88346a601842',
  'andreas sotiriou': '1504257432389-52343af06ae3',
  'michalis theodorou': '1519085360753-af0119f7cbe7',
  'klaus weber': '1552058544-f2b08422138a',
  'tom brown': '1528892952291-009c663ce843',
  'alexis petridis': '1584999734482-0361aecad844',
};

const CAST_FACES = new Set(Object.values(CAST));

/** Faces no one in the cast has, for names the cast does not list. */
const WOMEN_POOL = [
  '1598550874175-4d0ef436c909', '1557555187-23d685287bc3', '1586297135537-94bc9ba060aa', '1487412720507-e7ab37603c6f',
  '1567336273898-ebbf9eb3c3bf', '1542206395-9feb3edaa68d', '1544725176-7c40e5a71c5e',
].filter((id) => !CAST_FACES.has(id));
const MEN_POOL = [
  '1463453091185-61582044d556', '1595152772835-219674b2a8a6', '1539571696357-5a69c17a67c6', '1564564321837-a57b7070ac4f',
  '1541647376583-8934aaf3448a', '1558203728-00f45181dd84', '1492562080023-ab3db95bfbce',
].filter((id) => !CAST_FACES.has(id));

const ACCOUNT_IDS = new Set(['preview-demo-user', 'me', 'you']);

/** "Dr. Sarah Kim" → "sarah kim": titles and punctuation are not part of the key. */
function nameKey(name: string): string {
  return plain(name)
    .replace(/(^|\s)(dr|mr|mrs|ms|prof)\.?(?=\s)/g, ' ')
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function portraitId(name: string): string | null {
  const key = nameKey(name);
  if (!key) return null;
  if (CAST[key]) return CAST[key];
  const first = key.split(' ')[0];
  if (WOMEN.has(first)) return pick(WOMEN_POOL, key);
  if (MEN.has(first)) return pick(MEN_POOL, key);
  return null;
}

/**
 * The portrait for a person, by name (or the account's id), or null when the
 * name gives no safe guess, so the caller keeps the initials.
 */
export function demoPortrait(nameOrId: string | null | undefined, size = 200): string | null {
  const raw = nameOrId?.trim();
  if (!raw) return null;
  if (ACCOUNT_IDS.has(raw) || nameKey(raw) === 'alex demo') return DEMO_ACCOUNT_PHOTO;
  const id = portraitId(raw);
  return id ? unsplash(id, size, size, true) : null;
}

/* ---------------------------------------------------------------- agents */

const AGENT_PHOTOS: Record<string, string> = {
  general: '1485827404703-89b55fcc595e',
  matching: '1521791136064-7986c2920216',
  research: '1481627834876-b7833e8f5570',
  'pitch-coach': '1544531586-fde5298cdd40',
  'mentor-finder': '1517245386807-bb43f82c33c4',
  'market-analyst': '1460925895917-afdab827c52f',
  fundraising: '1579621970563-ebec7560ff3e',
  'legal-advisor': '1589829545856-d10d557cf95f',
  'technical-advisor': '1498050108023-c5249f4df085',
  'growth-strategist': '1543286386-713bdd548da4',
};

/** A photo of what an assistant agent helps with (the pitch coach: a speaker on stage). */
export function demoAgentPhoto(agentId: string, size = 96): string {
  return unsplash(AGENT_PHOTOS[agentId] ?? THEMES.ai[0], size, size);
}

/* ------------------------------------------------------- filling payloads */

const PORTRAIT_KEYS = new Set(['avatarUrl', 'avatar', 'profilePhoto', 'photoUrl', 'photoURL', 'picture']);
const LOGO_KEYS = new Set(['logoUrl', 'providerLogo', 'companyLogo', 'partnerLogo', 'organizationLogo', 'orgLogoUrl']);
const COVER_KEYS = new Set(['coverImageUrl', 'imageUrl', 'heroImageUrl', 'coverUrl', 'bannerUrl']);
/** `clientAvatar` belongs to `clientName`, `fromUserAvatar` to `fromUserName`, and so on. */
const PREFIXED_PORTRAIT = /^([a-z][a-zA-Z]*)(Avatar|AvatarUrl|Photo|PhotoUrl)$/;
/** The prefixes of a `…Name` field that names a person, so `…Avatar` can be added beside it. */
const PERSON_PREFIX =
  /^(client|coach|mentor|mentee|investor|founder|author|sender|recipient|requester|from|fromUser|toUser|endorser|host|owner|member|provider|reviewer|viewer|introducer|target|speaker|organizer|contact|partner|candidate|applicant|assignee|creator|actor|expert)$/;
const PERSON_TYPES = new Set(['person', 'people', 'user', 'member', 'mentor', 'investor', 'founder', 'profile']);

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * "ioanna@aegeanlab.example" → "Ioanna": someone invited by email has no name
 * yet, but the mailbox usually is one. "hello@…" gives a word no list knows,
 * so it keeps its initials.
 */
function nameFromEmail(value: unknown): string | null {
  const local = textOf(value)?.split('@')[0]?.split(/[._+-]/)[0];
  return local && /^\p{L}{2,}$/u.test(local) ? local[0].toUpperCase() + local.slice(1).toLowerCase() : null;
}

function personNameOf(obj: Record<string, unknown>): string | null {
  const full = [textOf(obj.firstName), textOf(obj.lastName)].filter(Boolean).join(' ');
  return textOf(obj.displayName) ?? textOf(obj.fullName) ?? textOf(obj.name) ?? (full || null) ?? nameFromEmail(obj.email);
}

function portraitFor(obj: Record<string, unknown>): string | null {
  const id = textOf(obj.userId) ?? textOf(obj.id);
  if (id && ACCOUNT_IDS.has(id)) return DEMO_ACCOUNT_PHOTO;
  return demoPortrait(personNameOf(obj));
}

type Kind = 'event' | 'program' | 'community' | 'course' | 'org';

const KIND_FALLBACK: Record<Kind, PhotoTheme> = {
  event: 'networking',
  program: 'office',
  community: 'team',
  course: 'learning',
  org: 'office',
};

function kindOf(obj: Record<string, unknown>): Kind {
  const has = (...keys: string[]) => keys.some((key) => key in obj);
  if (has('applicationDeadline', 'programType', 'cohortSize', 'spotsLeft')) return 'program';
  if (has('startsAt', 'startTime', 'eventType', 'attendeeCount', 'rsvpStatus', 'isOnline')) return 'event';
  if (has('memberCount', 'membersCount', 'postCount', 'postsCount')) return 'community';
  if (has('lessons', 'modules', 'difficulty', 'lessonCount')) return 'course';
  return 'org';
}

function aboutOf(obj: Record<string, unknown>): Array<string | null> {
  return ['title', 'name', 'displayName', 'type', 'category', 'eventType', 'programType', 'format', 'industry', 'sector'].map(
    (key) => textOf(obj[key]),
  );
}

function coverFor(obj: Record<string, unknown>): string | null {
  const seed = textOf(obj.id) ?? textOf(obj.slug) ?? textOf(obj.title) ?? textOf(obj.name);
  // 3:1: covers are shown as strips (a card's band, the featured event).
  return seed ? demoCover(seed, 1200, 400, aboutOf(obj), KIND_FALLBACK[kindOf(obj)]) : null;
}

/** The name an organisation's picture is chosen by, for each field that holds one. */
function logoNameOf(obj: Record<string, unknown>, key: string): string | null {
  switch (key) {
    case 'providerLogo':
    case 'providerAvatar':
      return textOf(obj.providerName) ?? textOf(obj.provider) ?? textOf(obj.name);
    case 'partnerLogo':
      return textOf(obj.partner) ?? textOf(obj.partnerName) ?? textOf(obj.name);
    case 'companyLogo':
      return textOf(obj.company) ?? textOf(obj.companyName) ?? textOf(obj.name);
    default:
      return textOf(obj.name) ?? textOf(obj.displayName) ?? textOf(obj.companyName) ?? textOf(obj.company) ?? textOf(obj.title);
  }
}

function logoFor(obj: Record<string, unknown>, key: string): string | null {
  const name = logoNameOf(obj, key);
  return name ? demoLogo(name, [textOf(obj.industry), textOf(obj.sector), textOf(obj.category), textOf(obj.type)]) : null;
}

/** A provider is a person or a firm: a face for "Alexandra Kosta", a picture of the trade for "ByteCraft Studio". */
function providerPicture(obj: Record<string, unknown>, key: string): string | null {
  return demoPortrait(textOf(obj.providerName)) ?? logoFor(obj, key);
}

function isPersonRecord(obj: Record<string, unknown>): boolean {
  const type = (textOf(obj.type) ?? textOf(obj.kind))?.toLowerCase();
  return type != null && PERSON_TYPES.has(type);
}

function hasLogoKey(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).some((key) => LOGO_KEYS.has(key));
}

type Options = {
  /**
   * The field the caller's component reads a person's picture from, when it
   * is not `avatarUrl` (a sample list drawn with `coach.avatar`). Records in
   * a list passed with this option are people, so a plain `name` counts.
   */
  portraitKey?: string;
  /**
   * The field an organisation's picture is read from, when the records in
   * the list are companies without one (`deal.logoUrl`): each gets a square
   * picture of its sector under that key.
   */
  logoKey?: string;
};

function fill(obj: Record<string, unknown>, options: Options): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  let hasPortraitKey = false;
  for (const [key, value] of Object.entries(obj)) {
    const prefixed = PORTRAIT_KEYS.has(key) ? null : PREFIXED_PORTRAIT.exec(key);
    if (PORTRAIT_KEYS.has(key) || prefixed) hasPortraitKey = true;
    if (!isEmpty(value)) {
      next[key] = walk(value, options);
    } else if (PORTRAIT_KEYS.has(key) || key === options.portraitKey) {
      next[key] = portraitFor(obj) ?? value;
    } else if (prefixed) {
      next[key] = (prefixed[1] === 'provider' ? providerPicture(obj, key) : demoPortrait(textOf(obj[`${prefixed[1]}Name`]))) ?? value;
    } else if (LOGO_KEYS.has(key)) {
      next[key] = logoFor(obj, key) ?? value;
    } else if (COVER_KEYS.has(key)) {
      next[key] = (isPersonRecord(obj) ? demoPortrait(personNameOf(obj) ?? textOf(obj.title)) : coverFor(obj)) ?? value;
    } else {
      next[key] = value;
    }
  }
  // A person with no photo field at all still gets one: under the key the
  // caller named, or the usual one. Without that option only a person's own
  // fields count (a plain `name` is as often a company's).
  const portraitKey = options.portraitKey ?? 'avatarUrl';
  const named = options.portraitKey
    ? personNameOf(obj)
    : textOf(obj.displayName) ?? textOf(obj.fullName) ?? textOf(obj.firstName);
  if (!hasPortraitKey && !(portraitKey in obj) && named && !hasLogoKey(obj)) {
    const portrait = portraitFor(obj);
    if (portrait) next[portraitKey] = portrait;
  }
  // A company in a list passed with `logoKey` gets a picture of its sector; a
  // person in the same list (a team member) is left to the portrait rules.
  const companyName = textOf(obj.name) ?? textOf(obj.companyName);
  if (options.logoKey && !(options.logoKey in obj) && companyName && !demoPortrait(companyName)) {
    next[options.logoKey] = logoFor(obj, options.logoKey);
  }
  // `clientName: 'Tom Brown'` with no `clientAvatar` beside it gets one.
  for (const [key, value] of Object.entries(obj)) {
    const prefix = key.endsWith('Name') ? key.slice(0, -4) : '';
    if (!PERSON_PREFIX.test(prefix)) continue;
    if ([`${prefix}Avatar`, `${prefix}AvatarUrl`, `${prefix}Photo`, `${prefix}PhotoUrl`].some((own) => own in obj)) continue;
    const portrait = prefix === 'provider' ? providerPicture(obj, `${prefix}Avatar`) : demoPortrait(textOf(value));
    if (portrait) next[`${prefix}Avatar`] = portrait;
  }
  return next;
}

function walk(value: unknown, options: Options): unknown {
  if (Array.isArray(value)) return value.map((item) => walk(item, options));
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  return fill(value as Record<string, unknown>, options);
}

/**
 * Copies a demo payload and fills its empty photo fields: portraits for
 * people, a picture of the subject for events, programmes, communities and
 * organisations. A URL already set stays.
 */
export function attachDemoPhotos<T>(value: T, options: Options = {}): T {
  return walk(value, options) as T;
}
