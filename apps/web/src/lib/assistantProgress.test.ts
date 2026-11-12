import { describe, expect, it } from 'vitest';
import { listDeclarations } from '@cofounderbay/shared';
import { phaseLabel, phasePercent, readLabel, type AssistantPhase } from './assistant-progress';

describe('assistant progress (docs §122)', () => {
  it('names a declared read in the present, in both languages', () => {
    expect(readLabel('get_milestones')).toEqual({ en: 'Reading your milestones', el: 'Ανάγνωση των ορόσημών σου' });
    expect(readLabel('search_people').en).toBe('Searching people');
    expect(readLabel('get_recommendations').en).toBe('Getting your matches');
    expect(readLabel('where_is').en).toBe('Finding where something lives');
  });

  it('never claims a read it cannot name', () => {
    expect(readLabel(undefined)).toEqual({ en: 'Reading the platform', el: 'Ανάγνωση της πλατφόρμας' });
    expect(readLabel('not_a_tool')).toEqual({ en: 'Reading the platform', el: 'Ανάγνωση της πλατφόρμας' });
  });

  it('every declared read has a progress label with Greek', () => {
    for (const declaration of listDeclarations()) {
      if (declaration.kind !== 'read') continue;
      const label = readLabel(declaration.id);
      expect(label.en, declaration.id).toMatch(/^(Reading|Searching|Getting|Explaining|Finding|Checking)\b/);
      expect(label.el, declaration.id).toMatch(/[Ͱ-Ͽ]/);
    }
  });

  it('counts a read among the reads of its turn', () => {
    expect(phaseLabel({ kind: 'reading', tool: 'get_events', index: 2, total: 3 })).toEqual({
      en: 'Reading upcoming events (2/3)',
      el: 'Ανάγνωση επερχόμενων εκδηλώσεων (2/3)',
    });
    expect(phaseLabel({ kind: 'reading', tool: 'get_events', index: 1, total: 1 }).en).toBe('Reading upcoming events');
  });

  it('moves forward and never back within a turn', () => {
    const turn: AssistantPhase[] = [
      { kind: 'planning' },
      { kind: 'reading', tool: 'get_graph', index: 1, total: 3 },
      { kind: 'reading', tool: 'get_milestones', index: 2, total: 3 },
      { kind: 'reading', tool: 'get_events', index: 3, total: 3 },
      { kind: 'writing' },
      { kind: 'reading_more', tool: 'get_notifications', index: 1, total: 1 },
    ];
    const percents = turn.map(phasePercent);
    for (let i = 1; i < percents.length; i += 1) expect(percents[i]).toBeGreaterThan(percents[i - 1]);
    expect(percents[0]).toBeGreaterThan(0);
    expect(percents[percents.length - 1]).toBeLessThan(100);
  });

  it('keeps a read inside the band even with odd counts', () => {
    expect(phasePercent({ kind: 'reading', tool: 'get_graph', index: 9, total: 3 })).toBe(75);
    expect(phasePercent({ kind: 'reading', tool: 'get_graph' })).toBe(75);
    expect(phasePercent({ kind: 'reading', tool: 'get_graph', index: 0, total: 0 })).toBe(75);
  });
});
