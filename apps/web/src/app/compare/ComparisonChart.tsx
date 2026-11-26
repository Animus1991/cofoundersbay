'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { matchAxisEl } from '@/lib/i18n/strings-matches';
import type { MatchBreakdownAxis } from '@/lib/api';

type CompareProfileMin = {
  id: string;
  displayName: string;
  /** The engine's own dimensions for this person and the reader; empty when it has none. */
  axes?: MatchBreakdownAxis[];
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

/**
 * Each person's match with the reader, dimension by dimension, as the
 * matching engine scored it (`/recommendations/vs/:id`, the breakdown
 * /matches/compare shows). The bars used to be the overall score plus a
 * `Math.sin` wiggle under five labels the engine never scored ("Skills
 * Match", "Stage Fit"…): invented numbers on the one chart meant to tell
 * people apart. A dimension a person was not scored on has no bar, and with
 * no breakdown at all there is no chart (§162).
 */
export function dimensionRows(profiles: CompareProfileMin[], say: (en: string, el: string) => string) {
  const axes = Array.from(
    new Map(profiles.flatMap((p) => p.axes ?? []).map((axis) => [axis.key, axis.label] as const)).entries(),
  );
  return axes.map(([key, label]) => {
    const entry: Record<string, string | number | null> = { dimension: say(label, matchAxisEl(label) ?? label) };
    profiles.forEach((p, i) => {
      entry[`profile${i}`] = p.axes?.find((a) => a.key === key)?.score ?? null;
    });
    return entry;
  });
}

export function ComparisonChart({ profiles }: { profiles: CompareProfileMin[] }) {
  const sayOne = useBilingualString();
  const data = dimensionRows(profiles, sayOne);
  if (!data.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="icon-md text-muted-foreground" aria-hidden="true" />
          <BilingualText en="Match by dimension" el="Αντιστοίχιση ανά διάσταση" compact />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(250, data.length * 56)}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="dimension" width={150} tick={{ fontSize: 12 }} />
            <Tooltip />
            {/* The legend names on the caption step, never louder than the
                card's title (recharts sets them at the root size). */}
            <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
            {profiles.map((p, i) => (
              <Bar
                key={p.id}
                dataKey={`profile${i}`}
                name={p.displayName}
                fill={COLORS[i]}
                radius={[0, 4, 4, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
