'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  GraduationCap,
  Target,
  MessageCircle,
  Link2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Clock3,
  MoreVertical,
  Download,
  Share2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Types
interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'mentor' | 'investor';
  startup?: string;
  status: 'active' | 'inactive' | 'pending';
  avatarUrl?: string;
  joinDate: string;
  location?: string;
  phone?: string;
  progress?: number;
}

interface Match {
  id: string;
  participant1: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  participant2: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  matchScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  matchedDate: string;
  interactions: number;
  lastInteraction?: string;
}

interface MentoringSession {
  id: string;
  mentor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  mentee: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  topic: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  rating?: number;
  notes?: string;
}

interface CohortStats {
  totalParticipants: number;
  activeStartups: number;
  totalMentors: number;
  completedSessions: number;
  upcomingSessions: number;
  totalMatches: number;
  successfulMatches: number;
  averageMatchScore: number;
}

// Mock data
const DEMO_COHORT = {
  id: '1',
  name: 'Spring 2026 Accelerator',
  program: 'CoFounderBay Accelerator',
  status: 'active',
  startDate: '2026-03-01',
  endDate: '2026-06-01',
  description: 'A 12-week intensive program for early-stage startups focusing on product-market fit, growth strategies, and fundraising.',
  location: 'San Francisco, CA',
};

const DEMO_PARTICIPANTS: Participant[] = [
  {
    id: '1',
    name: 'Elena Papadopoulos',
    email: 'elena@techstart.io',
    role: 'founder',
    startup: 'TechStart',
    status: 'active',
    joinDate: '2026-03-01',
    location: 'Athens, Greece',
    phone: '+30 210 123 4567',
    progress: 75,
  },
  {
    id: '2',
    name: 'Marcus Chen',
    email: 'marcus@devstack.com',
    role: 'founder',
    startup: 'DevStack',
    status: 'active',
    joinDate: '2026-03-01',
    location: 'San Francisco, CA',
    phone: '+1 415 555 0123',
    progress: 60,
  },
  {
    id: '3',
    name: 'Dr. Sarah Kim',
    email: 'sarah@mentorpro.com',
    role: 'mentor',
    status: 'active',
    joinDate: '2026-03-01',
    location: 'Palo Alto, CA',
    phone: '+1 650 555 0456',
  },
  {
    id: '4',
    name: 'Alex Dimitriou',
    email: 'alex@investor.vc',
    role: 'investor',
    status: 'active',
    joinDate: '2026-03-15',
    location: 'London, UK',
    phone: '+44 20 7946 0958',
  },
];

const DEMO_MATCHES: Match[] = [
  {
    id: '1',
    participant1: {
      id: '1',
      name: 'Elena Papadopoulos',
      role: 'Founder',
    },
    participant2: {
      id: '3',
      name: 'Dr. Sarah Kim',
      role: 'Mentor',
    },
    matchScore: 92,
    status: 'accepted',
    matchedDate: '2026-03-05',
    interactions: 12,
    lastInteraction: '2026-03-26',
  },
  {
    id: '2',
    participant1: {
      id: '2',
      name: 'Marcus Chen',
      role: 'Founder',
    },
    participant2: {
      id: '4',
      name: 'Alex Dimitriou',
      role: 'Investor',
    },
    matchScore: 85,
    status: 'pending',
    matchedDate: '2026-03-27',
    interactions: 2,
  },
];

const DEMO_MENTORING_SESSIONS: MentoringSession[] = [
  {
    id: '1',
    mentor: {
      id: '3',
      name: 'Dr. Sarah Kim',
    },
    mentee: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    topic: 'Product Strategy & Market Fit',
    scheduledDate: '2026-03-28T14:00:00Z',
    duration: 60,
    status: 'scheduled',
  },
  {
    id: '2',
    mentor: {
      id: '3',
      name: 'Dr. Sarah Kim',
    },
    mentee: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    topic: 'Fundraising Strategy',
    scheduledDate: '2026-03-20T15:00:00Z',
    duration: 90,
    status: 'completed',
    rating: 5,
    notes: 'Excellent session. Discussed Series A preparation and investor outreach.',
  },
];

const DEMO_STATS: CohortStats = {
  totalParticipants: 24,
  activeStartups: 12,
  totalMentors: 8,
  completedSessions: 45,
  upcomingSessions: 12,
  totalMatches: 18,
  successfulMatches: 15,
  averageMatchScore: 87,
};

export default function CohortDetailPage() {
  const params = useParams();
  const cohortId = params?.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  const cohort = DEMO_COHORT;
  const participants = DEMO_PARTICIPANTS;
  const matches = DEMO_MATCHES;
  const sessions = DEMO_MENTORING_SESSIONS;
  const stats = DEMO_STATS;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      active: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      pending: { variant: 'outline', className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
      scheduled: { variant: 'outline', className: 'bg-blue-50 text-blue-800 border-blue-200' },
      completed: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { variant: 'destructive', className: '' },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      founder: 'bg-blue-100 text-blue-800 border-blue-200',
      mentor: 'bg-purple-100 text-purple-800 border-purple-200',
      investor: 'bg-amber-100 text-amber-800 border-amber-200',
    };

    return (
      <Badge variant="outline" className={colors[role] || colors.founder}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <AppShell
      title={cohort.name}
      description={`${cohort.program} • ${formatDate(cohort.startDate)} - ${formatDate(cohort.endDate)}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="icon-sm mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="icon-sm mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Mail className="icon-sm mr-2" />
            Message All
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">
            Participants ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="matches">
            Matches ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="mentoring">
            Mentoring ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                  <Users className="icon-sm text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeStartups} active startups • {stats.totalMentors} mentors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mentoring Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.completedSessions}</div>
                  <GraduationCap className="icon-sm text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.upcomingSessions} upcoming sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Successful Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {stats.successfulMatches}/{stats.totalMatches}
                  </div>
                  <Target className="icon-sm text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. score: {stats.averageMatchScore}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Program Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">67%</div>
                  <TrendingUp className="icon-sm text-green-500" />
                </div>
                <Progress value={67} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Cohort Info */}
          <Card>
            <CardHeader>
              <CardTitle>About This Cohort</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{cohort.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="icon-sm text-muted-foreground" />
                  <span className="text-sm">
                    {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="icon-sm text-muted-foreground" />
                  <span className="text-sm">{cohort.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="icon-sm text-muted-foreground" />
                  <span className="text-sm">{cohort.program}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.slice(0, 3).map((match) => (
                    <div key={match.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex -space-x-2">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback>
                            {match.participant1.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback>
                            {match.participant2.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {match.participant1.name} ↔ {match.participant2.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Match score: {match.matchScore}% • {match.interactions} interactions
                        </p>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions
                    .filter((s) => s.status === 'scheduled')
                    .slice(0, 3)
                    .map((session) => (
                      <div key={session.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {session.mentor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.mentor.name} → {session.mentee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(session.scheduledDate)} • {session.duration} min
                          </p>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Participants</CardTitle>
              <Button size="sm">
                <Users className="icon-sm mr-2" />
                Add Participant
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(participant.role)}</TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="icon-sm" />
                          {participant.location}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(participant.joinDate)}</TableCell>
                      <TableCell>
                        {participant.progress !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Progress value={participant.progress} className="w-20" />
                            <span className="text-xs">{participant.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-label="More options" variant="ghost" size="icon">
                              <MoreVertical className="icon-sm" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Send Message</DropdownMenuItem>
                            <DropdownMenuItem>View Progress</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matches</CardTitle>
              <Button size="sm">
                <Target className="icon-sm mr-2" />
                Generate Matches
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex -space-x-3">
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarFallback className="text-lg">
                          {match.participant1.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarFallback className="text-lg">
                          {match.participant2.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {match.participant1.name} ↔ {match.participant2.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.participant1.role} • {match.participant2.role}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Matched: {formatDate(match.matchedDate)}</span>
                        <span>•</span>
                        <span>{match.interactions} interactions</span>
                        {match.lastInteraction && (
                          <>
                            <span>•</span>
                            <span>Last: {formatDate(match.lastInteraction)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{match.matchScore}%</div>
                        <div className="text-xs text-muted-foreground">Match Score</div>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentoring">
          <div className="space-y-6">
            {/* Mentoring Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Upcoming
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1">
                    <div className="text-2xl font-bold">4.8</div>
                    <Star className="icon-sm text-yellow-500 fill-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sessions List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Sessions</CardTitle>
                <Button size="sm">
                  <Calendar className="icon-sm mr-2" />
                  Schedule Session
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Mentee</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {session.mentor.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{session.mentor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {session.mentee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{session.mentee.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{session.topic}</TableCell>
                        <TableCell>{formatDate(session.scheduledDate)}</TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          {session.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="icon-sm text-yellow-500 fill-yellow-500" />
                              <span>{session.rating}/5</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
