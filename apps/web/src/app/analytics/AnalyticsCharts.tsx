'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, Download } from 'lucide-react';
import type { AnalyticsEngagement } from '@/lib/api';
import { useChartTheme } from '@/lib/chart-theme';

interface ProfileView {
  date: string;
  views: number;
  uniqueVisitors: number;
}

const DEMO_AREA_DATA = [
  { date: 'Mon', views: 12, unique: 8,  connections: 2 },
  { date: 'Tue', views: 19, unique: 14, connections: 5 },
  { date: 'Wed', views: 8,  unique: 6,  connections: 3 },
  { date: 'Thu', views: 24, unique: 18, connections: 7 },
  { date: 'Fri', views: 18, unique: 13, connections: 4 },
  { date: 'Sat', views: 31, unique: 22, connections: 9 },
  { date: 'Sun', views: 27, unique: 20, connections: 6 },
];

const DEMO_BAR_DATA = [
  { name: 'Connections', value: 18 },
  { name: 'Messages',    value: 34 },
  { name: 'Likes',       value: 12 },
  { name: 'Comments',    value: 8  },
  { name: 'Shares',      value: 5  },
];



const TOOLTIP_STYLE = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
};

export function ProfileViewsChart({ data }: { data: ProfileView[] }) {
  const theme = useChartTheme();
  const chartData = data.length > 0
    ? data.map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
        views: d.views,
        unique: d.uniqueVisitors,
        connections: Math.round(d.views * 0.08),
      }))
    : DEMO_AREA_DATA;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="icon-sm" aria-hidden="true" />Profile Views Trend
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Download className="icon-2xs" aria-hidden="true" />Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={theme.series[0]} stopOpacity={0.25} />
                <stop offset="95%" stopColor={theme.series[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="views"  stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorViews)"  name="Views" />
            <Area type="monotone" dataKey="unique" stroke={theme.series[0]}             strokeWidth={2} fill="url(#colorUnique)" name="Unique" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EngagementBreakdown({ engagement }: { engagement?: AnalyticsEngagement }) {
  const theme = useChartTheme();
  const barData = [
    { name: 'Connections', value: engagement?.connections ?? DEMO_BAR_DATA[0].value },
    { name: 'Messages',    value: engagement?.messages    ?? DEMO_BAR_DATA[1].value },
    { name: 'Likes',       value: engagement?.likes       ?? DEMO_BAR_DATA[2].value },
    { name: 'Comments',    value: engagement?.comments    ?? DEMO_BAR_DATA[3].value },
    { name: 'Shares',      value: engagement?.shares      ?? DEMO_BAR_DATA[4].value },
  ];
  const pieData = barData.map((d) => ({ name: d.name, value: d.value }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="icon-sm" aria-hidden="true" />Engagement by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={theme.series[i % theme.series.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <PieChart className="icon-sm" aria-hidden="true" />Engagement Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <RechartsPie>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={theme.series[i % theme.series.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </RechartsPie>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
