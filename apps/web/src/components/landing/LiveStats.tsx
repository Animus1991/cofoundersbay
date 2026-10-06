'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { getPublicStats, type PublicStats } from '@/lib/api';
import { qk } from '@/lib/query-keys';

/**
 * The landing page's counts, measured by `GET /api/public/stats` (the demo
 * world answers it with the demo's own people). Nothing numeric renders
 * while loading or when the endpoint is unreachable: a number that is not
 * measured is worse than no number.
 */
export function usePublicStats() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const query = useQuery({
    queryKey: qk('public-stats'),
    queryFn: getPublicStats,
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return query.data ?? null;
}

const number = (n: number) => n.toLocaleString();

/** The hero's three-tile strip. Absent until the counts arrive. */
export function LiveStatsStrip() {
  const stats = usePublicStats();
  if (!stats) return null;
  const items: Array<{ value: string; label: { en: string; el: string } }> = [
    { value: number(stats.members), label: { en: 'Active members', el: 'Ενεργά μέλη' } },
    { value: number(stats.connections), label: { en: 'Connections made', el: 'Συνδέσεις' } },
    { value: number(stats.events), label: { en: 'Events hosted', el: 'Εκδηλώσεις' } },
  ];
  return (
    <div className="mt-16 w-full animate-fade-in" style={{ animationDelay: '400ms' }}>
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {items.map(({ value, label }) => (
          <div key={label.en} className="rounded-xl border border-border bg-card/50 p-4 text-center backdrop-blur-sm">
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <BilingualText en={label.en} el={label.el} compact />
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-2xs text-muted-foreground">
        <BilingualText en="Live counts · measured today" el="Μετρημένα σήμερα" compact />
      </p>
    </div>
  );
}

const TILES: Array<{ key: keyof Omit<PublicStats, 'measuredAt'>; label: { en: string; el: string }; sub: { en: string; el: string } }> = [
  { key: 'members', label: { en: 'Registered Members', el: 'Εγγεγραμμένα μέλη' }, sub: { en: 'founders, mentors & investors', el: 'ιδρυτές, μέντορες & επενδυτές' } },
  { key: 'connections', label: { en: 'Successful Connections', el: 'Επιτυχημένες συνδέσεις' }, sub: { en: 'meaningful introductions made', el: 'ουσιαστικές γνωριμίες' } },
  { key: 'mentors', label: { en: 'Mentors Available', el: 'Διαθέσιμοι μέντορες' }, sub: { en: 'mentor, advisor, coach & course roles', el: 'ρόλοι μέντορα, συμβούλου & coach' } },
  { key: 'events', label: { en: 'Events Hosted', el: 'Εκδηλώσεις' }, sub: { en: 'online & in-person', el: 'διαδικτυακές & δια ζώσης' } },
  { key: 'organizations', label: { en: 'Partner Organizations', el: 'Συνεργαζόμενοι οργανισμοί' }, sub: { en: 'incubators & accelerators', el: 'θερμοκοιτίδες & επιταχυντές' } },
];

/** The "By the numbers" grid. Absent until the counts arrive. */
export function LiveStatsGrid() {
  const stats = usePublicStats();
  if (!stats) return null;
  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TILES.map(({ key, label, sub }, index) => (
          <div
            key={key}
            className="animate-fade-in rounded-2xl border border-border bg-card/80 p-6 text-center backdrop-blur-sm"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="font-display text-4xl font-bold text-primary-accessible">{number(stats[key])}</p>
            <p className="mt-2 font-semibold text-foreground"><BilingualText en={label.en} el={label.el} compact /></p>
            <p className="mt-1 text-xs text-muted-foreground"><BilingualText en={sub.en} el={sub.el} wrap /></p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        <BilingualText en="Live counts, measured today" el="Μετρημένα σήμερα" wrap />
      </p>
    </>
  );
}
