'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Plus,
  Star,
  Users,
  Calendar,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyOrgMentors } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

type Mentor = {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  headline?: string;
  expertise: string[];
  activeMentees: number;
  maxMentees: number;
  totalSessions: number;
  rating?: number;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
};

const MENTOR_STATUS_TONE: Record<Mentor['status'], StatusTone> = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
};

function MentorCard({ mentor }: { mentor: Mentor }) {
  const initials = mentor.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  const statusColors = STATUS[MENTOR_STATUS_TONE[mentor.status]];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Link href={`/p/${mentor.userId}`}>
            <Avatar className="icon-md">
              <AvatarImage src={mentor.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/p/${mentor.userId}`} className="font-medium hover:text-primary transition-colors">
                    {mentor.name}
                  </Link>
                  {mentor.isVerified && (
                    <CheckCircle2 className="icon-sm text-primary" />
                  )}
                </div>
                {mentor.headline && (
                  <p className="text-sm text-muted-foreground">{mentor.headline}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs border', statusColors.chip)}>
                  {mentor.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="icon-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/p/${mentor.userId}`}>View Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Assign to Startup</DropdownMenuItem>
                    <DropdownMenuItem>View Sessions</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Remove from Pool</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {mentor.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {mentor.expertise.slice(0, 4).map((exp) => (
                  <span
                    key={exp}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="icon-sm" />
                {mentor.activeMentees}/{mentor.maxMentees} mentees
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" />
                {mentor.totalSessions} sessions
              </span>
              {mentor.rating && (
                <span className="flex items-center gap-1">
                  <Star className={cn('icon-sm', STATUS.warning.icon)} />
                  {mentor.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrgMentorsPage() {
  const [search, setSearch] = useState('');

  // Mock data
  const mentors: Mentor[] = [
    {
      id: '1',
      userId: 'mentor1',
      name: 'Sarah Chen',
      headline: 'Former Google PM, AI/ML Expert',
      expertise: ['Product Strategy', 'AI/ML', 'Go-to-Market'],
      activeMentees: 3,
      maxMentees: 5,
      totalSessions: 45,
      rating: 4.9,
      status: 'active',
      isVerified: true,
    },
    {
      id: '2',
      userId: 'mentor2',
      name: 'Michael Torres',
      headline: 'Serial Entrepreneur, 2x Exit',
      expertise: ['Fundraising', 'Sales', 'Team Building'],
      activeMentees: 4,
      maxMentees: 4,
      totalSessions: 62,
      rating: 4.8,
      status: 'active',
      isVerified: true,
    },
    {
      id: '3',
      userId: 'mentor3',
      name: 'Emma Williams',
      headline: 'FinTech Expert, Ex-Stripe',
      expertise: ['FinTech', 'Payments', 'Compliance'],
      activeMentees: 2,
      maxMentees: 3,
      totalSessions: 28,
      rating: 4.7,
      status: 'active',
      isVerified: false,
    },
    {
      id: '4',
      userId: 'mentor4',
      name: 'David Kim',
      headline: 'Technical Architect',
      expertise: ['Engineering', 'Architecture', 'Scaling'],
      activeMentees: 0,
      maxMentees: 3,
      totalSessions: 15,
      status: 'inactive',
      isVerified: true,
    },
  ];

  const filteredMentors = mentors.filter((m) => {
    return !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise.some((e) => e.toLowerCase().includes(search.toLowerCase()));
  });

  const activeMentors = mentors.filter((m) => m.status === 'active');
  const totalCapacity = mentors.reduce((acc, m) => acc + m.maxMentees, 0);
  const currentMentees = mentors.reduce((acc, m) => acc + m.activeMentees, 0);

  return (
    <AppShell
      title="Mentor Pool"
      description="Manage mentors available to your cohorts. Invite by email or onboard from the platform directory."
      actions={(
        <Button asChild>
          <Link href="/org/mentors/invite">
            <Plus className="mr-2 icon-sm" />
            Invite Mentor
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Mentors</p>
              <p className="text-xl font-bold">{mentors.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className={cn('text-xl font-bold', STATUS.success.icon)}>{activeMentors.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="text-xl font-bold">{currentMentees}/{totalCapacity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-xl font-bold">
                {mentors.reduce((acc, m) => acc + m.totalSessions, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            placeholder="Search mentors by name or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Mentors List */}
        <div className="space-y-3">
          {filteredMentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
          {filteredMentors.length === 0 && (
            <EmptyOrgMentors filtersActive={!!search} onClearFilters={() => setSearch('')} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
