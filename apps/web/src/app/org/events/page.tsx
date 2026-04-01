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
import { cn } from '@/lib/utils';

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

const TYPE_CONFIG: Record<OrgEvent['type'], { label: string; color: string }> = {
  workshop: { label: 'Workshop', color: 'bg-blue-500/10 text-blue-600' },
  demo_day: { label: 'Demo Day', color: 'bg-purple-500/10 text-purple-600' },
  networking: { label: 'Networking', color: 'bg-green-500/10 text-green-600' },
  mentorship: { label: 'Mentorship', color: 'bg-amber-500/10 text-amber-600' },
  keynote: { label: 'Keynote', color: 'bg-red-500/10 text-red-600' },
};

const STATUS_CONFIG: Record<OrgEvent['status'], { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  ongoing: { label: 'Live', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  completed: { label: 'Completed', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
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
  const fill = Math.round((event.attendees / event.capacity) * 100);

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{event.title}</h3>
              <Badge variant="outline" className={cn('text-xs', statusCfg.color)}>
                {event.status === 'ongoing' && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
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
              <Badge variant="secondary" className={cn('text-xs', typeCfg.color)}>{typeCfg.label}</Badge>
              <span className="text-xs text-muted-foreground">
                Capacity: <span className={cn('font-medium', fill >= 90 ? 'text-red-500' : fill >= 70 ? 'text-amber-500' : 'text-green-500')}>{fill}% full</span>
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
              <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 icon-sm" />Delete</DropdownMenuItem>
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

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Organization Events
            </h1>
            <p className="text-muted-foreground">Manage workshops, demo days, and cohort events</p>
          </div>
          <Button asChild>
            <Link href="/events/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>

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
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Tabs */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-medium">No events found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create your first event to get started</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/events/create">Create Event</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
