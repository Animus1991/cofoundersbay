import { describe, expect, it } from 'vitest';
import { generationFor, preferenceLines, RESPONSE_STYLE_INSTRUCTIONS, withAnswerPreferences } from './answer-preferences';

/*
 * /settings/ai saved a reply style, language, emoji, creativity and length
 * that no answer read (docs §98). These hold the turn to them.
 */
describe('answer preferences', () => {
  const base = [
    { role: 'system' as const, content: 'You are the assistant. Be concise, friendly, and professional.' },
    { role: 'user' as const, content: 'How do I find a co-founder?' },
  ];

  it('adds each of the four styles to the system message, over the agent\'s default tone', () => {
    for (const style of ['concise', 'detailed', 'casual', 'formal']) {
      const [system, user] = withAnswerPreferences(base, { responseStyle: style });
      expect(system.content).toContain(RESPONSE_STYLE_INSTRUCTIONS[style]);
      expect(system.content).toMatch(/takes precedence over any default length or tone/);
      expect(user).toEqual(base[1]);
    }
  });

  it('says the language and emoji choice', () => {
    expect(preferenceLines({ responseLanguage: 'el', useEmoji: false })).toEqual([
      'Reply in Greek unless the person writes to you in another language.',
      'Do not use emoji.',
    ]);
  });

  it('changes nothing when nothing is set or the style is unknown', () => {
    expect(withAnswerPreferences(base, null)).toBe(base);
    expect(withAnswerPreferences(base, { responseStyle: 'poetic' })).toBe(base);
  });

  it('adds a system message when the turn has none', () => {
    const out = withAnswerPreferences([base[1]], { responseStyle: 'formal' });
    expect(out[0].role).toBe('system');
    expect(out).toHaveLength(2);
  });

  it('uses the person\'s creativity and length in bounds, and gives a detailed answer room', () => {
    expect(generationFor({ temperature: 0.7, maxTokens: 512 }, { temperature: 0.3, maxTokens: 2048 })).toEqual({ temperature: 0.3, maxTokens: 2048 });
    expect(generationFor({ temperature: 0.7, maxTokens: 512 }, { temperature: 9, maxTokens: 999999 })).toEqual({ temperature: 1.2, maxTokens: 8192 });
    expect(generationFor({ temperature: 0.7, maxTokens: 512 }, null)).toEqual({ temperature: 0.7, maxTokens: 512 });
    expect(generationFor({ temperature: 0.7, maxTokens: 512 }, { responseStyle: 'detailed' }).maxTokens).toBe(1024);
  });
});
