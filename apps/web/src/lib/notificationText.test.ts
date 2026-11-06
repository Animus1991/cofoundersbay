import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { notificationEl } from './notification-text';

const API = '../api/src';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return name.endsWith('.ts') && !name.endsWith('.test.ts') ? [path] : [];
  });
}

/** Every literal handed to a notification, with its `${…}` filled by a plain word. */
function serverSentences(): string[] {
  const found = new Set<string>();
  for (const file of sources(API)) {
    const source = readFileSync(file, 'utf8');
    const calls = [
      ...source.matchAll(/createNotification\(\{([\s\S]{0,520}?)\}\)/g),
      ...source.matchAll(/this\.(?:tell|notify)\(\s*[\w.[\]]+,\s*([\s\S]{0,320}?)\);/g),
    ];
    for (const call of calls) {
      for (const literal of call[1].matchAll(/`([^`]*)`|'([^'\n]{6,})'/g)) {
        const text = (literal[1] ?? literal[2]).replace(/\$\{[^}]*\}/g, '2').trim();
        // Links, channels and identifiers are not sentences; some are written in Greek already.
        if (/^\/|^[a-z_]+$/.test(text) || !/\s/.test(text) || /[α-ωά-ώ]/i.test(text)) continue;
        found.add(text);
      }
    }
  }
  return [...found];
}

describe('what the server writes into a notification', () => {
  it('has Greek for every sentence in the API', () => {
    const sentences = serverSentences();
    expect(sentences.length).toBeGreaterThan(25);
    // A founder's update is `name: title`, in the author's own words.
    const missing = sentences.filter((s) => notificationEl(s) === s && s !== '2: 2');
    expect(missing).toEqual([]);
  });

  it('keeps the names inside the sentence', () => {
    expect(notificationEl('New message from Elena')).toBe('Νέο μήνυμα από Elena');
    expect(notificationEl('Nikos shared 3 documents with you')).toBe('Nikos: κοινή χρήση 3 εγγράφων μαζί σας');
    expect(notificationEl('Terms v2 proposed for “Harbor CTO”')).toBe('Προτάθηκαν οι όροι v2 για «Harbor CTO»');
  });

  it('prefers the exact outcome over the general form', () => {
    expect(notificationEl('Proposal "Pricing": approved')).toBe('Η πρόταση «Pricing» εγκρίθηκε');
    expect(notificationEl('Your proposal for Harbor CTO was declined')).toBe('Η πρότασή σας για Harbor CTO απορρίφθηκε');
  });

  it('leaves a member’s own words alone', () => {
    expect(notificationEl('Elena: four clinics live')).toBe('Elena: four clinics live');
  });
});
