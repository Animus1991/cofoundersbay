import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planCopilotTools } from './copilot-planner';
import {
  COPILOT_PRODUCT_LINKS,
  COPILOT_STARTERS,
  copilotStartersFor,
} from './copilot-starters';

const EMPTY_STATE_SOURCE = readFileSync(
  join(__dirname, '..', 'components', 'ai', 'CopilotEmptyState.tsx'),
  'utf8',
);
const WORKSPACE_SOURCE = readFileSync(
  join(__dirname, '..', 'components', 'ai', 'CopilotWorkspace.tsx'),
  'utf8',
);

const STALE = /Sequoia|Sarah Chen|Horizon Capital|Klaus Weber|Emma Williams|TechCrunch|Product Hunt|San Francisco|\$3M|1,000\+|\$5K|\$50K MRR|\$3M ARR/;

describe('copilot empty-state lockstep', () => {
  it('keeps Harbor reads as two groups without invented traction', () => {
    const { reads, writes } = copilotStartersFor('page');
    expect(reads.map((row) => row.en)).toEqual([
      'What should I do next?',
      'Show my best matches',
      'Find a technical cofounder in Athens',
      'How is my fundraising going?',
    ]);
    expect(writes.map((row) => row.en)).toEqual([
      'Save Elena to my shortlist',
      'Remove Elena from my shortlist',
      'Connect with Elena',
    ]);
    expect(COPILOT_STARTERS.some((row) => STALE.test(`${row.en} ${row.el}`))).toBe(false);
    expect(reads.some((row) => row.en.toLowerCase().includes('notification'))).toBe(false);
  });

  it('keeps the popup compact: no wrapping research/calendar pile, no remove-Elena', () => {
    const page = copilotStartersFor('page');
    const popup = copilotStartersFor('popup');
    expect(popup.reads.map((row) => row.en)).toEqual(page.reads.map((row) => row.en));
    expect(popup.writes.length).toBeLessThan(page.writes.length);
    expect(popup.writes.some((row) => row.en.startsWith('Remove'))).toBe(false);
    expect(popup.reads.map((row) => row.en)).toEqual([
      'What should I do next?',
      'Show my best matches',
      'Find a technical cofounder in Athens',
      'How is my fundraising going?',
    ]);
  });

  it('links into Work surfaces the assistant actually reads', () => {
    expect(COPILOT_PRODUCT_LINKS.map((link) => link.href)).toEqual([
      '/matches',
      '/messages',
      '/fundraising',
      '/research',
      '/calendar',
      '/builder',
      '/builder/applications',
    ]);
  });

  it('offers each role a question the planner already answers', () => {
    const expected: Record<string, string> = {
      'Show mentoring requests': 'get_mentor_requests',
      'Which sessions are coming up?': 'get_mentorship_sessions',
      'Show my availability': 'get_availability',
      "Accept Sofia's mentoring request": 'respond_to_mentor_request',
      'Show my investor board': 'get_investor_board',
      'Show my inquiries': 'get_inquiries',
      'Show my services': 'get_services',
      'Which accelerator programmes are open right now?': 'get_programs',
      'Show organisation members': 'get_org_members',
      'Show cohorts': 'get_org_cohorts',
      'How many users are on the platform?': 'get_platform_stats',
      'Show the moderation queue': 'get_moderation_queue',
    };
    const roles = ['mentor', 'angel_investor', 'service_provider', 'incubator_admin', 'platform_admin'] as const;
    for (const role of roles) {
      const { reads, writes } = copilotStartersFor('page', role);
      expect(reads.length).toBeGreaterThan(0);
      expect(reads[0]?.en).toBe('What should I do next?');
      for (const starter of [...reads, ...writes]) {
        if (starter.en === 'What should I do next?' || starter.en === 'Show my best matches') continue;
        const planned = planCopilotTools(starter.en);
        expect(planned.some((tool) => tool.name === expected[starter.en]), `${role}: ${starter.en} → ${planned.map((tool) => tool.name).join(', ')}`).toBe(true);
      }
    }
    expect(copilotStartersFor('page', 'existing_founder').reads.map((row) => row.en)).toEqual(
      copilotStartersFor('page').reads.map((row) => row.en),
    );
  });

  it('renders starters as full-width rows that fill the pane, not a centred island', () => {
    expect(EMPTY_STATE_SOURCE).toContain('md:grid-cols-2');
    expect(EMPTY_STATE_SOURCE).toContain('md:divide-x');
    expect(EMPTY_STATE_SOURCE).toContain('w-full');
    expect(EMPTY_STATE_SOURCE).toContain('type-caption');
    expect(EMPTY_STATE_SOURCE).toContain('type-ui');
    expect(EMPTY_STATE_SOURCE).toContain('type-support');
    expect(EMPTY_STATE_SOURCE).toContain('mt-auto');
    expect(EMPTY_STATE_SOURCE).not.toContain('Writes wait');
    expect(EMPTY_STATE_SOURCE).not.toContain('flex-wrap');
    expect(EMPTY_STATE_SOURCE).not.toContain('rounded-full');
    expect(EMPTY_STATE_SOURCE).not.toContain('justify-center');
    expect(EMPTY_STATE_SOURCE).not.toContain('mx-auto');
    expect(EMPTY_STATE_SOURCE).not.toContain('max-w-3xl');
    expect(EMPTY_STATE_SOURCE).not.toContain('type-kicker');
    expect(EMPTY_STATE_SOURCE).not.toContain('type-plus-1');
    expect(EMPTY_STATE_SOURCE).not.toContain('type-plus-once');
    expect(EMPTY_STATE_SOURCE).not.toContain('type-minus-half');
    expect(EMPTY_STATE_SOURCE).not.toContain('type-plus-quarter');
    expect(EMPTY_STATE_SOURCE).not.toContain('type-plus-2');
    expect(WORKSPACE_SOURCE).toContain('CopilotEmptyState');
    expect(WORKSPACE_SOURCE).toContain('COPILOT_PRODUCT_LINKS');
    expect(WORKSPACE_SOURCE).toContain('type-identity');
    expect(WORKSPACE_SOURCE).toContain('type-support');
    expect(WORKSPACE_SOURCE).toContain('I can read');
    expect(WORKSPACE_SOURCE).toContain('Changes wait for your confirmation.');
    expect(WORKSPACE_SOURCE).not.toContain('type-plus-1');
    expect(WORKSPACE_SOURCE).not.toContain('type-plus-once');
    expect(WORKSPACE_SOURCE).not.toContain('type-plus-2');
    expect(WORKSPACE_SOURCE).not.toContain('flex-wrap gap-2');
  });
});
