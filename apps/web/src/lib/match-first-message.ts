/**
 * A first message to a match, drafted from the reasons the match page shows
 * (docs §108). Nothing here is invented: the reasons and the questions worth
 * settling early come from the same `getMatchVs` read the page renders, and
 * the text is placed in the composer, never sent — the reader edits it and
 * presses Send, or does not.
 *
 * Two reasons and one early topic keep it a message a person would write,
 * not a report; the match page has the full list.
 */

export type FirstMessageInput = {
  /** The other person's display name; the greeting uses the first word. */
  name: string;
  /** Why the two match, in the reader's language, best first. */
  reasons: string[];
  /** Working questions where the two answered differently, as questions. */
  topics: string[];
};

export type DraftTranslator = (key: string, vars?: Record<string, string | number>) => string;

/** The messages composer takes 2000 characters; a draft never asks for more. */
export const FIRST_MESSAGE_MAX = 2000;

/** A trailing full stop or middle dot goes; a question mark (`;` in Greek) stays. */
function trimDot(text: string): string {
  return text.trim().replace(/[.·]+$/u, '');
}

function endsSentence(text: string): boolean {
  return /[?!;.]$/u.test(text);
}

export function firstMessageDraft(input: FirstMessageInput, t: DraftTranslator, locale: string | undefined): string {
  const first = input.name.trim().split(/\s+/)[0] || input.name.trim();
  const sep = locale === 'el' ? ' · ' : '; ';
  const reasons = input.reasons.map(trimDot).filter(Boolean).slice(0, 2);
  const topic = input.topics.map(trimDot).filter(Boolean)[0];
  const lines = [t('Hi {name},', { name: first })];
  if (reasons.length) lines.push(t('I read why we match on CoFounderBay: {reasons}.', { reasons: reasons.join(sep) }));
  else lines.push(t('CoFounderBay put us side by side, and I would like to hear what you are building.'));
  if (topic) lines.push(t('One thing I would rather talk about early: {topic}', { topic }) + (endsSentence(topic) ? '' : '.'));
  lines.push(t('Would you be open to a short call this week?'));
  return lines.join('\n\n').slice(0, FIRST_MESSAGE_MAX);
}
