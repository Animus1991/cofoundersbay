'use client';

import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

type RadarDatum = { dimension: string; score: number; benchmark: number };
type HistoryDatum = { week: string; score: number; accel: number; invest: number };

const TOOLTIP_STYLE = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12.2412,
};

export function ReadinessRadarChartInner({
  data,
  scoreName = 'Your Score',
  benchmarkName = 'Benchmark',
  height = 280,
}: {
  data: RadarDatum[];
  scoreName?: string;
  benchmarkName?: string;
  /** `'100%'` lets the radar grow into a card that has height to spare; the
      wrapper must then resolve a height of its own (flex-1 + min-h). */
  height?: number | string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid className="stroke-border/40" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12.2412, fill: 'hsl(var(--muted-foreground))' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 12.2412 }} tickCount={4} />
        <Radar name={scoreName} dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
        <Radar name={benchmarkName} dataKey="benchmark" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
        <RechartsTooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(val: number, name: string) => [`${val}%`, name]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ScoreHistoryChartInner({
  history,
  overallName = 'Overall',
  acceleratorName = 'Accelerator',
  investorName = 'Investor',
}: {
  history: HistoryDatum[];
  overallName?: string;
  acceleratorName?: string;
  investorName?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={history} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis dataKey="week" tick={{ fontSize: 12.2412 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12.2412 }} />
        <RechartsTooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(val: number, name: string) => [`${val}%`, name]}
        />
        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name={overallName} />
        <Line type="monotone" dataKey="accel" stroke="hsl(var(--status-accent-mark))" strokeWidth={2} dot={{ r: 2.5 }} name={acceleratorName} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="invest" stroke="hsl(var(--status-success-mark))" strokeWidth={2} dot={{ r: 2.5 }} name={investorName} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
