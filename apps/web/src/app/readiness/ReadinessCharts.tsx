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

export function ReadinessRadarChartInner({ data }: { data: RadarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid className="stroke-border/40" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} tickCount={4} />
        <Radar name="Your Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
        <Radar name="Benchmark" dataKey="benchmark" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
        <RechartsTooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          formatter={(val: number, name: string) => [`${val}%`, name]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ScoreHistoryChartInner({ history }: { history: HistoryDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={history} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <RechartsTooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          formatter={(val: number, name: string) => [`${val}%`, name]}
        />
        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
        <Line type="monotone" dataKey="accel" stroke="hsl(var(--status-accent-fg))" strokeWidth={2} dot={{ r: 2.5 }} name="Accelerator" strokeDasharray="4 2" />
        <Line type="monotone" dataKey="invest" stroke="hsl(var(--status-success-fg))" strokeWidth={2} dot={{ r: 2.5 }} name="Investor" strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
