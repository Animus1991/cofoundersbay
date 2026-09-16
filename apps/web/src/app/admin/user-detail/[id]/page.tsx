'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Mail,
  MapPin,
  Shield,
  User,
  Calendar,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

const DEMO_USER = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'founder',
  status: 'active' as const,
  verified: true,
  location: 'Athens, GR',
  createdAt: '2024-01-15',
  lastActive: '2 hours ago',
  bio: 'Building a climate-tech startup. Looking for a technical co-founder.',
  stats: { connections: 42, posts: 18, sessions: 6 },
  moderation: { warnings: 0, reports: 0 },
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '1');
  const { success } = useToast();
  const user = { ...DEMO_USER, id };

  const initials =
    user.name
      .split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '??';

  return (
    <AppShell
      title={user.name}
      description="Admin view — account status, activity summary, and moderation controls."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/user-management">
            <ArrowLeft className="icon-sm mr-1.5" />
            Back to user list
          </Link>
        </Button>
      }
    >
      <HelpCallout id="admin-user-detail" title="Admin user detail">
        <p>
          Changes here affect platform access only — they do not delete the person&apos;s public profile
          history. Use <strong>Suspend</strong> for temporary lockout; contact support for permanent removal
          requests.
        </p>
      </HelpCallout>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={undefined} alt={user.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="capitalize">{user.role}</Badge>
              <Badge variant="outline" className="capitalize">{user.status}</Badge>
              {user.verified && <Badge>Verified</Badge>}
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button size="sm" className="w-full" onClick={() => success('Email queued', 'Demo only — no email sent.')}>
                <Mail className="icon-sm mr-2" /> Send email
              </Button>
              <Button size="sm" variant="outline" className="w-full" onClick={() => success('User suspended', 'Demo only.')}>
                <Ban className="icon-sm mr-2" /> Suspend account
              </Button>
              <Button size="sm" variant="outline" className="w-full" onClick={() => success('Role updated', 'Demo only.')}>
                <Shield className="icon-sm mr-2" /> Change role
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Connections', value: user.stats.connections, icon: User },
              { label: 'Posts', value: user.stats.posts, icon: Activity },
              { label: 'Sessions', value: user.stats.sessions, icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className="icon-md text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{user.bio}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="icon-sm" /> {user.location}
                  </div>
                  <dl className="grid grid-cols-2 gap-2 pt-2">
                    <dt className="text-muted-foreground">User ID</dt>
                    <dd className="font-mono text-xs">{id}</dd>
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd>{user.createdAt}</dd>
                    <dt className="text-muted-foreground">Last active</dt>
                    <dd>{user.lastActive}</dd>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Recent logins, messages, and profile edits appear here when connected to the audit API.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="moderation">
              <Card>
                <CardContent className="flex items-center gap-3 p-6">
                  <CheckCircle2 className="icon-lg text-status-success" />
                  <div>
                    <p className="font-medium">Clean record</p>
                    <p className="text-sm text-muted-foreground">
                      {user.moderation.warnings} warnings · {user.moderation.reports} open reports
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
