'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Star,
  BadgeCheck,
  Clock,
  Globe,
  DollarSign,
  Video,
  Users,
  Edit,
  Save,
  RefreshCw,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { getMeProfile } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

const INDUSTRIES = [
  'SaaS', 'Fintech', 'Healthtech', 'Edtech', 'Deep Tech', 'AI/ML',
  'E-commerce', 'Marketplace', 'Web3/Crypto', 'Climate Tech', 'AgriTech',
  'Developer Tools', 'Enterprise Software', 'Consumer Apps', 'Hardware',
];

const STARTUP_STAGES = ['Pre-idea', 'Idea', 'Validation', 'MVP', 'Early Revenue', 'Growth', 'Scale'];

const EXPERTISE_AREAS = [
  'Product Strategy', 'Fundraising', 'Go-to-Market', 'Team Building', 'Leadership',
  'Technical Architecture', 'Sales', 'Marketing', 'Operations', 'Finance', 'Legal',
  'Customer Development', 'Partnerships', 'International Expansion', 'Hiring',
];

const SESSION_FORMATS = ['video', 'in_person', 'async'];

export default function MentorProfilePage() {
  const { hasSession, mounted } = useSession();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['SaaS', 'Fintech']);
  const [selectedStages, setSelectedStages] = useState<string[]>(['MVP', 'Early Revenue', 'Growth']);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>(['Product Strategy', 'Fundraising', 'Go-to-Market']);
  const [sessionFormats, setSessionFormats] = useState<string[]>(['video', 'async']);
  const [isFree, setIsFree] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState('5');
  const [sessionDuration, setSessionDuration] = useState('30');
  const [hoursPerWeek, setHoursPerWeek] = useState('5');
  const [tagInput, setTagInput] = useState('');

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  const displayName = profile?.profile?.displayName ?? 'Mentor';
  const avatarUrl = profile?.profile?.avatarUrl;

  function toggleChip(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }

  async function handleSave() {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    success('Profile updated', 'Your mentor profile is live.');
  }

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <User className="icon-lg text-primary-accessible" />
              Mentor Profile
            </h1>
            <p className="text-muted-foreground">How mentees see you on the platform</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="mr-2 icon-sm animate-spin" /> : <Save className="mr-2 icon-sm" />}
            Save Profile
          </Button>
        </div>

        {/* Preview Card */}
        <Card className="border-primary/20 bg-primary/2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 rounded-lg ring-2 ring-primary/30">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm font-bold rounded-xl">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg">{displayName}</h2>
                  <BadgeCheck className="icon-sm text-primary-accessible" />
                  <Badge variant="secondary" className="text-xs">Mentor</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {headline || 'Add your headline below...'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="icon-sm text-amber-400" /> 4.9 (12 reviews)</span>
                  <span className="flex items-center gap-1"><Clock className="icon-sm" /> {sessionDuration} min sessions</span>
                  <span className="flex items-center gap-1"><Users className="icon-sm" /> {hoursPerWeek}h/week</span>
                  <span className={cn('flex items-center gap-1', isFree ? 'text-status-success' : '')}>
                    <DollarSign className="icon-sm" />
                    {isFree ? 'Free' : `$${hourlyRate}/hr`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basics">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Formats</TabsTrigger>
          </TabsList>

          {/* Basics */}
          <TabsContent value="basics" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">About You</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. Serial founder & GTM advisor | 2x exits"
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground">{headline.length}/120 chars</p>
                </div>
                <div className="space-y-2">
                  <Label>Mentoring Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Describe your mentoring style, what you offer, and what kinds of founders you work best with..."
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Years of Experience</Label>
                    <Select value={yearsExp} onValueChange={setYearsExp}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '5', '7', '10', '15', '20+'].map(v => (
                          <SelectItem key={v} value={v}>{v} year{v !== '1' ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hours Available / Week</Label>
                    <Select value={hoursPerWeek} onValueChange={setHoursPerWeek}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '5', '8', '10', '15', '20'].map(v => (
                          <SelectItem key={v} value={v}>{v}h/week</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Accepting New Mentees</p>
                    <p className="text-xs text-muted-foreground">Toggle visibility in mentee search</p>
                  </div>
                  <Switch checked={isAccepting} onCheckedChange={setIsAccepting} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expertise */}
          <TabsContent value="expertise" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Industries</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => toggleChip(selectedIndustries, setSelectedIndustries, ind)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedIndustries.includes(ind)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Startup Stages</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {STARTUP_STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleChip(selectedStages, setSelectedStages, stage)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedStages.includes(stage)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Expertise Areas</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_AREAS.map(area => (
                    <button
                      key={area}
                      onClick={() => toggleChip(selectedExpertise, setSelectedExpertise, area)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedExpertise.includes(area)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing & Formats */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Session Formats</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    { value: 'video', label: 'Video Call', desc: 'Google Meet, Zoom, etc.' },
                    { value: 'in_person', label: 'In-Person', desc: 'Physical meeting at a location' },
                    { value: 'async', label: 'Async / Written', desc: 'Email, voice notes, document feedback' },
                  ].map(f => (
                    <div
                      key={f.value}
                      onClick={() => toggleChip(sessionFormats, setSessionFormats, f.value)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                        sessionFormats.includes(f.value)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-border/80'
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 transition-all',
                        sessionFormats.includes(f.value) ? 'border-primary bg-primary' : 'border-border'
                      )} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Free Mentoring</p>
                    <p className="text-xs text-muted-foreground">Offer sessions at no cost</p>
                  </div>
                  <Switch checked={isFree} onCheckedChange={setIsFree} />
                </div>
                {!isFree && (
                  <div className="space-y-2">
                    <Label>Hourly Rate (USD)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(e.target.value)}
                        placeholder="120"
                        className="w-32"
                        min="0"
                      />
                      <span className="text-sm text-muted-foreground">per hour</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Default Session Duration</Label>
                  <Select value={sessionDuration} onValueChange={setSessionDuration}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[15, 30, 45, 60, 90, 120].map(d => (
                        <SelectItem key={d} value={String(d)}>
                          {d < 60 ? `${d} min` : `${d / 60}h`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
