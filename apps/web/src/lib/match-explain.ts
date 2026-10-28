import { COMMITMENT_LEVELS, STARTUP_STAGES } from '@/lib/founder-options';
import { placeEl } from '@/lib/i18n/places';
import { termDisplay } from '@/lib/i18n/terms';
import { translate } from '@/lib/i18n/translate';
import { matchReasonCopy } from '@/lib/match-reason';
import { roleFamily, type RoleFamily } from '@/lib/role-family';

/**
 * Why two members match, in sentences that carry the facts.
 *
 * The engine's reasons are labels. «Συμπληρωματικές δεξιότητες» on a card
 * says there is something, not what; and some were false: "Skills overlap"
 * was written for two people who share no skill, because the engine counts
 * two empty skill lists as a full overlap. Where the page has both profiles,
 * each reason is worked out again from them and names its facts: which
 * skills, which city, which stage. Where it cannot (the reader's profile has
 * not loaded, or the hit does not carry the field), the engine's own word
 * stays, translated (`matchReasonCopy`).
 *
 * The score is not touched: this explains the number the engine gave, it
 * does not compute another one.
 *
 * Pure: the same two profiles and the same clock give the same reasons, in
 * the same order.
 */

export type ReasonCode =
  /** Their role is one the reader said they look for. */
  | 'covers'
  /** An investor's rounds meet a founder's stage. */
  | 'investor_stage'
  /** Skills they list that the reader does not. */
  | 'complement'
  /** Skills both list. */
  | 'shared'
  /** The same or a neighbouring company stage. */
  | 'stage'
  /** The same time commitment. */
  | 'commitment'
  /** The same city or country. */
  | 'place'
  /** What their role is to the reader's role. */
  | 'role'
  /** They said they are open to something (the engine knows; the hit does not). */
  | 'open_to'
  /** Recently active, or a recently updated profile. */
  | 'activity'
  /** An engine reason the page cannot work out again. */
  | 'engine'
  /** Nothing to compare yet. */
  | 'thin';

export type ExplainedReason = { code: ReasonCode; en: string; el: string; weight: number };

/** The reader's side of the comparison, read once from their own profile. */
export type ViewerFacts = {
  role: RoleFamily | null;
  skills: string[];
  location: string | null;
  /** Company stage, as profile edit saves it: idea, mvp, traction, scaling. */
  stage: string | null;
  /** Time commitment: full-time, part-time, weekends, flexible. */
  commitment: string | null;
  /** Only what the reader said they look for; never a default. */
  wants: LookingForKind[];
  /** The rounds an investor reader invests in. */
  rounds: string[];
};

/** The candidate's side: the fields a recommendation hit carries. */
export type MatchCandidate = {
  role?: string | null;
  skillNames?: string[] | null;
  location?: string | null;
  matchReasons?: string[] | null;
  /** Their availability, or a founder's time commitment. */
  availability?: string | null;
  /** A founder's company stage; undefined when the hit does not carry it. */
  stage?: string | null;
  /** An investor's rounds; undefined when the hit does not carry them. */
  investmentStages?: string[] | null;
  /** Last activity, epoch seconds; undefined when the hit does not carry it. */
  lastSeenAt?: number | null;
  /** When their profile last changed; undefined when the hit does not carry it. */
  profileUpdatedAt?: string | null;
};

export type ExplainOptions = {
  /** Now, for "this week"; a parameter so the result never depends on when a test runs. */
  nowMs: number;
  /** Greek for a skill or a sector. Defaults to the catalogs the DOM pass uses. */
  termEl?: (term: string) => string;
};

/** What a reader can say they look for, in the words that name a role. */
export type LookingForKind = 'cofounder' | 'mentor' | 'advisor' | 'investor';

/*
 * Only these words count. Profile edit also offers team roles (CTO,
 * Designer, Marketing, Sales, Operations); the engine reads them as "someone
 * to build the company with", but a card that said «Ταιριάζει με την
 * αναζήτησή σας: CTO» about a founder whose skills nobody checked would claim
 * more than the data says. Those readers get the role sentence instead.
 */
const LOOKING_FOR_WORDS: Record<string, LookingForKind> = {
  cofounder: 'cofounder',
  'co-founder': 'cofounder',
  'co founder': 'cofounder',
  mentor: 'mentor',
  advisor: 'advisor',
  investor: 'investor',
  angel: 'investor',
};

const LOOKING_FOR_LABEL: Record<LookingForKind, { en: string; el: string; family: RoleFamily }> = {
  cofounder: { en: 'a co-founder', el: 'συνιδρυτής', family: 'founder' },
  mentor: { en: 'a mentor', el: 'μέντορας', family: 'mentor' },
  advisor: { en: 'an advisor', el: 'σύμβουλος', family: 'mentor' },
  investor: { en: 'an investor', el: 'επενδυτής', family: 'investor' },
};

/** Profile edit's rounds (`investmentStageOptions`), in both languages. */
const ROUND_LABEL: Record<string, { en: string; el: string }> = {
  'pre-seed': { en: 'pre-seed', el: 'προ-seed' },
  seed: { en: 'seed', el: 'seed' },
  'series-a': { en: 'Series A', el: 'Σειρά A' },
  'series-b': { en: 'Series B+', el: 'Σειρά B+' },
};

/*
 * The round a company usually raises at each stage. The reason names both
 * facts (their rounds, your stage); this table only decides whether they
 * meet.
 */
const ROUNDS_FOR_STAGE: Record<string, string[]> = {
  idea: ['pre-seed'],
  mvp: ['pre-seed', 'seed'],
  traction: ['seed', 'series-a'],
  scaling: ['series-a', 'series-b'],
};

const STAGE_ORDER = STARTUP_STAGES.map((s) => s.value);

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function texts(value: unknown): string[] {
  if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean);
  return Array.isArray(value) ? value.map(text).filter((x): x is string => x !== null) : [];
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** The stage spellings profile edit accepts (`normalizeFounderStage`). */
export function normalizeStage(raw: string | null | undefined): string | null {
  const s = text(raw)?.toLowerCase();
  if (!s) return null;
  if (s === 'early traction' || s === 'early') return 'traction';
  if (s === 'scale' || s === 'growth') return 'scaling';
  return STAGE_ORDER.includes(s) ? s : null;
}

/** The commitment spellings profile edit accepts (`normalizeCommitment`). */
export function normalizeCommitment(raw: string | null | undefined): string | null {
  const s = text(raw)?.toLowerCase();
  if (!s) return null;
  if (s === 'full time') return 'full-time';
  if (s === 'part time') return 'part-time';
  if (s === 'weekends only') return 'weekends';
  return COMMITMENT_LEVELS.some((c) => c.value === s) ? s : null;
}

/** The round spellings profile edit accepts (`normalizeInvestmentStage`). */
export function normalizeRound(raw: string | null | undefined): string | null {
  const s = text(raw)?.toLowerCase();
  if (!s) return null;
  if (s === 'pre seed') return 'pre-seed';
  if (s === 'series a') return 'series-a';
  if (s === 'series b' || s === 'series b+' || s === 'series-b+') return 'series-b';
  return ROUND_LABEL[s] ? s : null;
}

/** The reader's facts from their own profile (`GET /api/me/profile`), or null before it loads. */
export function viewerFacts(
  profile:
    | {
        role?: string | null;
        location?: string | null;
        skills?: ReadonlyArray<{ skillName?: string | null }> | null;
        rolePayload?: Record<string, unknown> | null;
      }
    | null
    | undefined,
): ViewerFacts | null {
  if (!profile) return null;
  const payload = profile.rolePayload ?? {};
  // Profile edit saves "Looking for" as `rolesSought`; older payloads and
  // the sample profile say `lookingFor`.
  const said = texts(payload.rolesSought).length ? texts(payload.rolesSought) : texts(payload.lookingFor);
  const wants = [...new Set(said.map((w) => LOOKING_FOR_WORDS[w.toLowerCase()]).filter((k): k is LookingForKind => Boolean(k)))];
  return {
    role: roleFamily(profile.role),
    skills: (profile.skills ?? []).map((s) => text(s?.skillName)).filter((s): s is string => s !== null),
    location: text(profile.location),
    stage: normalizeStage(text(payload.stage)),
    commitment: normalizeCommitment(text(payload.commitment)),
    wants,
    rounds: [...new Set(texts(payload.stages).map(normalizeRound).filter((r): r is string => r !== null))],
  };
}

function defaultTermEl(term: string): string {
  return translate('el', term);
}

function list(items: string[], max = 3): { shown: string[]; more: number } {
  return { shown: items.slice(0, max), more: Math.max(0, items.length - max) };
}

function termsPair(items: string[], termEl: (t: string) => string): { en: string; el: string } {
  const { shown, more } = list(items);
  const tail = more > 0 ? ` +${more}` : '';
  return {
    en: shown.map(termDisplay).join(', ') + tail,
    el: shown.map((t) => termEl(termDisplay(t))).join(', ') + tail,
  };
}

function joinPair(items: Array<{ en: string; el: string }>): { en: string; el: string } {
  if (items.length <= 1) return items[0] ?? { en: '', el: '' };
  const head = items.slice(0, -1);
  const last = items[items.length - 1];
  return {
    en: `${head.map((i) => i.en).join(', ')} and ${last.en}`,
    el: `${head.map((i) => i.el).join(', ')} και ${last.el}`,
  };
}

function stageLabel(stage: string): { en: string; el: string } {
  const option = STARTUP_STAGES.find((s) => s.value === stage);
  return option ? { en: option.label, el: option.labelEl } : { en: stage, el: stage };
}

/** A stage name inside a sentence: "at idea stage" (MVP stays MVP), «στο στάδιο «Ιδέα»». */
function stageInSentence(stage: string): { en: string; el: string } {
  const label = stageLabel(stage);
  return { en: /^[A-Z0-9]{2,}$/.test(label.en) ? label.en : label.en.toLowerCase(), el: `«${label.el}»` };
}

function commitmentLabel(value: string): { en: string; el: string } {
  const option = COMMITMENT_LEVELS.find((c) => c.value === value);
  return option ? { en: option.label.toLowerCase(), el: option.labelEl.toLowerCase() } : { en: value, el: value };
}

type Place = { city: string | null; country: string };

function placeOf(location: string | null | undefined): Place | null {
  const parts = (location ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length || fold(parts[0]) === 'remote') return null;
  return parts.length >= 2 ? { city: parts[0], country: parts[parts.length - 1] } : { city: null, country: parts[0] };
}

/** Same city, else same country, else nothing. A lone place matches either side of the other. */
function samePlace(a: Place, b: Place): { kind: 'city' | 'country' | 'place'; name: string } | null {
  if (a.city && b.city && fold(a.city) === fold(b.city)) return { kind: 'city', name: b.city };
  if (!a.city && !b.city && fold(a.country) === fold(b.country)) return { kind: 'place', name: b.country };
  if (!a.city && b.city && fold(a.country) === fold(b.city)) return { kind: 'city', name: b.city };
  if (a.city && !b.city && fold(a.city) === fold(b.country)) return { kind: 'city', name: b.country };
  if (fold(a.country) === fold(b.country)) return { kind: 'country', name: b.country };
  return null;
}

/* What each engine reason is about, so a reason the page has worked out
   from the profiles replaces the engine's label for the same thing. */
type Topic = 'role' | 'skills' | 'stage' | 'commitment' | 'place' | 'activity' | 'fallback' | 'open_to' | 'other';

const ENGINE_TOPIC: Record<string, Topic> = {
  'Cofounder match': 'role',
  'Mentor match': 'role',
  'Investor match': 'role',
  'Founder match': 'role',
  'Complementary roles': 'role',
  'Skills overlap': 'skills',
  'Complementary skills': 'skills',
  'Matching skills & expertise': 'skills',
  'Same stage': 'stage',
  'Similar stage': 'stage',
  'Stage fit': 'stage',
  'Same commitment': 'commitment',
  'Compatible commitment': 'commitment',
  'Same or nearby location': 'place',
  'Same region or open to remote': 'place',
  'Active recently': 'activity',
  'Active this week': 'activity',
  'Highly active on platform': 'activity',
  'Profile match': 'fallback',
};

function topicOf(reason: string): Topic {
  if (/^open to /i.test(reason.trim())) return 'open_to';
  return ENGINE_TOPIC[reason] ?? 'other';
}

const TOPIC_CODE: Record<Topic, ReasonCode> = {
  role: 'role',
  skills: 'shared',
  stage: 'stage',
  commitment: 'commitment',
  place: 'place',
  activity: 'activity',
  fallback: 'thin',
  open_to: 'open_to',
  other: 'engine',
};

const TOPIC_WEIGHT: Record<Topic, number> = {
  role: 40,
  skills: 70,
  stage: 60,
  commitment: 55,
  place: 45,
  activity: 15,
  fallback: 0,
  open_to: 50,
  other: 30,
};

function byWeight(reasons: ExplainedReason[]): ExplainedReason[] {
  return reasons
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (b.r.weight !== a.r.weight ? b.r.weight - a.r.weight : a.i - b.i))
    .map(({ r }) => r);
}

/** The engine's reasons alone, translated: what the page shows before the reader's profile loads. */
function engineOnly(reasons: readonly string[]): ExplainedReason[] {
  const seen = new Set<string>();
  const out: ExplainedReason[] = [];
  for (const reason of reasons) {
    const copy = matchReasonCopy(reason);
    if (seen.has(copy.en)) continue;
    seen.add(copy.en);
    const topic = topicOf(reason);
    out.push({ code: TOPIC_CODE[topic], en: copy.en, el: copy.el, weight: TOPIC_WEIGHT[topic] });
  }
  // The fallback says there is little in common; it stands only alone.
  const real = out.filter((r) => r.code !== 'thin');
  return byWeight(real.length ? real : out);
}

const DAY_MS = 86_400_000;

/**
 * The reasons for one candidate, most telling first. Without the reader's
 * facts, the engine's reasons, translated.
 */
export function explainMatch(candidate: MatchCandidate, viewer: ViewerFacts | null, options: ExplainOptions): ExplainedReason[] {
  const engine = (candidate.matchReasons ?? []).filter((r) => typeof r === 'string' && r.trim());
  if (!viewer) return engineOnly(engine);

  const termEl = options.termEl ?? defaultTermEl;
  const out: ExplainedReason[] = [];
  const family = roleFamily(candidate.role);
  const worked = new Set<Topic>(['role', 'fallback']);

  // ── What they are, against what the reader said they look for ──
  const covered = viewer.wants.filter((kind) => family !== null && LOOKING_FOR_LABEL[kind].family === family);
  if (covered.length) {
    const what = joinPair(covered.map((kind) => LOOKING_FOR_LABEL[kind]));
    out.push({
      code: 'covers',
      en: `Fits what you are looking for: ${what.en}`,
      el: `Ταιριάζει με την αναζήτησή σας: ${what.el}`,
      weight: 100,
    });
  }

  // ── Investors and founders: rounds against stage ──
  const theirRounds = candidate.investmentStages === undefined
    ? undefined
    : [...new Set((candidate.investmentStages ?? []).map(normalizeRound).filter((r): r is string => r !== null))];
  const theirStage = candidate.stage === undefined ? undefined : normalizeStage(candidate.stage);
  let roundsSaid = false;
  if (family === 'investor' && theirRounds !== undefined) {
    worked.add('stage');
    if (theirRounds.length) {
      const fit = viewer.role === 'founder' && viewer.stage ? theirRounds.filter((r) => ROUNDS_FOR_STAGE[viewer.stage!]?.includes(r)) : [];
      if (fit.length) {
        const rounds = joinPair(fit.map((r) => ROUND_LABEL[r]));
        const stage = stageInSentence(viewer.stage!);
        out.push({
          code: 'investor_stage',
          en: `Invests at ${rounds.en}: fits your ${stage.en} stage`,
          el: `Επενδύει σε ${rounds.el}: ταιριάζει στο στάδιό σας, ${stage.el}`,
          weight: 90,
        });
      } else {
        const rounds = joinPair(theirRounds.map((r) => ROUND_LABEL[r]));
        out.push({ code: 'investor_stage', en: `Invests at ${rounds.en}`, el: `Επενδύει σε ${rounds.el}`, weight: 50 });
      }
      roundsSaid = true;
    }
  }
  if (viewer.role === 'investor' && family === 'founder' && theirStage && viewer.rounds.length) {
    const fit = viewer.rounds.filter((r) => ROUNDS_FOR_STAGE[theirStage]?.includes(r));
    if (fit.length) {
      const stage = stageInSentence(theirStage);
      const rounds = joinPair(fit.map((r) => ROUND_LABEL[r]));
      out.push({
        code: 'investor_stage',
        en: `At ${stage.en} stage: fits your ${rounds.en} investing`,
        el: `Στάδιο ${stage.el}: ταιριάζει στις επενδύσεις σας σε ${rounds.el}`,
        weight: 90,
      });
      roundsSaid = true;
    }
  }

  // ── Skills: what they add, what you share ──
  if (Array.isArray(candidate.skillNames)) {
    worked.add('skills');
    const mine = new Set(viewer.skills.map(fold));
    const theirs = [...new Map(candidate.skillNames.filter((s) => typeof s === 'string' && s.trim()).map((s) => [fold(s), s.trim()])).values()];
    const shared = theirs.filter((s) => mine.has(fold(s)));
    const added = theirs.filter((s) => !mine.has(fold(s)));
    // "Complements your skills" means nothing to a reader who lists none.
    if (viewer.skills.length && added.length) {
      const terms = termsPair(added, termEl);
      out.push({
        code: 'complement',
        en: `Complements your skills: ${terms.en}`,
        el: `Συμπληρώνει τις δεξιότητές σας: ${terms.el}`,
        weight: 80,
      });
    }
    if (shared.length) {
      const terms = termsPair(shared, termEl);
      out.push({ code: 'shared', en: `Shared skills: ${terms.en}`, el: `Κοινές δεξιότητες: ${terms.el}`, weight: 70 });
    }
  }

  // ── Company stage, founder to founder ──
  if (theirStage !== undefined && family !== 'investor') {
    worked.add('stage');
    if (viewer.role === 'founder' && family === 'founder' && viewer.stage && theirStage) {
      const gap = Math.abs(STAGE_ORDER.indexOf(viewer.stage) - STAGE_ORDER.indexOf(theirStage));
      if (gap === 0) {
        const stage = stageLabel(theirStage);
        out.push({ code: 'stage', en: `Same stage: ${stage.en}`, el: `Ίδιο στάδιο: ${stage.el}`, weight: 60 });
      } else if (gap === 1) {
        const both = joinPair([stageLabel(viewer.stage), stageLabel(theirStage)]);
        out.push({ code: 'stage', en: `Close stages: ${both.en}`, el: `Κοντινά στάδια: ${both.el}`, weight: 45 });
      }
    }
  }

  // ── Time commitment ──
  if (candidate.availability !== undefined) {
    worked.add('commitment');
    const theirs = normalizeCommitment(candidate.availability);
    if (viewer.commitment && theirs && viewer.commitment === theirs) {
      const label = commitmentLabel(theirs);
      out.push({
        code: 'commitment',
        en: `Same time commitment: ${label.en}`,
        el: `Ίδια δέσμευση χρόνου: ${label.el}`,
        weight: 55,
      });
    }
  }

  // ── Place ──
  if (candidate.location !== undefined) {
    worked.add('place');
    const mine = placeOf(viewer.location);
    const theirs = placeOf(candidate.location);
    const same = mine && theirs ? samePlace(mine, theirs) : null;
    if (same) {
      const el = placeEl(same.name);
      if (same.kind === 'city') out.push({ code: 'place', en: `Same city: ${same.name}`, el: `Ίδια πόλη: ${el}`, weight: 50 });
      else if (same.kind === 'country') out.push({ code: 'place', en: `Same country: ${same.name}`, el: `Ίδια χώρα: ${el}`, weight: 35 });
      else out.push({ code: 'place', en: `Same place: ${same.name}`, el: `Ίδια τοποθεσία: ${el}`, weight: 45 });
    }
  }

  // ── Activity ──
  if (candidate.lastSeenAt !== undefined || candidate.profileUpdatedAt !== undefined) {
    worked.add('activity');
    const seenMs = typeof candidate.lastSeenAt === 'number' ? candidate.lastSeenAt * 1000 : null;
    const updatedMs = candidate.profileUpdatedAt ? Date.parse(candidate.profileUpdatedAt) : NaN;
    if (seenMs !== null && options.nowMs - seenMs <= DAY_MS) {
      out.push({ code: 'activity', en: 'Active today', el: 'Ενεργό μέλος σήμερα', weight: 20 });
    } else if (seenMs !== null && options.nowMs - seenMs <= 7 * DAY_MS) {
      out.push({ code: 'activity', en: 'Active this week', el: 'Ενεργό μέλος αυτή την εβδομάδα', weight: 20 });
    } else if (Number.isFinite(updatedMs) && options.nowMs - updatedMs <= 7 * DAY_MS) {
      out.push({ code: 'activity', en: 'Profile updated this week', el: 'Προφίλ ενημερωμένο αυτή την εβδομάδα', weight: 15 });
    }
  }

  // ── What their role is to yours, when nothing above said it ──
  // An investor reason already says what the investor does, or which stage
  // the founder is at; the role sentence would only repeat it.
  if (!covered.length && family && !roundsSaid) {
    const role = roleSentence(viewer.role, family, theirStage ?? null);
    if (role) out.push({ code: 'role', ...role, weight: family === 'investor' ? 35 : 40 });
  }

  // ── The engine's reasons the page could not work out again ──
  const kept = new Set<string>();
  for (const reason of engine) {
    const topic = topicOf(reason);
    if (worked.has(topic)) continue;
    const copy = matchReasonCopy(reason);
    if (kept.has(copy.en)) continue;
    kept.add(copy.en);
    out.push({ code: TOPIC_CODE[topic], en: copy.en, el: copy.el, weight: TOPIC_WEIGHT[topic] });
  }

  if (!out.length) {
    return [{ code: 'thin', en: 'Few details to compare yet', el: 'Λίγα στοιχεία για σύγκριση ακόμη', weight: 0 }];
  }
  return byWeight(out);
}

function roleSentence(
  viewer: RoleFamily | null,
  candidate: RoleFamily,
  stage: string | null,
): { en: string; el: string } | null {
  const building = () => {
    if (!stage) return { en: 'Building a company', el: 'Χτίζει εταιρεία' };
    const s = stageInSentence(stage);
    return { en: `Building a company, at ${s.en} stage`, el: `Χτίζει εταιρεία, στο στάδιο ${s.el}` };
  };
  if (viewer === 'founder') {
    if (candidate === 'founder') return { en: 'Also building a company', el: 'Χτίζει επίσης εταιρεία' };
    if (candidate === 'mentor') return { en: 'Mentors founders', el: 'Καθοδηγεί ιδρυτές' };
    if (candidate === 'investor') return { en: 'Invests in startups', el: 'Επενδύει σε startups' };
    return null;
  }
  if (viewer === 'mentor' || viewer === 'investor' || viewer === 'org') {
    if (candidate === 'founder') return building();
    if (viewer === 'org' && candidate === 'mentor') return { en: 'Mentors founders', el: 'Καθοδηγεί ιδρυτές' };
  }
  return null;
}

/** The two reasons a card shows, and how many more its disclosure holds. */
export function splitReasons<T>(reasons: readonly T[], onFace = 2): { face: T[]; rest: T[] } {
  return { face: reasons.slice(0, onFace), rest: reasons.slice(onFace) };
}
