'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  MoreVertical,
  Video,
  Building,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyOrgEvents } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

type OrgEvent = {
  id: string;
  title: string;
  type: 'workshop' | 'demo_day' | 'networking' | 'mentorship' | 'keynote';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  date: string;
  time: string;
  format: 'online' | 'in-person' | 'hybrid';
  location: string;
  attendees: number;
  capacity: number;
  speakers?: string[];
  description: string;
};

const TYPE_CONFIG: Record<OrgEvent['type'], { label: string; tone: StatusTone }> = {
  workshop: { label: 'Workshop', tone: 'info' },
  demo_day: { label: 'Demo Day', tone: 'accent' },
  networking: { label: 'Networking', tone: 'success' },
  mentorship: { label: 'Mentorship', tone: 'warning' },
  keynote: { label: 'Keynote', tone: 'danger' },
};

const STATUS_CONFIG: Record<OrgEvent['status'], { label: string; tone: StatusTone }> = {
  upcoming: { label: 'Upcoming', tone: 'info' },
  ongoing: { label: 'Live', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

const MOCK_EVENTS: OrgEvent[] = [
  {
    id: '1',
    title: 'Spring Demo Day 2025',
    type: 'demo_day',
    status: 'upcoming',
    date: 'Apr 15, 2025',
    time: '10:00 AM – 4:00 PM',
    format: 'hybrid',
    location: 'HQ + Zoom',
    attendees: 87,
    capacity: 200,
    speakers: ['Jane Doe (Partner, Sequoia)', 'Tom A. (CEO, TechCorp)'],
    description: 'Cohort 7 final showcase. 12 startups presenting to 50+ investors.',
  },
  {
    id: '2',
    title: 'Fundraising Masterclass',
    type: 'workshop',
    status: 'upcoming',
    date: 'Apr 22, 2025',
    time: '2:00 PM – 5:00 PM',
    format: 'online',
    location: 'Zoom',
    attendees: 34,
    capacity: 50,
    speakers: ['Michael Chen (Angel Investor)'],
    description: 'Deep dive on SAFE notes, cap table management, and Series A readiness.',
  },
  {
    id: '3',
    title: 'Mentor Speed Dating',
    type: 'mentorship',
    status: 'ongoing',
    date: 'Apr 10, 2025',
    time: '3:00 PM – 6:00 PM',
    format: 'in-person',
    location: 'Innovation Hub, Room 4B',
    attendees: 24,
    capacity: 30,
    speakers: [],
    description: 'Rotating 15-min sessions with cohort mentors.',
  },
  {
    id: '4',
    title: 'Cohort 6 Graduation',
    type: 'demo_day',
    status: 'completed',
    date: 'Mar 28, 2025',
    time: '11:00 AM – 3:00 PM',
    format: 'hybrid',
    location: 'Event Center + Stream',
    attendees: 156,
    capacity: 200,
    speakers: [],
    description: '10 graduating startups, 3 received follow-on funding.',
  },
];

function EventCard({ event }: { event: OrgEvent }) {
  const typeCfg = TYPE_CONFIG[event.type];
  const statusCfg = STATUS_CONFIG[event.status];
  const typeColors = STATUS[typeCfg.tone];
  const statusColors = STATUS[statusCfg.tone];
  const fill = Math.round((event.attendees / event.capacity) * 100);
  const fillColor = fill >= 90 ? STATUS.danger.icon : fill >= 70 ? STATUS.warning.icon : STATUS.success.icon;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{event.title}</h3>
              <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                {event.status === 'ongoing' && <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full animate-pulse bg-status-success')} />}
                {statusCfg.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />{event.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="icon-sm" />{event.time}
              </span>
              <span className="flex items-center gap-1">
                {event.format === 'online' ? <Video className="icon-sm" /> : <Building className="icon-sm" />}
                {event.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />{event.attendees}/{event.capacity} attending
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
            {event.speakers && event.speakers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {event.speakers.map(sp => (
                  <Badge key={sp} variant="secondary" className="text-xs">{sp}</Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary" className={cn('text-xs border', typeColors.chip)}>{typeCfg.label}</Badge>
              <span className="text-xs text-muted-foreground">
                Capacity: <span className={cn('font-medium', fillColor)}>{fill}% full</span>
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Edit className="mr-2 icon-sm" />Edit</DropdownMenuItem>
              <DropdownMenuItem><Copy className="mr-2 icon-sm" />Duplicate</DropdownMenuItem>
              <DropdownMenuItem><ExternalLink className="mr-2 icon-sm" />View Public Page</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive-accessible"><Trash2 className="mr-2 icon-sm" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgEventsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filtered = MOCK_EVENTS.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !search || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || e.status === activeTab || (activeTab === 'active' && ['upcoming', 'ongoing'].includes(e.status));
    return matchesSearch && matchesTab;
  });

  const upcoming = MOCK_EVENTS.filter(e => e.status === 'upcoming').length;
  const totalAttendees = MOCK_EVENTS.reduce((s, e) => s + e.attendees, 0);

  const filtersActive = !!search || activeTab !== 'all';
  const clearFilters = () => { setSearch(''); setActiveTab('all'); };

  return (
    <AppShell
      title="Organization Events"
      description="Demo days, office hours, workshops, and pitch nights for your cohorts. Members RSVP automatically."
      actions={(
        <Button asChild>
          <Link href="/events/create">
            <Plus className="mr-2 icon-sm" />
            Create Event
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Upcoming Events', value: upcoming, icon: Calendar },
            { label: 'Total Attendees (all)', value: totalAttendees, icon: Users },
            { label: 'Events This Month', value: MOCK_EVENTS.filter(e => e.status !== 'cancelled').length, icon: CheckCircle },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary-accessible" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Tabs */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({MOCK_EVENTS.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({upcoming + MOCK_EVENTS.filter(e => e.status === 'ongoing').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({MOCK_EVENTS.filter(e => e.status === 'completed').length})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
            {filtered.length === 0 && (
              <EmptyOrgEvents filtersActive={filtersActive} onClearFilters={clearFilters} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
