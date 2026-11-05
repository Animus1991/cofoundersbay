import { beforeEach, describe, expect, it } from 'vitest';
import { acceptSuggestion, clearUsageHistory, dismissSuggestion, parseUsage, readUsage, suggestionOutcomeCopy } from './usage-profile';

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('user', JSON.stringify({ id: 'u-1' }));
});

describe('how the suggestions fare (docs §107.7-8, §111)', () => {
  it('counts each suggestion once, taken or set aside, and says the rate', () => {
    expect(suggestionOutcomeCopy(readUsage())).toBeNull();
    acceptSuggestion('pin:/matches');
    acceptSuggestion('pin:/matches');
    acceptSuggestion('palette');
    dismissSuggestion('chord:/messages');
    const store = readUsage();
    expect(store.outcomes).toEqual({ accepted: 2, dismissed: 1 });
    // A taken suggestion does not come back.
    expect('pin:/matches' in store.dismissed).toBe(true);
    expect(suggestionOutcomeCopy(store)?.el).toBe('Προτάσεις ως τώρα: 2 έγιναν δεκτές, 1 παραμερίστηκε (67% αποδοχή).');
    expect(suggestionOutcomeCopy(store)?.en).toBe('Suggestions so far: 2 taken, 1 set aside (67% taken).');
  });

  it('reads an older store without them, and forgets them with the history', () => {
    expect(parseUsage(JSON.stringify({ v: 1, pins: [] })).outcomes).toEqual({ accepted: 0, dismissed: 0 });
    acceptSuggestion('palette');
    clearUsageHistory();
    expect(readUsage().outcomes).toEqual({ accepted: 0, dismissed: 0 });
  });
});
