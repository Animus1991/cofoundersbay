'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useChartTheme } from '@/lib/chart-theme';

interface RoleData { name: string; value: number }
interface EngagementData { name: string; value: number }

export function UserRoleChart({ data }: { data: RoleData[] }) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          // Direct labels: three of the light-mode slots sit below 3:1 against
          // the card surface, so identity is never carried by colour alone.
          label={({ name, percent }: { name: string; percent: number }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          dataKey="value"
          // 2px surface ring between adjacent segments.
          stroke={theme.surface}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={theme.series[index % theme.series.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={theme.tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EngagementChart({ data }: { data: EngagementData[] }) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={theme.axis}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis stroke={theme.axis} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip contentStyle={theme.tooltipStyle} cursor={{ fill: theme.grid, opacity: 0.35 }} />
        <Bar dataKey="value" fill={theme.series[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
