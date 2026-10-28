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

  it('finds a capability by the words of its example as well as its name (docs §111)', () => {
    const items = [
      { id: 'cap:start_or_send_message', en: 'Message someone', el: 'Μήνυμα σε κάποιον', keywords: 'Message Elena about the pilot Στείλε μήνυμα στην Elena για το πιλοτικό' },
      { id: 'cap:get_events', en: 'Read events', el: 'Ανάγνωση εκδηλώσεων', keywords: 'What events are coming up? Ποιες εκδηλώσεις έρχονται;' },
    ];
    expect(filterCommands(items, 'πιλοτ').map((i) => i.id)).toEqual(['cap:start_or_send_message']);
    expect(filterCommands(items, 'εκδηλ ερχον').map((i) => i.id)).toEqual(['cap:get_events']);
    expect(filterCommands(items, '').length).toBe(2);
  });
});
