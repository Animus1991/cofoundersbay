import { beforeEach, describe, expect, it } from 'vitest';
import { clearOnboardingProgress, loadOnboardingProgress, saveOnboardingProgress, stepsBefore } from './onboarding-progress';

const form = { displayName: 'Maria', headline: 'Founder', location: '', bio: '', role: 'founder' as const, skillIds: ['sales'] };

describe('onboarding progress', () => {
  beforeEach(() => window.localStorage.clear());

  it('comes back after a reload for the same member, and not for another', () => {
    saveOnboardingProgress('u1', { step: 'location', form }, 1_000);
    expect(loadOnboardingProgress('u1', 2_000)).toEqual({ step: 'location', form, at: 1_000 });
    expect(loadOnboardingProgress('u2', 2_000)).toBeNull();
  });

  it('is dropped once the profile exists, or when it is a week old', () => {
    saveOnboardingProgress('u1', { step: 'bio', form }, 0);
    expect(loadOnboardingProgress('u1', 8 * 24 * 60 * 60_000)).toBeNull();
    saveOnboardingProgress('u1', { step: 'bio', form }, 0);
    clearOnboardingProgress('u1');
    expect(loadOnboardingProgress('u1', 1)).toBeNull();
  });

  it('reads stored values defensively', () => {
    window.localStorage.setItem('cfb.onboarding.u1', JSON.stringify({ step: 'nope', form, at: 1 }));
    expect(loadOnboardingProgress('u1', 2)).toBeNull();
    window.localStorage.setItem('cfb.onboarding.u1', JSON.stringify({ step: 'skills', form: { ...form, role: 'admin', skillIds: ['a', 3] }, at: 1 }));
    expect(loadOnboardingProgress('u1', 2)?.form).toMatchObject({ role: 'founder', skillIds: ['a'] });
    window.localStorage.setItem('cfb.onboarding.u1', '{not json');
    expect(loadOnboardingProgress('u1', 2)).toBeNull();
  });

  it('lists the steps already answered', () => {
    expect(stepsBefore('name')).toEqual([]);
    expect(stepsBefore('location')).toEqual(['name', 'role', 'headline']);
  });
});
