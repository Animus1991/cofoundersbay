import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime, initialsOf } from './utils';

describe('formatRelativeTime', () => {
  afterEach(() => vi.useRealTimers());

  it('counts back from now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-24T12:00:00Z'));
    expect(formatRelativeTime('2026-09-24T11:59:30Z')).toBe('just now');
    expect(formatRelativeTime('2026-09-24T09:00:00Z')).toBe('3h ago');
    expect(formatRelativeTime(new Date('2026-09-20T12:00:00Z'))).toBe('4d ago');
  });

  it('shows a value that is not a date as given, not as "NaNy ago"', () => {
    // /admin/users sample rows carry "2 hours ago" and "Never"; every one of
    // them rendered "NaNy ago" in the Last Active column.
    expect(formatRelativeTime('2 hours ago')).toBe('2 hours ago');
    expect(formatRelativeTime('Never')).toBe('Never');
    expect(formatRelativeTime('')).toBe('—');
    expect(formatRelativeTime(new Date('nope'))).toBe('—');
  });
});

describe('initialsOf', () => {
  it('takes the first and last word and skips titles', () => {
    expect(initialsOf('Dr. Sarah Kim')).toBe('SK');
    expect(initialsOf('Elena Papadopoulos')).toBe('EP');
    expect(initialsOf('Maria del Carmen Ruiz')).toBe('MR');
    expect(initialsOf('prof Ada')).toBe('A');
  });

  it('never returns more than two letters, and a mark for no name', () => {
    expect(initialsOf('Anna Maria Lisa Kowalski').length).toBe(2);
    expect(initialsOf('')).toBe('?');
    expect(initialsOf(null)).toBe('?');
  });
});
