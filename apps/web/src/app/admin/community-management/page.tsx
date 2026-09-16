'use client';

import { useState } from 'react';
import { Users, Search, Layers, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const COMMUNITIES = [
  { id: '1', name: 'Climate Founders EU', members: 842, posts: 1204, status: 'active', growth: '+12%' },
  { id: '2', name: 'FinTech Builders', members: 1203, posts: 3891, status: 'active', growth: '+8%' },
  { id: '3', name: 'Demo Community', members: 12, posts: 3, status: 'review', growth: '—' },
];

export default function CommunityManagementPage() {
  const [search, setSearch] = useState('');
  const filtered = COMMUNITIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell
      title="Community management"
      description="Overview of groups — member counts, activity, and communities pending review."
      showHelp
    >
      <HelpCallout id="admin-community-management" title="Managing communities">
        <p>
          Communities with status <strong>review</strong> were flagged or auto-held for first-time creators.
          High post/member ratio indicates healthy engagement; low activity may need admin outreach.
        </p>
      </HelpCallout>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total communities', value: COMMUNITIES.length, icon: Layers },
          { label: 'Total members', value: COMMUNITIES.reduce((s, c) => s + c.members, 0), icon: Users },
          { label: 'Pending review', value: COMMUNITIES.filter((c) => c.status === 'review').length, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="icon-md text-muted-foreground" />
                    <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
        ))}
                    </div>

      <div className="relative mt-4 max-w-md">
        <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities…"
          className="pl-9"
        />
                  </div>
                  
      <Card className="mt-4">
        {filtered.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted-foreground">
                {c.members.toLocaleString('en-GB')} members · {c.posts.toLocaleString('en-GB')} posts · {c.growth} growth
              </p>
                          </div>
            <Badge variant="outline" className="capitalize">{c.status}</Badge>
                            </div>
        ))}
                      </Card>
    </AppShell>
  );
}
