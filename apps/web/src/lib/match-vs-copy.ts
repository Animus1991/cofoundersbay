import { COMPAT_COPY, COMPAT_MIN_SHARED, type CompatComparison } from '@cofounderbay/shared';
import { COMMITMENT_LEVELS, STARTUP_STAGES } from '@/lib/founder-options';
import { placeEl } from '@/lib/i18n/places';
import { matchAxisEl } from '@/lib/i18n/strings-matches';
import { termDisplay } from '@/lib/i18n/terms';
import { translate } from '@/lib/i18n/translate';

/**
 * The compatibility dialog's words, from what `GET /api/recommendations/vs/:id`
 * answers.
 *
 * The endpoint names its axes, its shared strengths and its points worth
 * discussing in English ("Location Difference: Athens vs Berlin. Remote
 * coordination may require…"), and the dialog printed them as they came, on
 * a Greek page. Each is read here by what it is about (the axis `key`, the
 * friction's `key`, or the icon an older answer carries) and said in both
 * languages, with the facts it names.
 */

export type Pair = { en: string; el: string };

const AXIS: Record<string, Pair> = {
  role: { en: 'Roles', el: 'Ρόλοι' },
  skills: { en: 'Skills', el: 'Δεξιότητες' },
  semantic: { en: 'Goals', el: 'Στόχοι' },
  // The engine's industry axis also scores how close the two stages are.
  industry: { en: 'Industry & stage', el: 'Κλάδος & στάδιο' },
  location: { en: 'Location', el: 'Τοποθεσία' },
  behavioral: { en: 'Activity', el: 'Δραστηριότητα' },
  stage: { en: 'Stage', el: 'Στάδιο' },
  values: { en: 'Values', el: 'Αξίες' },
};

/** A short name for an axis, by its key; an unknown axis keeps its label. */
export function axisCopy(key: string | null | undefined, label: string): Pair {
  return (key && AXIS[key]) || { en: label, el: matchAxisEl(label) ?? label };
}

/**
 * How much the comparison stands on, in words. The engine's "confidence"
 * (50 to 95) counts how filled-in the two profiles are, not how sure it is
 * that the match is good, and "96% βεβαιότητα" under a score read as a second
 * score.
 */
export function completenessCopy(confidence: number | null | undefined): Pair | null {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return null;
  if (confidence >= 80) return { en: 'Based on detailed profiles', el: 'Με βάση αναλυτικά προφίλ' };
  if (confidence >= 65) return { en: 'Based on partly filled profiles', el: 'Με βάση μερικώς συμπληρωμένα προφίλ' };
  return { en: 'Based on few profile details', el: 'Με βάση λίγα στοιχεία προφίλ' };
}

export type FrictionKey = 'location' | 'stage' | 'tech_overlap' | 'commitment';

/** An answer from before frictions carried a key names its topic by icon. */
const KEY_BY_ICON: Record<string, FrictionKey> = {
  schedule: 'location',
  trending_up: 'stage',
  warning_amber: 'tech_overlap',
  hourglass_empty: 'commitment',
};

function stageWord(value: string): Pair {
  const option = STARTUP_STAGES.find((s) => s.value === value.toLowerCase());
  return option ? { en: option.label, el: option.labelEl } : { en: value, el: value };
}

function commitmentWord(value: string): Pair {
  const s = value.toLowerCase().replace(' ', '-');
  const option = COMMITMENT_LEVELS.find((c) => c.value === s);
  return option ? { en: option.label.toLowerCase(), el: option.labelEl.toLowerCase() } : { en: value, el: value };
}

function both(values: { mine?: unknown; theirs?: unknown } | undefined, word: (v: string) => Pair): Pair | null {
  const mine = typeof values?.mine === 'string' && values.mine.trim() ? values.mine.trim() : null;
  const theirs = typeof values?.theirs === 'string' && values.theirs.trim() ? values.theirs.trim() : null;
  if (!mine || !theirs) return null;
  const a = word(theirs);
  const b = word(mine);
  return { en: `${a.en} and ${b.en}`, el: `${a.el} και ${b.el}` };
}

/**
 * One point worth discussing, in both languages: what differs, then what to
 * agree on. A friction this table does not know keeps the engine's words in
 * both places rather than disappearing.
 */
export function frictionCopy(item: unknown): Pair | null {
  if (typeof item === 'string') return item.trim() ? { en: item, el: item } : null;
  if (!item || typeof item !== 'object') return null;
  const o = item as { key?: unknown; icon?: unknown; title?: unknown; description?: unknown; values?: { mine?: unknown; theirs?: unknown } };
  const key = (typeof o.key === 'string' ? o.key : typeof o.icon === 'string' ? KEY_BY_ICON[o.icon] : undefined) as FrictionKey | undefined;
  if (key === 'location') {
    const places = both(o.values, (v) => ({ en: v, el: placeEl(v) }));
    return {
      en: `${places ? `Different places: ${places.en}.` : 'Different places.'} Agree early on how you will work across the distance.`,
      el: `${places ? `Διαφορετικές τοποθεσίες: ${places.el}.` : 'Διαφορετικές τοποθεσίες.'} Συμφωνήστε νωρίς πώς θα συνεργάζεστε από απόσταση.`,
    };
  }
  if (key === 'stage') {
    const stages = both(o.values, stageWord);
    return {
      en: `${stages ? `Different stages: ${stages.en}.` : 'Different stages.'} Agree early on which milestones come first.`,
      el: `${stages ? `Διαφορετικά στάδια: ${stages.el}.` : 'Διαφορετικά στάδια.'} Συμφωνήστε νωρίς ποια ορόσημα προηγούνται.`,
    };
  }
  if (key === 'commitment') {
    const commitments = both(o.values, commitmentWord);
    return {
      en: `${commitments ? `Different time commitment: ${commitments.en}.` : 'Different time commitment.'} Agree on hours and milestones.`,
      el: `${commitments ? `Διαφορετική δέσμευση χρόνου: ${commitments.el}.` : 'Διαφορετική δέσμευση χρόνου.'} Συμφωνήστε σε ώρες και ορόσημα.`,
    };
  }
  if (key === 'tech_overlap') {
    return {
      en: 'You both lean technical. Decide early who covers sales, business and growth.',
      el: 'Έχετε και οι δύο τεχνικό προφίλ. Αποφασίστε νωρίς πώς θα καλυφθούν οι πωλήσεις, η επιχειρηματική πλευρά και η ανάπτυξη.',
    };
  }
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const description = typeof o.description === 'string' ? o.description.trim() : '';
  const words = title && description ? `${title}: ${description}` : title || description;
  return words ? { en: words, el: words } : null;
}

/**
 * The shared strengths as terms, without the ones a reason already names
 * ("Κοινές δεξιότητες: Προϊόν, Ανάπτυξη" above them): one fact, one place.
 */
export function strengthTerms(
  items: readonly unknown[] | null | undefined,
  alreadySaid: readonly string[] = [],
  termEl: (term: string) => string = (t) => translate('el', t),
): Pair[] {
  const said = new Set(alreadySaid.map((t) => t.trim().toLowerCase()));
  const out: Pair[] = [];
  const seen = new Set<string>();
  for (const item of items ?? []) {
    const raw = typeof item === 'string' ? item : item && typeof item === 'object' && typeof (item as { label?: unknown }).label === 'string' ? (item as { label: string }).label : '';
    const term = termDisplay(raw.trim());
    const folded = term.toLowerCase();
    if (!term || said.has(folded) || seen.has(folded)) continue;
    seen.add(folded);
    out.push({ en: term, el: termEl(term) });
  }
  return out;
}

/** The working-style questions, in one line: where you agree, or that there is not enough yet. */
export function compatSummary(comparison: CompatComparison | null | undefined): { text: Pair; enough: boolean } {
  if (!comparison || comparison.shared < COMPAT_MIN_SHARED) return { text: COMPAT_COPY.fewShared, enough: false };
  const { shared, total, agree, close, talk } = comparison;
  return {
    enough: true,
    text: {
      en: `How you work: you both answered ${shared} of ${total} questions; ${agree} agree, ${close} close, ${talk} to talk about first.`,
      el: `Τρόπος συνεργασίας: απαντήσατε και οι δύο ${shared} από ${total} ερωτήσεις· ${agree} συμφωνίες, ${close} κοντά, ${talk} για συζήτηση πρώτα.`,
    },
  };
}
