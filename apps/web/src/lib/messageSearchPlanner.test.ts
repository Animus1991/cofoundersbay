import { describe, expect, it } from 'vitest';
import { messageSearchQuery, planCopilotTools } from './copilot-planner';

/**
 * A search through one's own messages is told apart from reading the inbox
 * and from searching people, in both languages, and the words to look for
 * come out without the verb, the place or the article.
 */
describe('planning a search through my messages', () => {
  it.each([
    ['Search my messages for research canvas', 'research canvas'],
    ['Find "term sheet" in my messages', 'term sheet'],
    ['Where did Elena and I talk about the research canvas?', 'research canvas'],
    ['When did Marcus mention the starter?', 'starter'],
    ['Βρες στα μηνύματά μου τον πίνακα έρευνας', 'πίνακα έρευνας'],
    ['Πού μιλήσαμε με την Έλενα για τον πίνακα έρευνας;', 'πίνακα έρευνας'],
    ['Ψάξε στα μηνύματα για «όρους»', 'όρους'],
    ['Πότε μου ανέφερε ο Μάρκος το Next.js;', 'Next.js'],
  ])('%s → search_messages "%s"', (message, query) => {
    expect(messageSearchQuery(message)).toBe(query);
    expect(planCopilotTools(message)).toEqual([{ name: 'search_messages', args: { query } }]);
  });

  it('leaves the inbox, people search and sending alone', () => {
    for (const message of ['Do I have unread messages?', 'Έχω αδιάβαστα μηνύματα;', 'Find a technical cofounder in Athens', 'Στείλε μήνυμα στην Έλενα', 'Show my messages']) {
      expect(messageSearchQuery(message), message).toBeNull();
    }
  });

  it('asks what to look for when no words are given', () => {
    expect(planCopilotTools('Search my messages')).toEqual([{ name: 'search_messages', args: {} }]);
  });
});
