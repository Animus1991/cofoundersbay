import { describe, expect, it } from 'vitest';
import { isWhereIsQuestion, rankPages, rankControls, whereIsTerms } from '@/lib/where-is';
import { planCopilotTools } from '@/lib/copilot-planner';

describe('where-is: recognising the question', () => {
  it.each([
    'Where do I export my pitch?',
    'where can I change my password',
    'How do I book a mentor?',
    'Which page has my saved profiles?',
    'Πού κάνω εξαγωγή το pitch μου;',
    'Πώς αλλάζω τη γλώσσα;',
    'Σε ποια σελίδα βλέπω τα ορόσημα;',
  ])('asks where: %s', (q) => {
    expect(isWhereIsQuestion(q)).toBe(true);
  });

  it.each([
    'where am I',
    'Πού βρίσκομαι;',
    'where did we talk about pricing',
    'open events',
    'save Elena to my shortlist',
    'who viewed my profile',
  ])('is not a where question: %s', (q) => {
    expect(isWhereIsQuestion(q)).toBe(false);
  });

  it('strips the scaffolding and keeps the thing being looked for', () => {
    expect(whereIsTerms('Where do I export my pitch?')).toEqual(['export', 'pitch']);
    expect(whereIsTerms('Πού κάνω εξαγωγή το pitch μου;')).toEqual(['εξαγωγη', 'pitch']);
  });
});

describe('where-is: ranking pages from the registry', () => {
  it('sends pitch export to the pitch deck builder', () => {
    const [top] = rankPages('Where do I export my pitch?');
    expect(top.page.path).toMatch(/pitch/);
  });

  it('answers in Greek with the same destination', () => {
    const [top] = rankPages('Πού κάνω εξαγωγή το pitch μου;');
    expect(top.page.path).toMatch(/pitch/);
  });

  it('finds settings for a password change and notifications for email alerts', () => {
    expect(rankPages('where can I change my password')[0].page.path).toMatch(/settings/);
    expect(rankPages('how do I turn off email notifications')[0].page.path).toMatch(/notifications|settings/);
  });

  it('keeps admin pages out of a member question', () => {
    for (const hit of rankPages('where do I see analytics')) {
      expect(hit.page.path.startsWith('/admin')).toBe(false);
    }
  });

  it('returns nothing for scaffolding alone', () => {
    expect(rankPages('where do I')).toEqual([]);
  });

  it('matches a control of the open page by its label', () => {
    const hits = rankControls('how do I change the period', [
      { id: 'analytics_period', labelEn: 'Period', labelEl: 'Περίοδος', writes: false, options: [{ value: '30d', labelEn: '30 days', labelEl: '30 ημέρες' }], current: '30d' },
      { id: 'export_csv', labelEn: 'Export CSV', labelEl: 'Εξαγωγή CSV', writes: false },
    ]);
    expect(hits[0]?.control.id).toBe('analytics_period');
  });
});

describe('where-is: the planner hands the question to one read', () => {
  it('plans where_is and nothing else', () => {
    expect(planCopilotTools('Where do I export my pitch?')).toEqual([
      { name: 'where_is', args: { query: 'Where do I export my pitch?' } },
    ]);
  });

  it('still searches messages for "where did we talk about"', () => {
    expect(planCopilotTools('where did we talk about pricing')[0].name).toBe('search_messages');
  });
});
