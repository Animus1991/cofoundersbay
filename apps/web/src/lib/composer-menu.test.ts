import { describe, expect, it } from 'vitest';
import { composerMode, filterCommands, insertMention } from './composer-menu';

describe('the composer menu', () => {
  it('opens commands on a leading slash and people on "@word" at the end', () => {
    expect(composerMode('/mat')).toEqual({ mode: 'slash', query: 'mat' });
    expect(composerMode('Write to @Ele')).toEqual({ mode: 'mention', query: 'Ele', start: 9 });
    expect(composerMode('@')).toEqual({ mode: 'mention', query: '', start: 0 });
    expect(composerMode('email me@work')).toBeNull();
    expect(composerMode('Show my matches')).toBeNull();
    expect(composerMode('@Elena then more')).toBeNull();
  });

  it('narrows commands in either language, without accents', () => {
    const items = [
      { id: 'new', en: 'New conversation', el: 'Νέα συνομιλία' },
      { id: 'mentors', en: 'Which mentors are available for sessions?', el: 'Ποιοι μέντορες είναι διαθέσιμοι;' },
    ];
    expect(filterCommands(items, '').map((i) => i.id)).toEqual(['new', 'mentors']);
    expect(filterCommands(items, 'μεντορ').map((i) => i.id)).toEqual(['mentors']);
    expect(filterCommands(items, 'new conv').map((i) => i.id)).toEqual(['new']);
    expect(filterCommands(items, 'zzz')).toEqual([]);
  });

  it('puts the chosen name where the mention was', () => {
    expect(insertMention('Write to @Ele', 9, 'Elena Papadopoulos')).toBe('Write to Elena Papadopoulos ');
    expect(insertMention('@ma', 0, 'Marcus Chen')).toBe('Marcus Chen ');
  });
});
