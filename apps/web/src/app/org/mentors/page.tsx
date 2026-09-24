'use client';

import { useMemo, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { getOrgMentorPool, type OrgMentorPoolItem } from '@/lib/api';
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
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';

/**
 * The page's own row from the pool row.
 *
 * `/api/organizations/:id/mentors` existed but returned bare rows with no
 * profile, so this page could not have named a mentor even if it had called
 * it. The endpoint joins the person now; sessions and rating stay absent
 * because the pool records neither.
 */
function toPageMentor(row: OrgMentorPoolItem): Mentor {
  return {
    id: row.id,
    userId: row.userId,
    name: row.displayName ?? 'Unnamed mentor',
    avatar: row.avatarUrl ?? undefined,
    headline: row.headline ?? undefined,
    expertise: row.expertiseAreas,
    activeMentees: row.currentMentees,
    maxMentees: row.maxMentees ?? 0,
    totalSessions: 0,
    status: row.isActive ? 'active' : 'inactive',
    isVerified: false,
  };
}

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
              <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/p/${mentor.userId}`} className="font-medium hover:text-primary-accessible transition-colors">
                    {mentor.name}
                  </Link>
                  {mentor.isVerified && (
                    <CheckCircle2 className="icon-sm text-primary-accessible" />
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
                    <Button aria-label="More options" variant="ghost" size="icon">
                      <MoreVertical className="icon-sm" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/p/${mentor.userId}`}>View Profile</Link>
                    </DropdownMenuItem>
                    <UnavailableMenuItem en="Assign to Startup" el="Ανάθεση σε startup" reasonEn="Mentor assignments are not stored yet." reasonEl="Οι αναθέσεις μεντόρων δεν αποθηκεύονται ακόμη." />
                    <UnavailableMenuItem en="View Sessions" el="Συνεδρίες" reasonEn="No organisation-wide session view yet." reasonEl="Δεν υπάρχει ακόμη προβολή συνεδριών ανά οργανισμό." />
                    <DropdownMenuItem asChild>
                      <Link href={`/messages?to=${mentor.userId}`}>Send Message</Link>
                    </DropdownMenuItem>
                    <UnavailableMenuItem className="text-destructive-accessible" en="Remove from Pool" el="Αφαίρεση από τη δεξαμενή" reasonEn="The pool is read from mentor profiles; there is no pool membership to remove." reasonEl="Η δεξαμενή προκύπτει από τα προφίλ μεντόρων· δεν υπάρχει συμμετοχή για αφαίρεση." />
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
                <Users className="icon-sm" aria-hidden="true" />
                {mentor.activeMentees}/{mentor.maxMentees} mentees
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="icon-sm" aria-hidden="true" />
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

/** Shown to an organisation whose mentor pool is empty. */
const SEED_MENTORS: Mentor[] = [
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

export default function OrgMentorsPage() {
  const [search, setSearch] = useState('');

  // Mock data
  /*
   * The organisation's real pool. The seed below is what an organisation
   * with an empty pool sees, so the screen still teaches its shape.
   */
  const { membership } = useCurrentOrg();
  const organizationId = membership?.organizationId ?? null;
  const { data, isLoading } = useQuery({
    queryKey: ['org', 'mentor-pool', organizationId],
    queryFn: () => getOrgMentorPool(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 0,
  });

  const live = useMemo(() => (data?.mentors ?? []).map(toPageMentor), [data]);
  const mentors: Mentor[] = live.length > 0 ? live : isLoading ? [] : SEED_MENTORS;


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
      description="Manage mentors available to your cohorts. Find them in the platform's mentor directory."
      actions={(
        // Linked to /org/mentors/invite, which never existed, and promised
        // email invites no endpoint sends. The directory is where a mentor is
        // found today.
        <Button asChild>
          <Link href="/mentoring">
            <Plus className="mr-2 icon-sm" aria-hidden="true" />
            Find a mentor to invite
          </Link>
        </Button>
      )}
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
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
