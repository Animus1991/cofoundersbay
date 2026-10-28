import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/lib/i18n/catalog';
import { FIRST_MESSAGE_MAX, firstMessageDraft } from '@/lib/match-first-message';

/** The engine's translator: catalogue lookup by the English sentence, then placeholders. */
function translator(locale: 'en' | 'el') {
  return (key: string, vars: Record<string, string | number> = {}) => {
    const sentence = locale === 'el' ? CATALOG.el[key] ?? key : key;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), sentence);
  };
}

describe('firstMessageDraft', () => {
  it('writes from the reasons and the first early topic, and only those', () => {
    const text = firstMessageDraft(
      { name: 'Elena Papadopoulos', reasons: ['Both in Athens.', 'Complementary skills: you build, she sells', 'Same stage'], topics: ['How do you split equity?', 'Remote or in person?'] },
      translator('en'),
      'en',
    );
    expect(text).toContain('Hi Elena,');
    expect(text).toContain('I read why we match on CoFounderBay: Both in Athens; Complementary skills: you build, she sells.');
    expect(text).not.toContain('Same stage');
    expect(text).toContain('One thing I would rather talk about early: How do you split equity?\n\n');
    expect(text).not.toContain('Remote or in person');
    expect(text.endsWith('Would you be open to a short call this week?')).toBe(true);
  });

  it('says something true when there are no reasons yet', () => {
    const text = firstMessageDraft({ name: 'Nikos', reasons: [], topics: [] }, translator('en'), 'en');
    expect(text).toContain('CoFounderBay put us side by side');
    expect(text).not.toContain('I read why we match');
  });

  it('reads in Greek with the Greek list separator', () => {
    const text = firstMessageDraft({ name: 'Έλενα Παπαδοπούλου', reasons: ['Και οι δύο στην Αθήνα', 'Συμπληρωματικές δεξιότητες'], topics: [] }, translator('el'), 'el');
    expect(text.startsWith('Γεια σας Έλενα,')).toBe(true);
    expect(text).toContain('Και οι δύο στην Αθήνα · Συμπληρωματικές δεξιότητες');
    expect(text).not.toMatch(/\b(Hi|read|call)\b/);
  });

  it('never exceeds what the composer accepts', () => {
    const text = firstMessageDraft({ name: 'A', reasons: ['x'.repeat(1500), 'y'.repeat(1500)], topics: [] }, translator('en'), 'en');
    expect(text.length).toBeLessThanOrEqual(FIRST_MESSAGE_MAX);
  });
});
