import type { CopilotToolName } from './copilot-types';

/**
 * Ready questions a page hands to the assistant from its own body (not the
 * empty state's starters, not a home's chips). Each names the capability it
 * asks for, and `homeAsk.test.ts` holds both languages to it, as it does the
 * homes' chips.
 */
export type PageQuestion = { en: string; el: string; tool: CopilotToolName };

/** /programs, after the list: which open programme fits. */
export const PROGRAMS_QUESTION: PageQuestion = {
  en: 'Which accelerator programmes are open right now, and which fit my stage and goals?',
  el: 'Ποια προγράμματα επιτάχυνσης δέχονται αιτήσεις τώρα, και ποια ταιριάζουν στο στάδιο και τους στόχους μου;',
  tool: 'get_programs',
};

export const PAGE_QUESTIONS: Record<string, PageQuestion> = {
  programs: PROGRAMS_QUESTION,
};
