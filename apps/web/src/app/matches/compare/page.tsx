'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDemoData } from '@/contexts/DemoDataContext';
import Link from 'next/link';
import {
  ArrowLeft, X, Plus, MessageSquare, UserPlus, Check, Minus,
  Brain, Zap, Target, Users, Clock, Globe, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppShell } from '@/components/layout/AppShell';
import { RoleBadge } from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';
import { ConnectButton, MessageButton } from '@/components/common/PersonActions';

type CompareUser = {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  headline: string;
  location: string;
  matchScore: number;
  skills: string[];
  interests: string[];
  workStyle: {
    label: string;
    value: number;
  }[];
  compatibility: {
    vision: number;
    skills: number;
    workStyle: number;
    values: number;
  };
  strengths: string[];
  potentialFrictions: string[];
  availability: string;
  experience: string;
};

const MOCK_USERS: CompareUser[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    avatar: undefined,
    role: 'founder',
    headline: 'Serial Entrepreneur | AI/ML Expert',
    location: 'San Francisco, CA',
    matchScore: 92,
    skills: ['Machine Learning', 'Python', 'Product Strategy', 'Fundraising', 'Team Building'],
    interests: ['AI', 'Climate Tech', 'B2B SaaS'],
    workStyle: [
      { label: 'Autonomy', value: 85 },
      { label: 'Collaboration', value: 70 },
      { label: 'Structure', value: 60 },
      { label: 'Innovation', value: 95 },
    ],
    compatibility: { vision: 95, skills: 88, workStyle: 90, values: 94 },
    strengths: ['Strong technical background', 'Previous exit experience', 'Excellent network'],
    potentialFrictions: ['Prefers async communication', 'High autonomy preference'],
    availability: 'Full-time',
    experience: '10+ years',
  },
  {
    id: 'u2',
    name: 'Mike Ross',
    avatar: undefined,
    role: 'founder',
    headline: 'Full-Stack Developer | Startup Veteran',
    location: 'New York, NY',
    matchScore: 87,
    skills: ['React', 'Node.js', 'System Design', 'DevOps', 'Agile'],
    interests: ['FinTech', 'Developer Tools', 'Open Source'],
    workStyle: [
      { label: 'Autonomy', value: 75 },
      { label: 'Collaboration', value: 85 },
      { label: 'Structure', value: 80 },
      { label: 'Innovation', value: 80 },
    ],
    compatibility: { vision: 85, skills: 92, workStyle: 85, values: 88 },
    strengths: ['Deep technical expertise', 'Strong execution', 'Collaborative mindset'],
    potentialFrictions: ['Different timezone', 'Prefers structured processes'],
    availability: 'Full-time',
    experience: '8 years',
  },
  {
    id: 'u3',
    name: 'Lisa Park',
    avatar: undefined,
    role: 'advisor',
    headline: 'Product Designer | UX Leader',
    location: 'Austin, TX',
    matchScore: 84,
    skills: ['UI/UX Design', 'User Research', 'Figma', 'Design Systems', 'Prototyping'],
    interests: ['Consumer Apps', 'HealthTech', 'Design'],
    workStyle: [
      { label: 'Autonomy', value: 70 },
      { label: 'Collaboration', value: 90 },
      { label: 'Structure', value: 65 },
      { label: 'Innovation', value: 88 },
    ],
    compatibility: { vision: 82, skills: 78, workStyle: 88, values: 90 },
    strengths: ['Award-winning portfolio', 'User-centric approach', 'Cross-functional experience'],
    potentialFrictions: ['Part-time availability initially', 'Design-first mindset'],
    availability: 'Part-time',
    experience: '6 years',
  },
];

function CompareColumn({ user, onRemove }: { user: CompareUser; onRemove: () => void }) {
  return (
    <div className="flex-1 min-w-[280px] space-y-4">
      {/* Header */}
      <Card className="relative">
        <Button aria-label="Close"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={onRemove}
        >
          <X className="icon-sm" />
        </Button>
        <CardContent className="pt-6 text-center">
          <Avatar className="h-16 w-16 mx-auto mb-3">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-base bg-primary/10 text-primary-accessible">
              {user.name[0]}
            </AvatarFallback>
          </Avatar>
          <Link href={`/profiles/${user.id}`} className="font-semibold text-lg text-foreground hover:text-primary-accessible transition-colors">
            {user.name}
          </Link>
          <div className="mt-1">
            <RoleBadge role={user.role} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{user.headline}</p>
          <p className="text-xs text-muted-foreground mt-1">{user.location}</p>
          
          {/* Match Score */}
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-2xl font-bold text-primary-accessible">{user.matchScore}%</div>
            <div className="text-xs text-muted-foreground">Match Score</div>
          </div>

          <div className="flex gap-2 mt-4">
            {/* Both of these drew a button with nothing behind it while the
                assistant could already open the thread and send the intro.
                Same endpoints, same destination, whichever way it is asked. */}
            <MessageButton userId={user.id} displayName={user.name} variant="default" className="flex-1" />
            <ConnectButton userId={user.id} displayName={user.name} variant="outline" className="flex-1" />
          </div>
        </CardContent>
      </Card>

      {/* Compatibility Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Compatibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(user.compatibility).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="font-medium">{value}%</span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Style */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Work Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.workStyle.map((ws) => (
            <div key={ws.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ws.label}</span>
                <span className="font-medium">{ws.value}%</span>
              </div>
              <Progress value={ws.value} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Check className="icon-sm text-status-success" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {user.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="icon-sm text-status-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Potential Frictions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Minus className="icon-sm text-status-warning" />
            Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {user.potentialFrictions.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Minus className="icon-sm text-status-warning shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="icon-sm text-muted-foreground" />
            <span className="text-muted-foreground">Availability:</span>
            <span className="font-medium">{user.availability}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="icon-sm text-muted-foreground" />
            <span className="text-muted-foreground">Experience:</span>
            <span className="font-medium">{user.experience}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddUserSlot({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 min-w-[280px]">
      <Card className="h-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Plus className="icon-xl text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Add to Compare</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Select another match to compare
          </p>
          <Button variant="outline" onClick={onAdd}>
            <Plus className="icon-sm mr-2" />
            Add Match
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MatchComparePage() {
  const router = useRouter();
  const { showDemoData } = useDemoData();
  const searchParams = useSearchParams();
  
  // Get user IDs from URL params
  const userIds = searchParams?.get('ids')?.split(',').filter(Boolean) || ['u1', 'u2'];
  
  const allUsers = showDemoData ? MOCK_USERS : [];
  const [selectedIds, setSelectedIds] = useState<string[]>(userIds.slice(0, 3));

  const selectedUsers = useMemo(() => {
    return selectedIds
      .map((id) => allUsers.find((u) => u.id === id))
      .filter((u): u is CompareUser => u !== undefined);
  }, [selectedIds, allUsers]);

  const removeUser = (id: string) => {
    setSelectedIds(selectedIds.filter((uid) => uid !== id));
  };

  const addUser = () => {
    const available = allUsers.find((u) => !selectedIds.includes(u.id));
    if (available) {
      setSelectedIds([...selectedIds, available.id]);
    }
  };

  return (
    <AppShell title="Compare matches" description="Open two or more match profiles side by side to weigh fit.">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="icon-md" />
          </Button>
          {/* The shell above already titles the page; this row keeps only
              the two ways back, plus the one fact the shell does not say. */}
          <p className="flex-1 text-sm text-muted-foreground">
            Compare up to 3 potential co-founders side by side
          </p>
          <Button variant="outline" asChild>
            <Link href="/matches">
              Back to Matches
            </Link>
          </Button>
        </div>

        {/* Comparison Grid */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {selectedUsers.map((user) => (
            <CompareColumn
              key={user.id}
              user={user}
              onRemove={() => removeUser(user.id)}
            />
          ))}
          {selectedUsers.length < 3 && (
            <AddUserSlot onAdd={addUser} />
          )}
        </div>

        {/* Summary */}
        {selectedUsers.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="icon-md text-primary-accessible" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Based on your profile and goals, <strong className="text-foreground">{selectedUsers[0]?.name}</strong> appears 
                to be the strongest match with a {selectedUsers[0]?.matchScore}% compatibility score. 
                Their technical expertise and previous startup experience align well with your needs. 
                Consider scheduling a call to discuss potential collaboration.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <MessageButton
                  userId={selectedUsers[0]?.id}
                  displayName={selectedUsers[0]?.name}
                  variant="default"
                  size="md"
                />
                {/* The full analysis is this person's match page — the one
                    screen that actually holds it. */}
                <Button asChild variant="outline" size="md">
                  <Link href={`/matches/${selectedUsers[0]?.id ?? ''}`}>
                    <Target className="icon-sm mr-2" />
                    View Full Analysis
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
