'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

const TILES: Array<{ key: keyof Omit<PublicStats, 'measuredAt'>; label: { en: string; el: string }; sub: { en: string; el: string } }> = [
  { key: 'members', label: { en: 'Registered Members', el: 'Εγγεγραμμένα μέλη' }, sub: { en: 'Founders, mentors & investors', el: 'Ιδρυτές, μέντορες & επενδυτές' } },
  { key: 'connections', label: { en: 'Accepted Connections', el: 'Αποδεκτές συνδέσεις' }, sub: { en: 'Requests both people accepted', el: 'Αιτήματα που αποδέχτηκαν και οι δύο' } },
  { key: 'mentors', label: { en: 'Mentors Available', el: 'Διαθέσιμοι μέντορες' }, sub: { en: 'Mentor, advisor, coach & course roles', el: 'Ρόλοι μέντορα, συμβούλου & coach' } },
  { key: 'events', label: { en: 'Events Listed', el: 'Εκδηλώσεις' }, sub: { en: 'Online & in-person', el: 'Διαδικτυακές & δια ζώσης' } },
  { key: 'organizations', label: { en: 'Organizations', el: 'Οργανισμοί' }, sub: { en: 'Incubators, accelerators & programmes here', el: 'Θερμοκοιτίδες, επιταχυντές & προγράμματα εδώ' } },
];

/**
 * The "By the numbers" section with its heading. The heading and the grid
 * arrive together, so an unreachable endpoint leaves no titled empty band.
 * Every label says what is counted: "Successful connections - meaningful
 * introductions" and "Partner organisations" claimed more than an accepted
 * request or an active organisation row.
 */
export function LiveStatsSection({ heading }: { heading: ReactNode }) {
  const stats = usePublicStats();
  if (!stats) return null;
  return (
    <section className="border-t border-border bg-primary/[0.03] px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto w-full">
        {heading}
        <LiveStatsGrid />
      </div>
    </section>
  );
}

/**
 * The "By the numbers" grid. Absent until the counts arrive. Stat cards:
 * a figure, what it counts and what that covers, centred, at the figure's
 * own size (the card anatomy leaves stat cards their display step).
 */
export function LiveStatsGrid() {
  const stats = usePublicStats();
  if (!stats) return null;
  return (
    <>
      {/* Two a row on a phone, the last across both: five cards one under
          another took about 750px of the phone's page for five numbers. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        {TILES.map(({ key, label, sub }, index) => (
          <div
            key={key}
            className="animate-fade-in rounded-2xl border border-border bg-card/80 p-4 text-center backdrop-blur-sm sm:p-6"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="font-display text-xl font-semibold text-foreground">{number(stats[key])}</p>
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
