import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { asksAboutSamples, planCopilotTools } from './copilot-planner';
import { runCopilotTurn } from './copilot-engine';
import { WRITE_TOOLS } from './copilotEval.fixture';
import { PAGE_QUESTIONS } from './page-questions';

/**
 * The questions pages hand the assistant (lib/page-questions).
 *
 * Each was an English sentence in its page: a Greek reader pressing Ask sent
 * one, and the rule planner read several as something else - a tick of the
 * market readiness criterion for "which expert review ... go-to-market ...
 * readiness", a group join for "I have not joined any groups", and searches
 * for the words of the sentence. Here every question is held, in both
 * languages, to what it names: its capability with no other change beside
 * it, or, for "why is this sample data?", the engine's answer from the page.
 */

const GREEK = /[Ͱ-Ͽἀ-῿]/;

describe('the ready questions pages hand the assistant', () => {
  const entries = Object.entries(PAGE_QUESTIONS);

  it('has a Greek and an English sentence for each', () => {
    expect(entries.length).toBeGreaterThan(70);
    for (const [key, q] of entries) {
      expect(GREEK.test(q.el), `${key} el is Greek`).toBe(true);
      expect(GREEK.test(q.en), `${key} en has no Greek`).toBe(false);
    }
  });

  it('is read as what it names, in both languages, with no change proposed beside a question', () => {
    const misses: string[] = [];
    for (const [key, q] of entries) {
      for (const lang of ['en', 'el'] as const) {
        const text = q[lang];
        const planned = planCopilotTools(text).map((t) => t.name);
        if (q.answer === 'samples') {
          if (!asksAboutSamples(text)) misses.push(`${key} (${lang}): not heard as a question about samples`);
          continue;
        }
        if (asksAboutSamples(text)) misses.push(`${key} (${lang}): heard as a question about samples`);
        if (!planned.includes(q.tool)) misses.push(`${key} (${lang}): planned ${planned.join(', ') || 'nothing'}, not ${q.tool}`);
        const write = planned.find((name) => WRITE_TOOLS.has(name) && name !== q.tool);
        if (write) misses.push(`${key} (${lang}): proposed the change ${write}`);
        const search = planCopilotTools(text).find((t) => t.name === 'search_people');
        if (search?.args?.q && search.args.q.split(' ').length > 3) misses.push(`${key} (${lang}): searched for "${search.args.q}"`);
      }
    }
    expect(misses, misses.join('\n')).toEqual([]);
  });
});

describe('a question about sample data', () => {
  const context = {
    route: '/mentor/earnings',
    locale: 'el',
    lists: [{ id: 'tx', label: 'Συναλλαγές', shown: 3, rows: ['Συνεδρία · €80'], sample: true }],
  };

  it('is answered from the page, in the reader’s language, with nothing else read', async () => {
    const turn = await runCopilotTurn('Γιατί η σελίδα εσόδων δείχνει δείγματα συναλλαγών;', context);
    expect(turn.message).toContain('δείγμα δεδομένων');
    expect(turn.message).toContain('Δείγμα εδώ: Συναλλαγές.');
    expect(turn.message).toContain('Απόκρυψη δείγματος δεδομένων');
    expect(turn.usedTools).toEqual([]);
  });

  it('leaves a statement about samples followed by another question to that question', () => {
    expect(asksAboutSamples('These endorsements are samples. Who should I ask for an endorsement first?')).toBe(false);
    expect(asksAboutSamples('Why does the API keys page show sample keys?')).toBe(true);
    expect(asksAboutSamples('Is this data real or a sample?')).toBe(true);
  });
});

/** Every non-test .tsx under src/app and src/components. */
function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (name.endsWith('.tsx') && !name.includes('.test.')) out.push(path);
  }
  return out;
}

describe('pages ask through the registry and the asker', () => {
  const SRC = join(__dirname, '..');
  const files = [...sources(join(SRC, 'app')), ...sources(join(SRC, 'components'))];

  it('hands no English-only sentence to an Ask control', () => {
    const offenders: string[] = [];
    const patterns = [
      /\b(?:askAi|askAiPrompt|askPrompt)="/, // a literal question on a header, empty state or notice
      /<AskAi\w*\b[^>]*\bprompt="/, // a literal on an Ask button
      /\bask(?:InPlace|Assistant)?\(\s*['"`]/, // a literal sent straight to the assistant
      /\/ai\?q=\$\{encodeURIComponent\([^)]*\.en\)\}/, // an English half sent whatever the reader's language
    ];
    for (const file of files) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (patterns.some((re) => re.test(line))) offenders.push(`${relative(SRC, file)}:${i + 1}  ${line.trim().slice(0, 100)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('opens the assistant only through useAskAssistant', () => {
    // The home box sends its own scoped question and the command palette
    // what was typed; both are already in the reader's words.
    const allowed = new Set(['components/dashboard/HomeAskHero.tsx', 'components/common/CommandPalette.tsx']);
    const offenders = files
      .map((file) => relative(SRC, file).replace(/\\/g, '/'))
      .filter((rel) => !allowed.has(rel) && /popup\.ask\(/.test(readFileSync(join(SRC, rel), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
