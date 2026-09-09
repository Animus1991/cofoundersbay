'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Info,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

const DAYS = [
  { key: 0, label: 'Sunday',    short: 'Sun' },
  { key: 1, label: 'Monday',    short: 'Mon' },
  { key: 2, label: 'Tuesday',   short: 'Tue' },
  { key: 3, label: 'Wednesday', short: 'Wed' },
  { key: 4, label: 'Thursday',  short: 'Thu' },
  { key: 5, label: 'Friday',    short: 'Fri' },
  { key: 6, label: 'Saturday',  short: 'Sat' },
];

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${h12}:${m} ${ampm}` };
});

const TIMEZONES = [
  'UTC', 'Europe/Athens', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney',
];

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

interface TimeSlot {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

const defaultSlots: TimeSlot[] = [
  { id: '1', weekday: 1, startTime: '09:00', endTime: '12:00' },
  { id: '2', weekday: 2, startTime: '14:00', endTime: '17:00' },
  { id: '3', weekday: 4, startTime: '10:00', endTime: '13:00' },
];

export default function MentorAvailabilityPage() {
  const { hasSession, mounted } = useSession();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const [slots, setSlots] = useState<TimeSlot[]>(defaultSlots);
  const [timezone, setTimezone] = useState('Europe/Athens');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(15);
  const [isAccepting, setIsAccepting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeHours, setNoticeHours] = useState(24);

  const { data: profile } = useQuery({
    queryKey: ['me-profile'],
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  function addSlot(weekday: number) {
    const newSlot: TimeSlot = {
      id: `${Date.now()}`,
      weekday,
      startTime: '09:00',
      endTime: '10:00',
    };
    setSlots(prev => [...prev, newSlot]);
  }

  function removeSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  function updateSlot(id: string, field: 'startTime' | 'endTime', value: string) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    success('Availability saved', 'Your schedule has been updated.');
  }

  const weeklyHours = slots.reduce((acc, slot) => {
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return acc + Math.max(0, duration);
  }, 0) / 60;

  if (!mounted) {
    return (
      <AppShell>
        <div className="py-6 space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
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
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="icon-lg text-primary-emphasis" aria-hidden="true" />
              Availability Settings
            </h1>
            <p className="text-muted-foreground">
              Define when mentees can book sessions with you
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="mr-2 icon-sm animate-spin" aria-hidden="true" /> : <Save className="mr-2 icon-sm" aria-hidden="true" />}
            Save Changes
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Accepting Requests</span>
                <Switch checked={isAccepting} onCheckedChange={setIsAccepting} />
              </div>
              <p className="text-xs text-muted-foreground">
                {isAccepting ? 'You are visible to mentees' : 'Hidden from mentee discovery'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="icon-sm text-primary-emphasis" aria-hidden="true" />
                <span className="text-sm font-medium">Weekly Hours</span>
              </div>
              <p className="text-xl font-bold">{weeklyHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">across {slots.length} time blocks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="icon-sm text-primary-emphasis" aria-hidden="true" />
                <span className="text-sm font-medium">Timezone</span>
              </div>
              <p className="text-sm font-semibold truncate">{timezone.replace('/', ' / ')}</p>
              <p className="text-xs text-muted-foreground">All times shown in local time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="preferences">Session Preferences</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Timezone</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {DAYS.map(day => {
                const daySlots = slots.filter(s => s.weekday === day.key);
                return (
                  <Card key={day.key}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold w-24">{day.label}</span>
                          {daySlots.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {daySlots.length} slot{daySlots.length > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Unavailable</Badge>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => addSlot(day.key)}>
                          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Add
                        </Button>
                      </div>
                      {daySlots.length > 0 && (
                        <div className="space-y-2">
                          {daySlots.map(slot => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <Select value={slot.startTime} onValueChange={v => updateSlot(slot.id, 'startTime', v)}>
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIMES.map(t => (
                                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-muted-foreground text-xs">to</span>
                              <Select value={slot.endTime} onValueChange={v => updateSlot(slot.id, 'endTime', v)}>
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIMES.map(t => (
                                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button aria-label="Delete"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeSlot(slot.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Session Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Session Duration</Label>
                    <Select value={String(sessionDuration)} onValueChange={v => setSessionDuration(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map(d => (
                          <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Default length for new bookings</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Buffer Between Sessions</Label>
                    <Select value={String(bufferTime)} onValueChange={v => setBufferTime(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 5, 10, 15, 30, 60].map(m => (
                          <SelectItem key={m} value={String(m)}>{m === 0 ? 'No buffer' : `${m} min`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Gap between consecutive bookings</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Notice Period</Label>
                    <Select value={String(noticeHours)} onValueChange={v => setNoticeHours(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                          <SelectItem key={h} value={String(h)}>{h < 24 ? `${h}h` : `${h / 24}d`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Advance booking notice required</p>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Info className="icon-sm text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">
                    Your availability will be shown to mentees in their local timezone. 
                    Sessions are confirmed via email and appear in your upcoming sessions list.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
