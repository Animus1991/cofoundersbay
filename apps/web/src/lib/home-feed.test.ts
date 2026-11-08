import { describe, expect, it } from 'vitest';
import { curateFeed, type FeedItem, type FeedKind } from './home-feed';

const item = (id: string, kind: FeedKind, at: number): FeedItem => ({
  id,
  kind,
  at,
  why: { en: 'w', el: 'w' },
  title: id,
  mark: { name: id },
  href: '/',
  action: { en: 'a', el: 'a' },
});

describe('the curated feed', () => {
  it('gives each kind a turn, founders\' updates first', () => {
    const out = curateFeed([item('p', 'post', 9), item('e', 'event', 8), item('m', 'member', 7), item('u', 'update', 1)]);
    expect(out.map((i) => i.id)).toEqual(['u', 'm', 'e', 'p']);
  });

  it('takes the newest of a kind first', () => {
    const out = curateFeed([item('old', 'post', 1), item('new', 'post', 3), item('mid', 'post', 2)]);
    expect(out.map((i) => i.id)).toEqual(['new', 'mid', 'old']);
  });

  it('does not let one busy source fill the screen', () => {
    const out = curateFeed([
      item('p1', 'post', 10), item('p2', 'post', 9), item('p3', 'post', 8),
      item('e1', 'event', 2), item('e2', 'event', 1),
    ]);
    expect(out.map((i) => i.id)).toEqual(['e1', 'p1', 'e2', 'p2', 'p3']);
  });

  it('shows what is left rather than hide it when only one kind remains', () => {
    const out = curateFeed([item('p1', 'post', 3), item('p2', 'post', 2), item('p3', 'post', 1)]);
    expect(out).toHaveLength(3);
  });

  it('stops at the limit', () => {
    expect(curateFeed(Array.from({ length: 20 }, (_, i) => item(`x${i}`, i % 2 ? 'post' : 'event', i)), 12)).toHaveLength(12);
  });

  it('does not change the list it was given', () => {
    const source = [item('a', 'post', 1), item('b', 'post', 2)];
    curateFeed(source);
    expect(source.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
