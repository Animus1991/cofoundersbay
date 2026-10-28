import { describe, expect, it } from 'vitest';
import type { ExpertDirectoryItem, MentorProfileItem } from '@/lib/api';
import { areaChips, areasOf, mergeDirectory, offers, priceOf, type Mentor } from './directory';
import {
  areaKeys,
  coachingAreasFrom,
  directoryFromParams,
  directoryHref,
  reviewAreasFrom,
} from './services';

function hit(id: string, words: string[] = []): Mentor {
  return { id, displayName: id, avatarUrl: null, bio: '', expertise: words, rating: 0, totalSessions: 0, areaWords: words };
}

function profile(userId: string, extra: Partial<MentorProfileItem> = {}): MentorProfileItem {
  return {
    id: `p-${userId}`,
    userId,
    displayName: userId,
    headline: null,
    bio: null,
    avatarUrl: null,
    location: null,
    industries: [],
    skills: [],
    startupStages: [],
    yearsExperience: null,
    availabilityStatus: 'available',
    isFree: false,
    hourlyRate: 90,
    currency: 'EUR',
    sessionCount: 12,
    rating: 4.8,
    reviewCount: 5,
    ...extra,
  };
}

function expert(userId: string, extra: Partial<ExpertDirectoryItem> = {}): ExpertDirectoryItem {
  return {
    id: userId,
    userId,
    displayName: userId,
    headline: null,
    bio: null,
    avatarUrl: null,
    skills: [],
    specializations: [],
    industries: [],
    isVerified: false,
    isFree: false,
    feeFrom: 150,
    currency: 'EUR',
    completedReviews: 3,
    rating: 4.5,
    ...extra,
  };
}

describe('the one mentor directory (docs §111)', () => {
  it('gives a search hit what the mentorship directory knows about the person', () => {
    const [sarah] = mergeDirectory({ hits: [hit('sarah')], profiles: [profile('sarah', { availabilityStatus: 'unavailable' })], experts: [], searching: false });
    expect(sarah.rating).toBe(4.8);
    expect(sarah.totalSessions).toBe(12);
    expect(sarah.hourlyRate).toBe(90);
    expect(sarah.currency).toBe('EUR');
    // The profile says "unavailable"; the card speaks in available / limited / busy.
    expect(sarah.availabilityStatus).toBe('busy');
  });

  it('keeps everyone Coaching listed: mentors the search missed are added when nothing is searched', () => {
    const people = mergeDirectory({ hits: [hit('sarah')], profiles: [profile('sarah'), profile('nikos')], experts: [], searching: false });
    expect(people.map((m) => m.id)).toEqual(['sarah', 'nikos']);
    // A search is the search box's answer, not the whole directory.
    const searched = mergeDirectory({ hits: [hit('sarah')], profiles: [profile('sarah'), profile('nikos')], experts: [], searching: true });
    expect(searched.map((m) => m.id)).toEqual(['sarah']);
  });

  it('marks who takes review requests, with their review standing and fee', () => {
    const people = mergeDirectory({
      hits: [hit('sarah'), hit('nikos')],
      profiles: [],
      experts: [expert('sarah', { isFree: true, feeFrom: 200 })],
      searching: false,
    });
    expect(offers(people[0], 'review')).toBe(true);
    expect(offers(people[1], 'review')).toBe(false);
    expect(offers(people[1], 'coaching')).toBe(true);
    // A free reviewer has no fee, whatever the fee column says.
    expect(priceOf(people[0], 'review')).toBeNull();
    expect(people[0].review).toEqual({ completed: 3, rating: 4.5, feeFrom: null, currency: 'EUR' });
  });

  it('files people under the areas their own words name, as whole words', () => {
    expect(coachingAreasFrom(['Go-to-market', 'Hiring'])).toEqual(['team_dynamics', 'strategy']);
    // "ops" inside "develops" and "ip" inside "leadership" match nothing.
    expect(coachingAreasFrom(['develops'])).toEqual([]);
    expect(reviewAreasFrom(['Leadership'])).toEqual([]);
    expect(reviewAreasFrom(['Pitch coaching', 'Unit economics'])).toEqual(['pitch_deck', 'financial_model']);
    // "General" is a request anyone can take, never an area.
    expect(areaKeys('review')).not.toContain('general');
  });

  it('counts each area the people on screen are filed under, keeping a chosen one at nought', () => {
    const people = [hit('a', ['Pitch narrative']), hit('b', ['Pitch deck', 'Pricing']), hit('c', ['Hardware'])];
    const chips = areaChips(people, 'review', areaKeys('review'), 'legal_structure');
    expect(chips[0]).toEqual({ key: 'pitch_deck', count: 2 });
    expect(chips).toContainEqual({ key: 'business_model', count: 1 });
    expect(chips).toContainEqual({ key: 'legal_structure', count: 0 });
    expect(areasOf(people[2], 'review')).toEqual([]);
    expect(areaChips(people, 'mentoring', [], null)).toEqual([]);
  });

  it('links into the directory with the service and a known area only', () => {
    expect(directoryHref('mentoring')).toBe('/mentoring');
    expect(directoryHref('coaching', 'strategy')).toBe('/mentoring?service=coaching&area=strategy');
    expect(directoryHref('review', 'strategy')).toBe('/mentoring?service=review');
    expect(directoryFromParams(new URLSearchParams('service=review&area=pitch_deck'))).toEqual({ service: 'review', area: 'pitch_deck' });
    expect(directoryFromParams(new URLSearchParams('service=bogus&area=pitch_deck'))).toEqual({ service: 'mentoring', area: null });
    expect(directoryFromParams(new URLSearchParams('service=coaching&area=pitch_deck'))).toEqual({ service: 'coaching', area: null });
  });
});
