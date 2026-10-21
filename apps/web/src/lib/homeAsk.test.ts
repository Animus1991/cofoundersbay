import { describe, expect, it } from 'vitest';
import { planCopilotTools } from './copilot-planner';
import { WRITE_TOOLS } from './copilotEval.fixture';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { HOME_ASK, nowStartingPoints, type HomeAskAction } from './home-ask';

const APP = join(__dirname, '..', 'app');

/**
 * Every starting point a home offers is something the assistant does.
 *
 * The chips under each home's question box and the "Now" chips send a ready
 * question. Without a model the rule planner answers it, so a chip whose
 * question the planner reads as something else is a promise not kept: the
 * admin's "What is waiting for an admin" proposed a message (the letters
 * "dm" inside "admin"), the Greek "investor update" proposed one too (a bare
 * «γράψε»), and three chips searched people for the words of the sentence.
 * Each chip now names its capability, as the page starters do, and both
 * languages must plan it - and propose no change, unless the capability is
 * the change.
 */

function chips(actions: HomeAskAction[]): HomeAskAction[] {
  return actions.flatMap((action) => (action.items?.length ? action.items : [action]));
}

const all = [
  ...Object.entries(HOME_ASK).flatMap(([role, config]) => chips(config.actions).map((chip) => ({ where: `${role} ${chip.id}`, chip }))),
  ...nowStartingPoints({ messages: 2, intros: 1, notifications: 3 }).map((chip) => ({ where: `now ${chip.id}`, chip })),
  // The questions pages hand over from their own body are held to the same
  // rules in pageAsks.test.ts.
];

describe('the home chips', () => {
  it('either ask a question tied to a capability or open a page that exists', () => {
    for (const { where, chip } of all) {
      if (chip.href) {
        const path = chip.href.split('?')[0];
        expect(existsSync(join(APP, path, 'page.tsx')), `${where} opens ${chip.href}`).toBe(true);
        continue;
      }
      expect(chip.prompt, `${where} has a question`).toBeDefined();
      expect(chip.tool, `${where} names its capability`).toBeTruthy();
    }
  });

  it('are read as the capability they name, in both languages, with no change proposed beside a question', () => {
    const misses: string[] = [];
    for (const { where, chip } of all) {
      if (!chip.prompt || !chip.tool) continue;
      for (const lang of ['en', 'el'] as const) {
        const planned = planCopilotTools(chip.prompt[lang]).map((t) => t.name);
        if (!planned.includes(chip.tool)) misses.push(`${where} (${lang}): planned ${planned.join(', ') || 'nothing'}, not ${chip.tool}`);
        const write = planned.find((name) => WRITE_TOOLS.has(name) && name !== chip.tool);
        if (write) misses.push(`${where} (${lang}): proposed the change ${write}`);
      }
    }
    expect(misses, misses.join('\n')).toEqual([]);
  });

  it('search people with filters, not with the words of the sentence', () => {
    for (const { where, chip } of all) {
      if (chip.tool !== 'search_people' || !chip.prompt) continue;
      for (const lang of ['en', 'el'] as const) {
        const search = planCopilotTools(chip.prompt[lang]).find((t) => t.name === 'search_people');
        const words = (search?.args.q ?? '').split(/\s+/).filter(Boolean);
        expect(words.length, `${where} (${lang}) searched for «${search?.args.q}»`).toBeLessThanOrEqual(1);
      }
    }
  });
});
