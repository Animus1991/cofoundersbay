/**
 * What the assistant's composer offers as you type, as the AI Studio
 * prototype's does (and Copilot Chat's): "/" at the start lists commands and
 * the questions this page answers best; "@" before a word looks people up.
 *
 * Pure helpers, so the composer only renders and the rules are tested here.
 */

export type ComposerMode =
  | { mode: 'slash'; query: string }
  | { mode: 'mention'; query: string; start: number }
  | null;

/** Which menu the text calls for: "/" as its first character, or "@word" at the caret (the end). */
export function composerMode(input: string): ComposerMode {
  if (input.startsWith('/')) return { mode: 'slash', query: input.slice(1) };
  const m = /(^|\s)@([^\s@]*)$/.exec(input);
  if (m) return { mode: 'mention', query: m[2], start: m.index + m[1].length };
  return null;
}

/** Lower case without accents, so "/μεντ" finds "Μέντορες". */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export type ComposerCommand = { id: string; en: string; el: string };

/** The commands whose words (in either language) contain every word typed after the slash. */
export function filterCommands<T extends ComposerCommand>(items: T[], query: string): T[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const label = fold(`${item.en} ${item.el}`);
    return words.every((word) => label.includes(word));
  });
}

/** The text with "@query" replaced by the person's name and a space after it. */
export function insertMention(input: string, start: number, name: string): string {
  return `${input.slice(0, start)}${name} `;
}
