/**
 * The assistant's reply styles, as `/settings/ai` names them, for the cards
 * and replies that name one (docs §110). Same four values the API accepts
 * (`answer-preferences.ts`, docs §98).
 */
export const REPLY_STYLES = ['concise', 'detailed', 'casual', 'formal'] as const;
export type ReplyStyle = (typeof REPLY_STYLES)[number];

export const REPLY_STYLE_COPY: Record<ReplyStyle, { en: string; el: string }> = {
  concise: { en: 'Concise', el: 'Σύντομο' },
  detailed: { en: 'Detailed', el: 'Αναλυτικό' },
  casual: { en: 'Casual', el: 'Φιλικό' },
  formal: { en: 'Formal', el: 'Επίσημο' },
};

export const EMOJI_COPY = {
  on: { en: 'with emoji', el: 'με emoji' },
  off: { en: 'no emoji', el: 'χωρίς emoji' },
} as const;

export function isReplyStyle(value: unknown): value is ReplyStyle {
  return typeof value === 'string' && (REPLY_STYLES as readonly string[]).includes(value);
}

/** A boolean argument as a model or the planner sends it: true, "true", false, "false". */
export function readFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/** What a set_reply_style card changes, in the reader's language: «Σύντομο · χωρίς emoji». */
export function replyStyleTarget(args: Record<string, unknown>, locale?: string): string {
  const pick = (copy: { en: string; el: string }) => (locale === 'el' ? copy.el : copy.en);
  const parts: string[] = [];
  if (isReplyStyle(args.style)) parts.push(pick(REPLY_STYLE_COPY[args.style]));
  const emoji = readFlag(args.emoji);
  if (emoji !== undefined) parts.push(pick(emoji ? EMOJI_COPY.on : EMOJI_COPY.off));
  return parts.join(' · ');
}
