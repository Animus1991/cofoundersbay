'use client';

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MEMBER_GROWTH = [
  { month: 'Oct', members: 98 },
  { month: 'Nov', members: 112 },
  { month: 'Dec', members: 125 },
  { month: 'Jan', members: 134 },
  { month: 'Feb', members: 145 },
  { month: 'Mar', members: 156 },
];

const PROGRAM_ENGAGEMENT = [
  { name: 'Spring Accel', sessions: 24, milestones: 18 },
  { name: 'AI Lab', sessions: 12, milestones: 8 },
  { name: 'Bootcamp', sessions: 32, milestones: 28 },
];

export function MemberGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={MEMBER_GROWTH} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="memberFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="members" stroke="hsl(var(--primary))" fill="url(#memberFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProgramEngagementChart() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={PROGRAM_ENGAGEMENT} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessions" />
        <Bar dataKey="milestones" fill="#4ade80" radius={[4, 4, 0, 0]} name="Milestones" />
      </BarChart>
    </ResponsiveContainer>
  );
}
