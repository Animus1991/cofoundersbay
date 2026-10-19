import type { CfbGlyphName } from '@/components/icons/CfbGlyph';

/**
 * What each home offers under its question box: GitHub's dashboard puts
 * "Debug · Agent · Create issue · Write code ▾ · Git ▾ · Pull requests ▾"
 * under its "Ask anything"; ours are the jobs each role comes back for. A
 * chip either asks the assistant (the question is shown in the chat, so the
 * reader sees what was asked) or opens a page; a chip with `items` opens a
 * short menu of the same.
 */
export type HomeAskAction = {
  id: string;
  en: string;
  el: string;
  glyph: CfbGlyphName;
  /** Sent to the assistant in the reader's language. */
  prompt?: { en: string; el: string };
  href?: string;
  items?: HomeAskAction[];
};

/** Where a question is about. "All" adds nothing; the others say so in the question. */
export type HomeAskScope = { id: string; en: string; el: string; leadEn?: string; leadEl?: string };

export type HomeRole = 'founder' | 'mentor' | 'investor' | 'provider' | 'incubator' | 'admin';

const ALL: HomeAskScope = { id: 'all', en: 'Everything', el: 'Όλη η πλατφόρμα' };

const WEEK = (en: string, el: string): HomeAskAction => ({
  id: 'week',
  en: 'My week',
  el: 'Η εβδομάδα μου',
  glyph: 'calendar',
  prompt: { en, el },
});

export const HOME_ASK: Record<HomeRole, { scopes: HomeAskScope[]; actions: HomeAskAction[] }> = {
  founder: {
    scopes: [
      ALL,
      { id: 'matches', en: 'Matches', el: 'Αντιστοιχίσεις', leadEn: 'About my matches', leadEl: 'Για τις αντιστοιχίσεις μου' },
      { id: 'commitments', en: 'Commitments', el: 'Δεσμεύσεις', leadEn: 'About my need cards and commitments', leadEl: 'Για τις κάρτες ανάγκης και τις δεσμεύσεις μου' },
      { id: 'builder', en: 'Startup Builder', el: 'Startup Builder', leadEn: 'About my Startup Builder workspace', leadEl: 'Για τον χώρο μου στον Startup Builder' },
      { id: 'fundraising', en: 'Fundraising', el: 'Χρηματοδότηση', leadEn: 'About my fundraising', leadEl: 'Για τη χρηματοδότησή μου' },
      { id: 'community', en: 'Events & communities', el: 'Εκδηλώσεις & κοινότητες', leadEn: 'About events and communities', leadEl: 'Για εκδηλώσεις και κοινότητες' },
    ],
    actions: [
      {
        id: 'cofounder',
        en: 'Find a co-founder',
        el: 'Βρείτε συνιδρυτή',
        glyph: 'matches',
        items: [
          { id: 'best', en: 'Who fits me best this week', el: 'Ποιοι μου ταιριάζουν αυτή την εβδομάδα', glyph: 'matches', prompt: { en: 'Who fits me best this week, and why?', el: 'Ποιοι μου ταιριάζουν περισσότερο αυτή την εβδομάδα, και γιατί;' } },
          { id: 'tech', en: 'A technical co-founder in Athens', el: 'Τεχνικός συνιδρυτής στην Αθήνα', glyph: 'search', prompt: { en: 'Find me a technical co-founder in Athens.', el: 'Βρες μου τεχνικό συνιδρυτή στην Αθήνα.' } },
          { id: 'compare', en: 'Compare my top two matches', el: 'Σύγκριση των δύο καλύτερων', glyph: 'chart', prompt: { en: 'Compare my two best matches side by side.', el: 'Σύγκρινε δίπλα δίπλα τις δύο καλύτερες αντιστοιχίσεις μου.' } },
        ],
      },
      {
        id: 'need-card',
        en: 'Write a need card',
        el: 'Γράψτε κάρτα ανάγκης',
        glyph: 'pact',
        prompt: {
          en: 'Help me draft my first need card: ask me who my startup needs, then open the filled guide so I can review and publish it.',
          el: 'Βοήθησέ με να συντάξω την πρώτη μου κάρτα ανάγκης: ρώτα με ποιον χρειάζεται η startup μου και άνοιξε τον συμπληρωμένο οδηγό για να τον ελέγξω και να τον δημοσιεύσω.',
        },
      },
      {
        id: 'raise',
        en: 'Pitch & round',
        el: 'Pitch & γύρος',
        glyph: 'wallet',
        items: [
          { id: 'deck', en: "What my pitch deck is missing", el: 'Τι λείπει από το pitch deck', glyph: 'target', prompt: { en: 'What is missing from my pitch deck?', el: 'Τι λείπει από το pitch deck μου;' } },
          { id: 'investors', en: 'Investors who fit my round', el: 'Επενδυτές για τον γύρο μου', glyph: 'wallet', prompt: { en: 'Which investors fit my round, and who could introduce me?', el: 'Ποιοι επενδυτές ταιριάζουν στον γύρο μου, και ποιος μπορεί να με συστήσει;' } },
          { id: 'update', en: "This month's investor update", el: 'Η ενημέρωση επενδυτών του μήνα', glyph: 'chart', prompt: { en: "Draft this month's investor update from what changed.", el: 'Γράψε την ενημέρωση επενδυτών αυτού του μήνα από ό,τι άλλαξε.' } },
        ],
      },
      { id: 'mentor', en: 'Find a mentor', el: 'Βρείτε μέντορα', glyph: 'mentor', prompt: { en: 'Find me a mentor for my next step, and say why each one fits.', el: 'Βρες μου μέντορα για το επόμενο βήμα μου, και πες γιατί ταιριάζει ο καθένας.' } },
      WEEK(
        'Brief me on this founder dashboard: what needs attention this week, summarize the graph, and the next action among intros, matches, messages, or profile gaps.',
        'Ενημέρωσέ με για τον πίνακα του ιδρυτή: τι θέλει προσοχή αυτή την εβδομάδα, μια σύνοψη, και η επόμενη κίνηση ανάμεσα σε γνωριμίες, αντιστοιχίσεις, μηνύματα ή κενά του προφίλ.',
      ),
    ],
  },
  mentor: {
    scopes: [
      ALL,
      { id: 'requests', en: 'Requests', el: 'Αιτήματα', leadEn: 'About my mentoring requests', leadEl: 'Για τα αιτήματα καθοδήγησης' },
      { id: 'sessions', en: 'Sessions', el: 'Συνεδρίες', leadEn: 'About my sessions', leadEl: 'Για τις συνεδρίες μου' },
      { id: 'mentees', en: 'Mentees', el: 'Καθοδηγούμενοι', leadEn: 'About my mentees', leadEl: 'Για όσους καθοδηγώ' },
    ],
    actions: [
      { id: 'first', en: 'Which request first', el: 'Ποιο αίτημα πρώτα', glyph: 'mentor', prompt: { en: 'Which mentoring request should I answer first, and why?', el: 'Ποιο αίτημα καθοδήγησης να απαντήσω πρώτα, και γιατί;' } },
      { id: 'prepare', en: 'Prepare my next session', el: 'Προετοιμασία συνεδρίας', glyph: 'calendar', prompt: { en: 'Prepare me for my next session: who it is with, what we discussed last and what to ask.', el: 'Προετοίμασέ με για την επόμενη συνεδρία: με ποιον είναι, τι συζητήσαμε την τελευταία φορά και τι να ρωτήσω.' } },
      { id: 'follow', en: 'Who needs a follow-up', el: 'Ποιοι θέλουν συνέχεια', glyph: 'people', prompt: { en: 'Which of my mentees need a follow-up this week?', el: 'Ποιοι από όσους καθοδηγώ χρειάζονται συνέχεια αυτή την εβδομάδα;' } },
      WEEK('Brief me on my mentoring week: requests waiting, sessions coming and anything overdue.', 'Ενημέρωσέ με για την εβδομάδα καθοδήγησης: αιτήματα σε αναμονή, συνεδρίες που έρχονται και ό,τι καθυστερεί.'),
    ],
  },
  investor: {
    scopes: [
      ALL,
      { id: 'pipeline', en: 'Pipeline', el: 'Pipeline', leadEn: 'About my deal pipeline', leadEl: 'Για το pipeline συμφωνιών μου' },
      { id: 'scouting', en: 'Scouting', el: 'Αναζήτηση startups', leadEn: 'About startups to scout', leadEl: 'Για startups που αξίζει να δω' },
      { id: 'portfolio', en: 'Portfolio', el: 'Χαρτοφυλάκιο', leadEn: 'About my portfolio', leadEl: 'Για το χαρτοφυλάκιό μου' },
    ],
    actions: [
      { id: 'changed', en: 'What changed in my pipeline', el: 'Τι άλλαξε στο pipeline', glyph: 'chart', prompt: { en: 'What changed in my pipeline this week?', el: 'Τι άλλαξε στο pipeline μου αυτή την εβδομάδα;' } },
      { id: 'scout', en: 'Startups for my thesis', el: 'Startups για τη θέση μου', glyph: 'search', prompt: { en: 'Find startups that fit my investment thesis.', el: 'Βρες startups που ταιριάζουν στη θέση επένδυσής μου.' } },
      { id: 'meeting', en: 'Prepare my next meeting', el: 'Προετοιμασία συνάντησης', glyph: 'calendar', prompt: { en: 'Prepare notes for my next founder meeting.', el: 'Ετοίμασε σημειώσεις για την επόμενη συνάντηση με ιδρυτές.' } },
      WEEK('Brief me on my investor week: deals that moved, founders waiting and what to decide.', 'Ενημέρωσέ με για την εβδομάδα: συμφωνίες που κινήθηκαν, ιδρυτές που περιμένουν και τι πρέπει να αποφασίσω.'),
    ],
  },
  provider: {
    scopes: [
      ALL,
      { id: 'inquiries', en: 'Inquiries', el: 'Αιτήματα', leadEn: 'About my client inquiries', leadEl: 'Για τα αιτήματα πελατών' },
      { id: 'projects', en: 'Projects', el: 'Έργα', leadEn: 'About my client projects', leadEl: 'Για τα έργα πελατών μου' },
      { id: 'services', en: 'Services', el: 'Υπηρεσίες', leadEn: 'About my services', leadEl: 'Για τις υπηρεσίες μου' },
    ],
    actions: [
      { id: 'waiting', en: 'Inquiries waiting', el: 'Αιτήματα σε αναμονή', glyph: 'bell', prompt: { en: 'Which client inquiries are waiting for my reply?', el: 'Ποια αιτήματα πελατών περιμένουν απάντησή μου;' } },
      { id: 'reply', en: 'Draft a reply', el: 'Προσχέδιο απάντησης', glyph: 'messages', prompt: { en: 'Draft a reply to my most recent client inquiry.', el: 'Γράψε προσχέδιο απάντησης στο πιο πρόσφατο αίτημα πελάτη.' } },
      WEEK('Brief me on my provider week: inquiries, active projects and reviews.', 'Ενημέρωσέ με για την εβδομάδα: αιτήματα, ενεργά έργα και αξιολογήσεις.'),
    ],
  },
  incubator: {
    scopes: [
      ALL,
      { id: 'applications', en: 'Applications', el: 'Αιτήσεις', leadEn: 'About programme applications', leadEl: 'Για τις αιτήσεις στα προγράμματα' },
      { id: 'cohorts', en: 'Cohorts', el: 'Κοόρτεις', leadEn: 'About my cohorts', leadEl: 'Για τις κοόρτεις' },
      { id: 'mentors', en: 'Mentors', el: 'Μέντορες', leadEn: 'About our mentors', leadEl: 'Για τους μέντορές μας' },
    ],
    actions: [
      { id: 'decide', en: 'Applications to decide', el: 'Αιτήσεις για απόφαση', glyph: 'bell', prompt: { en: 'Which applications are waiting for a decision?', el: 'Ποιες αιτήσεις περιμένουν απόφαση;' } },
      { id: 'cohort', en: 'How the cohort is doing', el: 'Πώς πάει η κοόρτη', glyph: 'chart', prompt: { en: 'How is the current cohort doing, and who needs help?', el: 'Πώς πάει η τρέχουσα κοόρτη, και ποιος χρειάζεται βοήθεια;' } },
      { id: 'capacity', en: 'Mentors with room', el: 'Μέντορες με χώρο', glyph: 'mentor', prompt: { en: 'Which mentors have room for another founder?', el: 'Ποιοι μέντορες έχουν χώρο για έναν ακόμη ιδρυτή;' } },
      WEEK('Brief me on the programme this week: applications, cohort progress and events.', 'Ενημέρωσέ με για το πρόγραμμα αυτή την εβδομάδα: αιτήσεις, πρόοδος κοόρτης και εκδηλώσεις.'),
    ],
  },
  admin: {
    scopes: [
      ALL,
      { id: 'users', en: 'Users', el: 'Χρήστες', leadEn: 'About users', leadEl: 'Για τους χρήστες' },
      { id: 'reports', en: 'Reports', el: 'Αναφορές', leadEn: 'About reports', leadEl: 'Για τις αναφορές' },
      { id: 'communities', en: 'Communities', el: 'Κοινότητες', leadEn: 'About communities', leadEl: 'Για τις κοινότητες' },
    ],
    actions: [
      { id: 'attention', en: 'What needs an admin', el: 'Τι περιμένει διαχειριστή', glyph: 'shield', prompt: { en: 'What is waiting for an admin right now?', el: 'Τι περιμένει διαχειριστή αυτή τη στιγμή;' } },
      { id: 'reports', en: 'Reports waiting', el: 'Αναφορές σε αναμονή', glyph: 'bell', prompt: { en: 'Show the reports waiting for review, most serious first.', el: 'Δείξε τις αναφορές σε αναμονή, τις σοβαρότερες πρώτα.' } },
      WEEK("Brief me on the platform's week: sign-ups, activity, reports and the API.", 'Ενημέρωσέ με για την εβδομάδα της πλατφόρμας: εγγραφές, δραστηριότητα, αναφορές και API.'),
    ],
  },
};

/** "About my matches: who replied?" — the scope said in the question, so the chat shows what was asked. */
export function scopedPrompt(question: string, scope: HomeAskScope | undefined, lang: 'en' | 'el'): string {
  const q = question.trim();
  const lead = lang === 'el' ? scope?.leadEl : scope?.leadEn;
  return lead ? `${lead}: ${q}` : q;
}

/** Lower case without accents, so "/μεντ" finds "Βρείτε μέντορα". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * The commands "/" offers: every chip and every item of a chip's menu, each
 * once, narrowed by the words after the slash in either language. `null`
 * when the box does not start with a slash.
 */
export function slashCommands(actions: HomeAskAction[], value: string): HomeAskAction[] | null {
  if (!value.startsWith('/')) return null;
  const words = fold(value.slice(1)).split(/\s+/).filter(Boolean);
  const flat = actions.flatMap((action) => (action.items?.length ? action.items : [action]));
  return flat.filter((action) => {
    const label = fold(`${action.en} ${action.el}`);
    return words.every((word) => label.includes(word));
  });
}
