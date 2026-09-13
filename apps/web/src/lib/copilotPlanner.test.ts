import { describe, expect, it } from 'vitest';
import { planCopilotTools } from './copilot-planner';
import { listActionIds } from '@cofounderbay/shared';

/**
 * The heuristic planner is the path taken when the model behind the assistant
 * cannot call tools. Without an arm here, the three page capabilities would be
 * reachable only from a tool-calling model, which is exactly the split this
 * project's shared declarations exist to prevent.
 *
 * What these assert is intent detection, not execution: that a phrase a founder
 * would actually type reaches the right capability, and — just as important —
 * that phrases which read like one capability do not trip another.
 */

function plan(message: string) {
  return planCopilotTools(message).map((tool) => tool.name);
}

function argsFor(message: string, name: string) {
  return planCopilotTools(message).find((tool) => tool.name === name)?.args;
}

describe('planning the analytics window', () => {
  it('reads the window out of an English or Greek request', () => {
    expect(argsFor('show my analytics for the last 30 days', 'analytics_set_period')).toEqual({ period: '30d' });
    expect(argsFor('analytics for the last 90 days please', 'analytics_set_period')).toEqual({ period: '90d' });
    expect(argsFor('δείξε μου τα αναλυτικά για τις τελευταίες 14 ημέρες', 'analytics_set_period')).toEqual({ period: '14d' });
    expect(argsFor('αναλυτικά τελευταίου μήνα', 'analytics_set_period')).toEqual({ period: '30d' });
  });

  it('prefers the longer spelling so 14 is not read as 4, nor 90 inside 190', () => {
    expect(argsFor('analytics, last 14 days', 'analytics_set_period')).toEqual({ period: '14d' });
  });

  it('does not read a window out of the word for "message"', () => {
    // 'μήνυμα' contains the stem that used to match a month, so asking to send
    // someone a message while mentioning metrics planned an analytics change.
    expect(plan('στείλε μήνυμα στον Νίκο')).not.toContain('analytics_set_period');
    expect(plan('δες τα αναλυτικά και στείλε μήνυμα')).not.toContain('analytics_set_period');
  });

  it('needs both an analytics word and a window, not either alone', () => {
    expect(plan('what happened in the last 30 days')).not.toContain('analytics_set_period');
    expect(plan('open analytics')).not.toContain('analytics_set_period');
  });
});

describe('planning a workspace', () => {
  it('takes the name from quotes and leaves it out when there are none', () => {
    expect(argsFor('create a workspace called “Helios”', 'workspace_create')).toEqual({ name: 'Helios' });
    expect(argsFor('δημιούργησε χώρο εργασίας «Ήλιος»', 'workspace_create')).toEqual({ name: 'Ήλιος' });

    // No name is not a guess: the engine turns this into a question.
    expect(argsFor('create a workspace', 'workspace_create')).toEqual({});
  });

  it('stays out of the way of ordinary talk about the builder', () => {
    expect(plan('what is a workspace for')).not.toContain('workspace_create');
    expect(plan('open builder')).not.toContain('workspace_create');
  });
});

describe('planning a readiness criterion', () => {
  it('needs an object and a verb together', () => {
    expect(plan('tick the team readiness criterion')).toContain('readiness_tick_criterion');
    expect(argsFor('tick the team readiness criterion', 'readiness_tick_criterion')).toEqual({ dimension: 'team' });
    expect(argsFor('σημείωσε το κριτήριο χρηματοδότησης', 'readiness_tick_criterion')).toEqual({ dimension: 'funding' });

    // Asking about a score is a question, not a request to change one.
    expect(plan('what is my readiness score')).not.toContain('readiness_tick_criterion');
    expect(plan('ποια είναι η ετοιμότητά μου')).not.toContain('readiness_tick_criterion');
  });

  it('plans without a dimension rather than picking one', () => {
    expect(argsFor('mark a readiness criterion as done', 'readiness_tick_criterion')).toEqual({});
  });
});

describe('what the planner may name', () => {
  it('only ever plans capabilities the shared package declares', () => {
    const declared = new Set<string>(listActionIds());
    const phrases = [
      'find a technical cofounder in Athens',
      'save Elena to my shortlist',
      'connect with Marcus',
      'στείλε μήνυμα στη Sarah',
      'open matches',
      'show my analytics for the last 30 days',
      'create a workspace called “Helios”',
      'tick the market readiness criterion',
      'what should I do next',
      '',
    ];

    const unknown = new Set<string>();
    for (const phrase of phrases) {
      for (const name of plan(phrase)) if (!declared.has(name)) unknown.add(name);
    }
    expect([...unknown]).toEqual([]);
  });

  it('keeps the phrases that worked before planning what they planned before', () => {
    expect(plan('find a technical cofounder in Athens')).toContain('search_people');
    expect(plan('save Elena to my shortlist')).toContain('shortlist_add');
    expect(plan('connect with Marcus')).toContain('send_connection');
    expect(plan('open matches')).toContain('navigate');
    expect(plan('what should I do next')).toContain('get_graph');
  });
});
