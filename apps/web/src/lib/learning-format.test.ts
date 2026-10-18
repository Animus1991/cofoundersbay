import { describe, expect, it } from 'vitest';
import { durationEl } from './i18n/units';
import { learningDuration, learningTotalHours } from './learning-format';

describe('learningDuration', () => {
  it('prints a reading time for what is read, and a length for what is watched or taken', () => {
    expect(learningDuration(20, 'article')).toBe('20 min read');
    expect(learningDuration(45, 'guide')).toBe('45 min read');
    expect(learningDuration(45, 'video')).toBe('45 min');
    expect(learningDuration(59, 'course')).toBe('59 min');
  });

  it('moves to hours from an hour up, with at most one decimal', () => {
    expect(learningDuration(60, 'video')).toBe('1 hour');
    expect(learningDuration(90, 'video')).toBe('1.5 hours');
    expect(learningDuration(180, 'course')).toBe('3 hours');
    expect(learningDuration(270, 'course')).toBe('4.5 hours');
    expect(learningDuration(75, 'podcast')).toBe('1.3 hours');
    // A long book is hours, not "600 min read".
    expect(learningDuration(600, 'book')).toBe('10 hours');
  });

  it('prints nothing when the library holds no usable length', () => {
    expect(learningDuration(null, 'video')).toBeUndefined();
    expect(learningDuration(undefined, 'video')).toBeUndefined();
    expect(learningDuration(0, 'video')).toBeUndefined();
    expect(learningDuration(-5, 'video')).toBeUndefined();
    expect(learningDuration(Number.NaN, 'video')).toBeUndefined();
  });

  it('only prints shapes the Greek side knows, so no card shows English on a Greek page', () => {
    for (const [minutes, type] of [[20, 'article'], [45, 'video'], [60, 'course'], [90, 'video'], [270, 'course'], [600, 'book']] as const) {
      const text = learningDuration(minutes, type)!;
      expect(durationEl(text), text).toBeTruthy();
    }
  });
});

describe('learningTotalHours', () => {
  it('adds minutes and then turns them into hours', () => {
    // Three one-hour courses are three hours, not "180h".
    expect(learningTotalHours([60, 60, 60])).toBe(3);
    expect(learningTotalHours([45, 270, 20, 90, 180, 35])).toBe(11);
  });

  it('skips resources with no length', () => {
    expect(learningTotalHours([null, undefined, 0, 120])).toBe(2);
    expect(learningTotalHours([])).toBe(0);
  });
});
