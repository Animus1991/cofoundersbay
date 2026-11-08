/**
 * The curated feed's order (docs §116). Every source is already real: an
 * update, a person, a need, an event, a programme, a post. What the page adds
 * is the mix, so that one busy source does not fill the screen.
 */
export type FeedKind = 'update' | 'member' | 'need' | 'event' | 'person' | 'program' | 'post';

export type FeedItem = {
  id: string;
  kind: FeedKind;
  /** Orders entries of one kind, newest or best first. */
  at: number;
  /** Why this is here, in a few words: the line above the title. */
  why: { en: string; el: string };
  title: string;
  /** Who or what: a name, a place, a date. */
  subtitle?: string;
  body?: string;
  mark: { name: string; src?: string | null; square?: boolean };
  image?: string | null;
  href: string;
  action: { en: string; el: string };
  /** An instant to show as "2 hours ago"; a coming event says its date in `subtitle` instead. */
  when?: string | null;
};

/** The turn each kind takes: what founders say first, then who joined, what is open. */
const ROTATION: FeedKind[] = ['update', 'member', 'need', 'event', 'person', 'program', 'post'];

/**
 * One of each kind in turn, the best of each first. Not by date across kinds:
 * a suggested person has no date to compare with a founder's update, and the
 * kinds that have one would always bury the kinds that do not.
 */
export function curateFeed(items: readonly FeedItem[], limit = 12): FeedItem[] {
  const queues = ROTATION.map((kind) => items.filter((item) => item.kind === kind).sort((a, b) => b.at - a.at));
  const picked: FeedItem[] = [];
  while (picked.length < limit && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && picked.length < limit) picked.push(next);
    }
  }
  return picked;
}
