'use client';

import Link from 'next/link';
import { GraduationCap, Calendar, Star, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MENTORS = [
  { name: 'Jane Smith', mentees: 8, sessions: 42, rating: 4.9, status: 'active' },
  { name: 'Alex Chen', mentees: 5, sessions: 28, rating: 4.7, status: 'active' },
  { name: 'Pending Applicant', mentees: 0, sessions: 0, rating: 0, status: 'pending' },
];

export default function MentorshipManagementPage() {
  return (
    <AppShell
      title="Mentorship management"
      description="Approve mentor applications, monitor session quality, and spot inactive mentors."
      showHelp
    >
      <HelpCallout id="admin-mentorship" title="Mentorship oversight">
        <p>
          <strong>Pending</strong> mentors need profile and credential review before appearing in /mentoring.
          Session count and rating help identify top contributors vs. inactive listings.
        </p>
      </HelpCallout>

      <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-3">
        {[
          { label: 'Active mentors', value: 2, icon: GraduationCap },
          { label: 'Sessions (30d)', value: 70, icon: Calendar },
          { label: 'Avg. rating', value: '4.8', icon: Star },
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Mentor roster</CardTitle>
                      </CardHeader>
        <CardContent className="space-y-3">
          {MENTORS.map((m) => (
            <div key={m.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground">
                  {m.mentees} mentees · {m.sessions} sessions
                  {m.rating > 0 && ` · ${m.rating}★`}
                </p>
                          </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{m.status}</Badge>
                {m.status === 'pending' && (
                  // Had no handler; applications are reviewed where roles are set.
                  <Button size="sm" asChild>
                    <Link href="/admin/user-management">Review application</Link>
                  </Button>
                          )}
                        </div>
                          </div>
          ))}
                      </CardContent>
                    </Card>
    </AppShell>
  );
}
