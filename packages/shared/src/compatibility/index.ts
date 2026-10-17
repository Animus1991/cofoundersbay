/**
 * How two people would work together, asked rather than guessed.
 *
 * The match page drew a "work style" chart from a risk field nothing wrote
 * (every member scored 30), a commitment spelling profile edit never saves,
 * and keyword counts. These ten questions are the ones co-founders are told
 * to settle before they start - time, money, risk, decisions, place, the
 * long-term aim - each with the reason it is asked.
 *
 * A member's own answers are theirs: another member sees only, per question
 * both answered, whether they agree, are close, or should talk first, with a
 * prompt for the conversation. No score is shown below `COMPAT_MIN_SHARED`
 * shared answers, because two answers say little. One rule for the API, the
 * demo world and the web.
 */

export type Bilingual = { en: string; el: string };

/**
 * `ordinal`: options run along one scale; neighbours are close.
 * `categorical`: the same answer agrees; a different one is a talk.
 * `complement`: some different answers fit together (an idea and someone who wants to join one).
 */
export type CompatKind = 'ordinal' | 'categorical' | 'complement';

export interface CompatOption {
  value: string;
  label: Bilingual;
}

export interface CompatQuestion {
  id: string;
  kind: CompatKind;
  question: Bilingual;
  /** Why we ask: shown under the question, so nobody answers blind. */
  why: Bilingual;
  options: readonly CompatOption[];
  /** For `complement`: pairs that fit, and an answer that is close to anything. */
  fits?: readonly (readonly [string, string])[];
  flexible?: string;
  /** What to talk about when two answers differ. */
  talk: Bilingual;
}

export const COMPAT_QUESTIONS: readonly CompatQuestion[] = [
  {
    id: 'hours',
    kind: 'ordinal',
    question: { en: 'Hours a week you can give the startup now', el: 'Ώρες την εβδομάδα που μπορείτε να δώσετε τώρα στην startup' },
    why: { en: 'Unequal time is the most common reason co-founders part ways.', el: 'Ο άνισος χρόνος είναι ο συχνότερος λόγος που χωρίζουν οι συνιδρυτές.' },
    options: [
      { value: 'under_10', label: { en: 'Under 10', el: 'Κάτω από 10' } },
      { value: '10_20', label: { en: '10 to 20', el: '10 έως 20' } },
      { value: '20_40', label: { en: '20 to 40', el: '20 έως 40' } },
      { value: '40_plus', label: { en: '40 or more', el: '40 ή περισσότερες' } },
    ],
    talk: { en: 'How many hours each of you gives, and when that changes.', el: 'Πόσες ώρες δίνει ο καθένας σας, και πότε αλλάζει αυτό.' },
  },
  {
    id: 'start',
    kind: 'ordinal',
    question: { en: 'When you can start', el: 'Πότε μπορείτε να ξεκινήσετε' },
    why: { en: 'A partner who can start in six months is a different plan from one who starts now.', el: 'Ένας συνεργάτης που ξεκινά σε έξι μήνες είναι άλλο σχέδιο από έναν που ξεκινά τώρα.' },
    options: [
      { value: 'now', label: { en: 'Now', el: 'Τώρα' } },
      { value: '1_3_months', label: { en: 'In 1 to 3 months', el: 'Σε 1 έως 3 μήνες' } },
      { value: '3_6_months', label: { en: 'In 3 to 6 months', el: 'Σε 3 έως 6 μήνες' } },
      { value: 'later', label: { en: 'Later', el: 'Αργότερα' } },
    ],
    talk: { en: 'The date each of you starts, and what happens until then.', el: 'Πότε ξεκινά ο καθένας σας, και τι γίνεται μέχρι τότε.' },
  },
  {
    id: 'runway',
    kind: 'ordinal',
    question: { en: 'Months you can go without a salary', el: 'Μήνες που μπορείτε να μείνετε χωρίς μισθό' },
    why: { en: 'It decides how soon the startup must pay you, and so its first plan.', el: 'Καθορίζει πόσο σύντομα πρέπει να σας πληρώνει η startup, άρα και το πρώτο σχέδιο.' },
    options: [
      { value: 'under_3', label: { en: 'Under 3', el: 'Κάτω από 3' } },
      { value: '3_6', label: { en: '3 to 6', el: '3 έως 6' } },
      { value: '6_12', label: { en: '6 to 12', el: '6 έως 12' } },
      { value: '12_plus', label: { en: 'More than 12', el: 'Περισσότερους από 12' } },
    ],
    talk: { en: 'When each of you needs a salary, and what the startup does before then.', el: 'Πότε χρειάζεται μισθό ο καθένας σας, και τι κάνει η startup ως τότε.' },
  },
  {
    id: 'equity',
    kind: 'categorical',
    question: { en: 'How equity should be split between co-founders', el: 'Πώς πρέπει να μοιραστεί το equity μεταξύ συνιδρυτών' },
    why: { en: 'Agreeing on the principle early keeps the number from becoming the argument.', el: 'Η συμφωνία στην αρχή νωρίς εμποδίζει τον αριθμό να γίνει η διαφωνία.' },
    options: [
      { value: 'equal', label: { en: 'Equally', el: 'Ισόποσα' } },
      { value: 'by_contribution', label: { en: 'By what each brings', el: 'Ανάλογα με ό,τι φέρνει ο καθένας' } },
      { value: 'by_time', label: { en: 'By time and role, with vesting', el: 'Ανάλογα με χρόνο και ρόλο, με vesting' } },
      { value: 'open', label: { en: 'Open to discuss', el: 'Ανοιχτό σε συζήτηση' } },
    ],
    flexible: 'open',
    talk: { en: 'The principle behind the split, before any percentage.', el: 'Την αρχή πίσω από τη μοιρασιά, πριν από οποιοδήποτε ποσοστό.' },
  },
  {
    id: 'risk',
    kind: 'ordinal',
    question: { en: 'How much risk you are comfortable with', el: 'Πόσο ρίσκο σας είναι άνετο' },
    why: { en: 'It shows up in every hire, spend and pivot you will decide together.', el: 'Φαίνεται σε κάθε πρόσληψη, έξοδο και αλλαγή κατεύθυνσης που θα αποφασίσετε μαζί.' },
    options: [
      { value: 'low', label: { en: 'Low: protect what we have', el: 'Χαμηλό: προστατεύουμε ό,τι έχουμε' } },
      { value: 'medium', label: { en: 'Medium: calculated bets', el: 'Μέτριο: υπολογισμένα στοιχήματα' } },
      { value: 'high', label: { en: 'High: big bets, fast', el: 'Υψηλό: μεγάλα στοιχήματα, γρήγορα' } },
    ],
    talk: { en: 'A recent risky decision each of you took, and how you would take it together.', el: 'Μια πρόσφατη ριψοκίνδυνη απόφαση του καθενός σας, και πώς θα την παίρνατε μαζί.' },
  },
  {
    id: 'decisions',
    kind: 'categorical',
    question: { en: 'How decisions should be made', el: 'Πώς πρέπει να παίρνονται οι αποφάσεις' },
    why: { en: 'Deadlocks between two founders need a rule before they happen.', el: 'Τα αδιέξοδα ανάμεσα σε δύο ιδρυτές χρειάζονται κανόνα πριν συμβούν.' },
    options: [
      { value: 'consensus', label: { en: 'Together, until we agree', el: 'Μαζί, μέχρι να συμφωνήσουμε' } },
      { value: 'owner', label: { en: 'The owner of the area decides', el: 'Αποφασίζει ο υπεύθυνος του τομέα' } },
      { value: 'data', label: { en: 'Whatever the evidence says', el: 'Ό,τι λένε τα δεδομένα' } },
    ],
    talk: { en: 'Who decides when you disagree, area by area.', el: 'Ποιος αποφασίζει όταν διαφωνείτε, τομέα προς τομέα.' },
  },
  {
    id: 'place',
    kind: 'ordinal',
    question: { en: 'Where you want to work', el: 'Πού θέλετε να δουλεύετε' },
    why: { en: 'Remote and same-office teams need different habits from day one.', el: 'Οι ομάδες από απόσταση και στο ίδιο γραφείο χρειάζονται άλλες συνήθειες από την πρώτη μέρα.' },
    options: [
      { value: 'remote', label: { en: 'Remote', el: 'Από απόσταση' } },
      { value: 'hybrid', label: { en: 'Hybrid', el: 'Υβριδικά' } },
      { value: 'same_city', label: { en: 'In the same city', el: 'Στην ίδια πόλη' } },
    ],
    talk: { en: 'How often you meet in person, and where.', el: 'Πόσο συχνά συναντιέστε από κοντά, και πού.' },
  },
  {
    id: 'idea',
    kind: 'complement',
    question: { en: 'Do you bring an idea, or want to join one?', el: 'Φέρνετε μια ιδέα ή θέλετε να μπείτε σε μία;' },
    why: { en: 'Two people with their own ideas need to pick one; an idea and a joiner fit at once.', el: 'Δύο άνθρωποι με δικές τους ιδέες πρέπει να διαλέξουν μία· μια ιδέα κι ένας που θέλει να μπει ταιριάζουν αμέσως.' },
    options: [
      { value: 'have_idea', label: { en: 'I have an idea', el: 'Έχω ιδέα' } },
      { value: 'want_to_join', label: { en: 'I want to join one', el: 'Θέλω να μπω σε μία' } },
      { value: 'open', label: { en: 'Either', el: 'Οτιδήποτε από τα δύο' } },
    ],
    fits: [['have_idea', 'want_to_join']],
    flexible: 'open',
    talk: { en: 'Whose idea you build, and how the other shapes it.', el: 'Ποιανού την ιδέα χτίζετε, και πώς τη διαμορφώνει ο άλλος.' },
  },
  {
    id: 'pace',
    kind: 'ordinal',
    question: { en: 'Your working pace', el: 'Ο ρυθμός δουλειάς σας' },
    why: { en: 'Burnout and frustration both start with mismatched pace.', el: 'Η εξουθένωση και η απογοήτευση ξεκινούν από αταίριαστο ρυθμό.' },
    options: [
      { value: 'steady', label: { en: 'Steady, sustainable weeks', el: 'Σταθερές, βιώσιμες εβδομάδες' } },
      { value: 'sprints', label: { en: 'Sprints with breaks', el: 'Σπριντ με διαλείμματα' } },
      { value: 'always_on', label: { en: 'Always on', el: 'Πάντα σε λειτουργία' } },
    ],
    talk: { en: 'What a normal week looks like for each of you, evenings and weekends included.', el: 'Πώς είναι μια κανονική εβδομάδα για τον καθένα σας, μαζί με βράδια και σαββατοκύριακα.' },
  },
  {
    id: 'aim',
    kind: 'categorical',
    question: { en: 'What you want in the long run', el: 'Τι θέλετε μακροπρόθεσμα' },
    why: { en: 'A company built to last and one built to raise and grow fast take different roads.', el: 'Μια εταιρεία φτιαγμένη να διαρκέσει και μια φτιαγμένη για χρηματοδότηση και γρήγορη ανάπτυξη παίρνουν άλλους δρόμους.' },
    options: [
      { value: 'profitable', label: { en: 'A profitable company we run', el: 'Μια κερδοφόρα εταιρεία που τρέχουμε' } },
      { value: 'venture_scale', label: { en: 'Raise and grow fast', el: 'Χρηματοδότηση και γρήγορη ανάπτυξη' } },
      { value: 'acquisition', label: { en: 'Build it, then sell it', el: 'Τη χτίζουμε και την πουλάμε' } },
      { value: 'undecided', label: { en: 'Not decided yet', el: 'Δεν έχω αποφασίσει' } },
    ],
    flexible: 'undecided',
    talk: { en: 'Where each of you wants the company to be in five years.', el: 'Πού θέλει ο καθένας σας να είναι η εταιρεία σε πέντε χρόνια.' },
  },
];

export type CompatQuestionId = (typeof COMPAT_QUESTIONS)[number]['id'];
export type CompatAnswers = Record<string, string>;

/** Below this many questions answered by both, no agreement figure is shown. */
export const COMPAT_MIN_SHARED = 3;

export const COMPAT_COPY = {
  title: { en: 'How you like to work', el: 'Πώς σας αρέσει να δουλεύετε' },
  intro: {
    en: 'Ten questions co-founders are told to settle before they start. Others never see your answers: they see, per question you both answered, whether you agree, are close, or should talk first.',
    el: 'Δέκα ερωτήσεις που λένε στους συνιδρυτές να ξεκαθαρίσουν πριν ξεκινήσουν. Οι άλλοι δεν βλέπουν ποτέ τις απαντήσεις σας: βλέπουν, για κάθε ερώτηση που απαντήσατε και οι δύο, αν συμφωνείτε, είστε κοντά ή πρέπει να το συζητήσετε πρώτα.',
  },
  fewShared: {
    en: `Fewer than ${COMPAT_MIN_SHARED} questions answered by both of you, so there is nothing to compare yet.`,
    el: `Λιγότερες από ${COMPAT_MIN_SHARED} ερωτήσεις έχουν απαντηθεί και από τους δύο, οπότε δεν υπάρχει ακόμη τίποτα για σύγκριση.`,
  },
  verdict: {
    agree: { en: 'Agree', el: 'Συμφωνείτε' },
    close: { en: 'Close', el: 'Κοντά' },
    talk: { en: 'Talk first', el: 'Συζητήστε πρώτα' },
  },
} as const;

export type CompatVerdict = 'agree' | 'close' | 'talk';

export interface CompatItem {
  id: string;
  question: Bilingual;
  verdict: CompatVerdict;
  /** Only for `talk` and `close`: what to settle in the first conversation. */
  talk?: Bilingual;
}

export interface CompatComparison {
  /** Questions both people answered. */
  shared: number;
  /** Questions in the set. */
  total: number;
  items: CompatItem[];
  agree: number;
  close: number;
  talk: number;
  /** 0..1, or null below `COMPAT_MIN_SHARED` shared answers. */
  share: number | null;
}

const BY_ID = new Map(COMPAT_QUESTIONS.map((q) => [q.id, q]));

export type CompatRead = { ok: true; value: CompatAnswers } | { ok: false; field: string; reason: Bilingual };

/**
 * A member's answers from a request body: known questions, known options.
 * A question sent as null or '' is cleared; questions not sent are left out,
 * so a caller can save one answer at a time.
 */
export function readCompatAnswers(raw: unknown): CompatRead {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, field: 'answers', reason: { en: 'Send the answers as an object.', el: 'Στείλτε τις απαντήσεις ως αντικείμενο.' } };
  }
  const value: CompatAnswers = {};
  for (const [id, answer] of Object.entries(raw as Record<string, unknown>)) {
    const q = BY_ID.get(id);
    if (!q) return { ok: false, field: id, reason: { en: `There is no question ${id}.`, el: `Δεν υπάρχει ερώτηση ${id}.` } };
    if (answer === null || answer === '') {
      value[id] = '';
      continue;
    }
    if (typeof answer !== 'string' || !q.options.some((o) => o.value === answer)) {
      return {
        ok: false,
        field: id,
        reason: {
          en: `${q.question.en}: choose one of ${q.options.map((o) => o.value).join(', ')}.`,
          el: `${q.question.el}: επιλέξτε ένα από ${q.options.map((o) => o.value).join(', ')}.`,
        },
      };
    }
    value[id] = answer;
  }
  return { ok: true, value };
}

/** Merges a partial save into stored answers; an empty string clears a question. */
export function mergeCompatAnswers(stored: CompatAnswers | null | undefined, patch: CompatAnswers): CompatAnswers {
  const out: CompatAnswers = { ...(stored ?? {}) };
  for (const [id, answer] of Object.entries(patch)) {
    if (answer) out[id] = answer;
    else delete out[id];
  }
  return out;
}

/** Stored answers read defensively: unknown questions and options are dropped. */
export function cleanCompatAnswers(stored: unknown): CompatAnswers {
  const out: CompatAnswers = {};
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return out;
  for (const [id, answer] of Object.entries(stored as Record<string, unknown>)) {
    const q = BY_ID.get(id);
    if (q && typeof answer === 'string' && q.options.some((o) => o.value === answer)) out[id] = answer;
  }
  return out;
}

export function answeredCount(answers: CompatAnswers | null | undefined): number {
  return Object.keys(cleanCompatAnswers(answers)).length;
}

function verdictFor(q: CompatQuestion, a: string, b: string): CompatVerdict {
  if (a === b) {
    // On a complement question the same answer is the gap: two ideas need
    // one chosen, two joiners have none to join. Both "either" is fine.
    return q.kind === 'complement' && a !== q.flexible ? 'talk' : 'agree';
  }
  if (q.flexible && (a === q.flexible || b === q.flexible)) return 'close';
  if (q.kind === 'complement') {
    return q.fits?.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) ? 'agree' : 'talk';
  }
  if (q.kind === 'ordinal') {
    const ia = q.options.findIndex((o) => o.value === a);
    const ib = q.options.findIndex((o) => o.value === b);
    return Math.abs(ia - ib) === 1 ? 'close' : 'talk';
  }
  return 'talk';
}

/**
 * Per question both answered: agree, close or talk first. Never returns
 * either person's answer, so it is safe to send to the other one.
 */
export function compareCompatAnswers(mine: unknown, theirs: unknown): CompatComparison {
  const a = cleanCompatAnswers(mine);
  const b = cleanCompatAnswers(theirs);
  const items: CompatItem[] = [];
  for (const q of COMPAT_QUESTIONS) {
    if (!a[q.id] || !b[q.id]) continue;
    const verdict = verdictFor(q, a[q.id], b[q.id]);
    items.push({ id: q.id, question: q.question, verdict, ...(verdict === 'agree' ? {} : { talk: q.talk }) });
  }
  const count = (v: CompatVerdict) => items.filter((i) => i.verdict === v).length;
  const agree = count('agree');
  const close = count('close');
  const talk = count('talk');
  const shared = items.length;
  return {
    shared,
    total: COMPAT_QUESTIONS.length,
    // Talk-first items lead: they are what the first conversation is for.
    items: [...items].sort((x, y) => order(x.verdict) - order(y.verdict)),
    agree,
    close,
    talk,
    share: shared >= COMPAT_MIN_SHARED ? (agree + close * 0.5) / shared : null,
  };
}

function order(v: CompatVerdict): number {
  return v === 'talk' ? 0 : v === 'close' ? 1 : 2;
}
