import { describe, expect, it } from 'vitest';
import { threadLine } from './commitments-next';

const base = { role: 'candidate' as const, cardKind: 'cofounder' as const, myConfirmed: true, latestTermsVersion: 2, myAcceptedLatest: true };

describe('where a commitment stands, in one line', () => {
  it('says whose turn it is instead of the bare step', () => {
    // The demo thread with Elena: both confirmed, the visitor accepted terms v2.
    expect(threadLine({ ...base, step: 'terms' })).toEqual({
      en: 'Co-founder seat: you accepted the terms; waiting for them',
      el: 'Θέση συνιδρυτή: αποδεχτήκατε τους όρους· αναμονή της άλλης πλευράς',
      yourTurn: false,
    });
    expect(threadLine({ ...base, step: 'terms', myAcceptedLatest: false })).toMatchObject({ el: 'Θέση συνιδρυτή: νέοι όροι για να τους διαβάσετε', yourTurn: true });
    expect(threadLine({ ...base, step: 'terms', latestTermsVersion: 0 }).yourTurn).toBe(true);
    expect(threadLine({ ...base, step: 'interest', role: 'owner' })).toMatchObject({ yourTurn: true });
    expect(threadLine({ ...base, step: 'interest' }).el).toBe('Θέση συνιδρυτή: το ενδιαφέρον σας περιμένει απάντηση');
    expect(threadLine({ ...base, step: 'conversation', myConfirmed: false }).yourTurn).toBe(true);
    expect(threadLine({ ...base, step: 'agreed', cardKind: 'investor_intro' }).el).toBe('Σύσταση σε επενδυτή: συμφωνήθηκε');
    expect(threadLine({ ...base, step: 'closed', cardKind: 'equity_role' }).el).toBe('Ρόλος με equity: έκλεισε');
  });
});
