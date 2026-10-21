import { describe, expect, it } from 'vitest';
import { explainMatch, splitReasons, viewerFacts, type ExplainedReason, type ViewerFacts } from './match-explain';

const NOW = Date.parse('2026-10-21T12:00:00.000Z');
// Greek terms without the on-demand catalog, so the test never depends on what loaded.
const TERMS_EL: Record<string, string> = { Product: 'Προϊόν', Growth: 'Ανάπτυξη', Fundraising: 'Χρηματοδότηση' };
const options = { nowMs: NOW, termEl: (t: string) => TERMS_EL[t] ?? t };

// The sample visitor (preview-api ME_PROFILE): a founder at idea stage in
// Athens, with Product and Growth, looking for a co-founder and a mentor.
const ALEX = viewerFacts({
  role: 'founder',
  location: 'Athens, Greece',
  skills: [{ skillName: 'Product' }, { skillName: 'Growth' }],
  rolePayload: { stage: 'idea', lookingFor: ['cofounder', 'mentor'] },
}) as ViewerFacts;

const codes = (reasons: ExplainedReason[]) => reasons.map((r) => r.code);
const greek = (reasons: ExplainedReason[]) => reasons.map((r) => r.el);

describe('the reader’s facts', () => {
  it('reads what profile edit saves, and the older spelling', () => {
    expect(ALEX).toEqual({
      role: 'founder',
      skills: ['Product', 'Growth'],
      location: 'Athens, Greece',
      stage: 'idea',
      commitment: null,
      wants: ['cofounder', 'mentor'],
      rounds: [],
    });
    const edited = viewerFacts({
      role: 'founder',
      rolePayload: { rolesSought: ['Co-founder', 'CTO'], stage: 'Early traction', commitment: 'Full time' },
    });
    expect(edited?.wants).toEqual(['cofounder']);
    expect(edited?.stage).toBe('traction');
    expect(edited?.commitment).toBe('full-time');
    const investor = viewerFacts({ role: 'angel_investor', rolePayload: { stages: ['Pre seed', 'seed', 'nonsense'] } });
    expect(investor?.role).toBe('investor');
    expect(investor?.rounds).toEqual(['pre-seed', 'seed']);
  });

  it('is null until the profile loads', () => {
    expect(viewerFacts(null)).toBeNull();
    expect(viewerFacts(undefined)).toBeNull();
  });
});

describe('why two members match', () => {
  it('names the facts instead of the labels', () => {
    const elena = explainMatch(
      {
        role: 'founder',
        skillNames: ['Product', 'Growth', 'Fundraising'],
        location: 'Athens, Greece',
        matchReasons: ['Skills overlap', 'Same or nearby location'],
        availability: 'full-time',
        stage: 'traction',
      },
      ALEX,
      options,
    );
    expect(greek(elena)).toEqual([
      'Ταιριάζει με την αναζήτησή σας: συνιδρυτής',
      'Συμπληρώνει τις δεξιότητές σας: Χρηματοδότηση',
      'Κοινές δεξιότητες: Προϊόν, Ανάπτυξη',
      'Ίδια πόλη: Αθήνα',
    ]);
    expect(elena[0].en).toBe('Fits what you are looking for: a co-founder');
    expect(elena[2].en).toBe('Shared skills: Product, Growth');
  });

  it('never says two people share skills when they share none', () => {
    // The sample said "Skills overlap" for Marcus, who shares nothing with the visitor.
    const marcus = explainMatch(
      { role: 'cofounder', skillNames: ['TypeScript', 'Next.js', 'AI'], location: 'Berlin, Germany', matchReasons: ['Skills overlap', 'Active this week'] },
      ALEX,
      options,
    );
    expect(codes(marcus)).not.toContain('shared');
    expect(marcus.find((r) => r.code === 'complement')?.en).toBe('Complements your skills: TypeScript, Next.js, AI');
    // The hit carries no activity field, so the engine's word stays, without a gender.
    expect(marcus.find((r) => r.code === 'activity')?.el).toBe('Ενεργό μέλος αυτή την εβδομάδα');

    // Two empty skill lists: the engine counted a full overlap.
    const empty = explainMatch(
      { role: 'founder', skillNames: [], location: null, matchReasons: ['Skills overlap', 'Cofounder match'] },
      { ...ALEX, skills: [] },
      options,
    );
    expect(codes(empty)).not.toContain('shared');
    expect(greek(empty)).toEqual(['Ταιριάζει με την αναζήτησή σας: συνιδρυτής']);
  });

  it('keeps the engine’s word for what the page cannot check', () => {
    // No stage on the hit: the engine had one, so its reason stays, in Greek.
    const kept = explainMatch({ role: 'founder', skillNames: [], location: null, matchReasons: ['Same stage', 'Aligned goals & vision'] }, ALEX, options);
    expect(greek(kept)).toContain('Ίδιο στάδιο');
    expect(greek(kept)).toContain('Κοινοί στόχοι');
    // With the stage on the hit, the page says which one, or nothing.
    const checked = explainMatch({ role: 'founder', skillNames: [], location: null, stage: 'scaling', matchReasons: ['Same stage'] }, ALEX, options);
    expect(codes(checked)).not.toContain('stage');
  });

  it('says the stage when both founders gave one', () => {
    const same = explainMatch({ role: 'founder', stage: 'idea', location: null }, ALEX, options);
    expect(same.find((r) => r.code === 'stage')).toMatchObject({ en: 'Same stage: Idea', el: 'Ίδιο στάδιο: Ιδέα' });
    const close = explainMatch({ role: 'founder', stage: 'MVP', location: null }, ALEX, options);
    expect(close.find((r) => r.code === 'stage')).toMatchObject({ en: 'Close stages: Idea and MVP', el: 'Κοντινά στάδια: Ιδέα και MVP' });
  });

  it('meets an investor’s rounds with a founder’s stage, from either side', () => {
    const nikos = explainMatch(
      { role: 'investor', skillNames: ['Investing'], location: 'Limassol, Cyprus', investmentStages: ['pre-seed', 'seed'], matchReasons: ['Stage fit'] },
      ALEX,
      options,
    );
    expect(nikos[0]).toMatchObject({
      code: 'investor_stage',
      en: 'Invests at pre-seed: fits your idea stage',
      el: 'Επενδύει σε προ-seed: ταιριάζει στο στάδιό σας, «Ιδέα»',
    });
    // "Invests in startups" would repeat it.
    expect(codes(nikos)).not.toContain('role');

    const investor = viewerFacts({ role: 'investor', rolePayload: { stages: ['seed'] } });
    const founder = explainMatch({ role: 'founder', stage: 'mvp', location: null }, investor, options);
    expect(founder[0]).toMatchObject({ en: 'At MVP stage: fits your seed investing', el: 'Στάδιο «MVP»: ταιριάζει στις επενδύσεις σας σε seed' });
  });

  it('places people in the same city, country or place, and never "Remote"', () => {
    const place = (location: string | null, mine = 'Athens, Greece') =>
      explainMatch({ role: 'founder', location }, { ...ALEX, location: mine }, options).find((r) => r.code === 'place');
    expect(place('Athens, Greece')?.el).toBe('Ίδια πόλη: Αθήνα');
    expect(place('Thessaloniki, Greece')?.el).toBe('Ίδια χώρα: Ελλάδα');
    expect(place('Greece')?.el).toBe('Ίδια χώρα: Ελλάδα');
    expect(place('Athens')?.el).toBe('Ίδια πόλη: Αθήνα');
    expect(place('Cyprus', 'Cyprus')?.el).toBe('Ίδια τοποθεσία: Κύπρος');
    expect(place('Berlin, Germany')).toBeUndefined();
    expect(place('Remote', 'Remote')).toBeUndefined();
    expect(place(null)).toBeUndefined();
  });

  it('says the same time commitment only when both gave one', () => {
    const reader = { ...ALEX, commitment: 'full-time' };
    expect(explainMatch({ role: 'founder', availability: 'Full time' }, reader, options).find((r) => r.code === 'commitment')?.el)
      .toBe('Ίδια δέσμευση χρόνου: πλήρης απασχόληση');
    expect(explainMatch({ role: 'founder', availability: 'part-time' }, reader, options).find((r) => r.code === 'commitment')).toBeUndefined();
    expect(explainMatch({ role: 'mentor', availability: '3-5 hours/week' }, reader, options).find((r) => r.code === 'commitment')).toBeUndefined();
  });

  it('reads activity from the clock it is given', () => {
    const at = (hit: { lastSeenAt?: number | null; profileUpdatedAt?: string | null }) =>
      explainMatch({ role: 'founder', ...hit }, ALEX, options).find((r) => r.code === 'activity')?.el;
    expect(at({ lastSeenAt: NOW / 1000 - 600 })).toBe('Ενεργό μέλος σήμερα');
    expect(at({ lastSeenAt: NOW / 1000 - 3 * 86_400 })).toBe('Ενεργό μέλος αυτή την εβδομάδα');
    expect(at({ lastSeenAt: NOW / 1000 - 30 * 86_400 })).toBeUndefined();
    expect(at({ lastSeenAt: null, profileUpdatedAt: '2026-10-19T09:00:00.000Z' })).toBe('Προφίλ ενημερωμένο αυτή την εβδομάδα');
  });

  it('names a team role search with the role sentence, not as found', () => {
    const cto = viewerFacts({ role: 'founder', rolePayload: { rolesSought: ['CTO'] } });
    const reasons = explainMatch({ role: 'founder', location: null }, cto, options);
    expect(codes(reasons)).not.toContain('covers');
    expect(reasons[0]).toMatchObject({ code: 'role', el: 'Χτίζει επίσης εταιρεία' });
    const mentorReader = viewerFacts({ role: 'mentor' });
    expect(explainMatch({ role: 'founder', stage: 'traction', location: null }, mentorReader, options)[0].el)
      .toBe('Χτίζει εταιρεία, στο στάδιο «Traction»');
  });

  it('says there is little to compare when there is', () => {
    const reasons = explainMatch({ role: 'org', skillNames: [], location: null }, ALEX, options);
    expect(reasons).toEqual([{ code: 'thin', en: 'Few details to compare yet', el: 'Λίγα στοιχεία για σύγκριση ακόμη', weight: 0 }]);
  });

  it('without the reader, translates the engine’s reasons and drops its filler', () => {
    expect(greek(explainMatch({ matchReasons: ['Active recently', 'Cofounder match', 'Skills overlap'] }, null, options))).toEqual([
      'Κοινές δεξιότητες',
      'Ταίριασμα συνιδρυτή',
      'Προφίλ ενημερωμένο αυτή την εβδομάδα',
    ]);
    expect(greek(explainMatch({ matchReasons: ['Profile match'] }, null, options))).toEqual(['Λίγα κοινά στοιχεία ακόμη']);
    expect(greek(explainMatch({ matchReasons: ['Profile match', 'Same stage'] }, null, options))).toEqual(['Ίδιο στάδιο']);
  });

  it('never gives another member a gender in Greek', () => {
    const all = [
      ...explainMatch({ role: 'founder', skillNames: ['AI'], location: 'Athens', matchReasons: ['Active this week', 'Highly active on platform', 'Open to mentoring'] }, ALEX, options),
      ...explainMatch({ role: 'mentor', location: null, lastSeenAt: NOW / 1000 }, viewerFacts({ role: 'org' }), options),
      ...explainMatch({ matchReasons: ['Active this week', 'Highly active on platform'] }, null, options),
    ];
    for (const r of all) {
      // «Ανοιχτός/ή σε» is the owner's name for the feature; nothing else slashes.
      // (No \b after Greek: JavaScript's \b only knows ASCII letters.)
      expect(r.el.replace('Ανοιχτός/ή σε', '')).not.toMatch(/Ενεργός|\/ή|ος\/η/);
    }
  });

  it('puts two on the card and the rest behind the disclosure', () => {
    expect(splitReasons([1, 2, 3, 4])).toEqual({ face: [1, 2], rest: [3, 4] });
    expect(splitReasons([1])).toEqual({ face: [1], rest: [] });
  });
});
