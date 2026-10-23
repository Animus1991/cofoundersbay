import type { ChatMessage } from './ollama.service';

/**
 * The person's answer preferences, applied to every chat turn.
 *
 * /settings/ai saved a reply style (concise / detailed / casual / formal),
 * a reply language, emoji, creativity and length to `AIUserPreference`, and
 * nothing read them back: every answer came out the agent's default way
 * (docs §98). They now shape the system prompt and the generation options
 * of `/ai/chat` and `/ai/chat/stream`. A preference left unset changes
 * nothing.
 */

export type AnswerPreferences = {
  responseStyle?: string | null;
  responseLanguage?: string | null;
  useEmoji?: boolean | null;
  temperature?: number | null;
  maxTokens?: number | null;
};

export const RESPONSE_STYLE_INSTRUCTIONS: Record<string, string> = {
  concise: 'Answer briefly: a few sentences or a short list, with no preamble and no recap.',
  detailed: 'Answer in full: explain the reasoning, walk through the steps, and give an example where it helps.',
  casual: 'Use a friendly, conversational tone, as a colleague would.',
  formal: 'Use a professional, formal tone, as in business correspondence.',
};

/** The app's nine locales (apps/web/src/lib/locale.ts APP_LOCALES). */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', el: 'Greek', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
};

/** The lines added to the system prompt, in a fixed order; empty when nothing is set. */
export function preferenceLines(p: AnswerPreferences | null | undefined): string[] {
  if (!p) return [];
  const lines: string[] = [];
  const style = p.responseStyle ? RESPONSE_STYLE_INSTRUCTIONS[p.responseStyle] : undefined;
  if (style) lines.push(style);
  const language = p.responseLanguage ? LANGUAGE_NAMES[p.responseLanguage] : undefined;
  if (language) lines.push(`Reply in ${language} unless the person writes to you in another language.`);
  if (p.useEmoji === false) lines.push('Do not use emoji.');
  if (p.useEmoji === true) lines.push('An emoji is fine where it adds something.');
  return lines;
}

/** The turn's messages with the preferences added to its system message (or one added first). */
export function withAnswerPreferences(messages: ChatMessage[], p: AnswerPreferences | null | undefined): ChatMessage[] {
  const lines = preferenceLines(p);
  if (!lines.length) return messages;
  const block = `How this person wants answers (this takes precedence over any default length or tone above):\n${lines.map((l) => `- ${l}`).join('\n')}`;
  const i = messages.findIndex((m) => m.role === 'system');
  if (i === -1) return [{ role: 'system', content: block }, ...messages];
  return messages.map((m, k) => (k === i ? { ...m, content: `${m.content}\n\n${block}` } : m));
}

/**
 * Creativity and length: the person's, kept in bounds, where they set them;
 * otherwise the agent's. A "detailed" answer gets room to be detailed (the
 * general agent's 512 tokens cut it short).
 */
export function generationFor(
  agent: { temperature?: number; maxTokens?: number },
  p: AnswerPreferences | null | undefined,
): { temperature?: number; maxTokens?: number } {
  const temperature = typeof p?.temperature === 'number' && Number.isFinite(p.temperature)
    ? Math.min(1.2, Math.max(0, p.temperature))
    : agent.temperature;
  let maxTokens = typeof p?.maxTokens === 'number' && Number.isFinite(p.maxTokens)
    ? Math.min(8192, Math.max(128, Math.round(p.maxTokens)))
    : agent.maxTokens;
  if (p?.responseStyle === 'detailed') maxTokens = Math.max(maxTokens ?? 0, 1024);
  return { temperature, maxTokens };
}
