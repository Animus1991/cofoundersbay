'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ArrowLeft,
  Loader2,
  Globe,
} from 'lucide-react';
import { createEvent } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'networking', label: 'Networking' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'demo_day', label: 'Demo Day' },
  { value: 'other', label: 'Other' },
] as const;

type EventType = (typeof EVENT_TYPES)[number]['value'];

export default function CreateEventPage() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'networking' as EventType,
    startAt: '',
    endAt: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: '',
    isOnline: false,
    meetingUrl: '',
    capacity: '',
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.startAt) return;

    setSubmitting(true);
    try {
      const startDate = new Date(form.startAt).toISOString();
      const endDate = form.endAt ? new Date(form.endAt).toISOString() : undefined;

      const { event } = await createEvent({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        startAt: startDate,
        endAt: endDate,
        timezone: form.timezone || undefined,
        location: form.location.trim() || undefined,
        isOnline: form.isOnline,
        meetingUrl: form.meetingUrl.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
      });
      router.push(`/events`);
    } catch (err) {
      showError('Could not create event', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Create Event"
      description="Host a meetup, webinar, or demo day for the community"
      actions={
        <Button variant="secondary" size="sm" className="gap-2" asChild>
          <Link href="/events">
            <ArrowLeft className="icon-sm" />
            Back to events
          </Link>
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="icon-sm text-primary-accessible" />
              Basic information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Event title <span className="text-destructive-accessible">*</span>
              </label>
              <Input
                placeholder="e.g. Founder Meetup Athens Q2"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 resize-none"
                placeholder="What will happen at this event? Who should attend?"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                maxLength={5000}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Event type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('type', value)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                      form.type === value
                        ? 'border-primary bg-primary/20 text-primary-accessible'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="icon-sm text-primary-accessible" />
              Date & time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Start <span className="text-destructive-accessible">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => set('startAt', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">End</label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => set('endAt', e.target.value)}
                  min={form.startAt}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Globe className="icon-sm" />
                Timezone
              </label>
              <Input
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                placeholder="e.g. Europe/Athens"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="icon-sm text-primary-accessible" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('isOnline', !form.isOnline)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                  form.isOnline
                    ? 'border-primary bg-primary/20 text-primary-accessible'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40',
                )}
              >
                <Video className="icon-sm" />
                Online event
              </button>
              {form.isOnline && (
                <Badge variant="secondary" className="text-xs">
                  Online
                </Badge>
              )}
            </div>

            {!form.isOnline && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Venue / address</label>
                <Input
                  placeholder="e.g. Station F, 5 Parvis Alan Turing, Paris"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  maxLength={180}
                />
              </div>
            )}

            {form.isOnline && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Meeting URL</label>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/…"
                  value={form.meetingUrl}
                  onChange={(e) => set('meetingUrl', e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="icon-sm text-primary-accessible" />
              Capacity (optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Max attendees</label>
              <Input
                type="number"
                placeholder="Leave blank for unlimited"
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                min={1}
                max={5000}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited attendees.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" className="gap-2 min-w-[140px]" disabled={submitting || !form.title.trim() || !form.startAt}>
            {submitting ? (
              <>
                <Loader2 className="icon-sm animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Calendar className="icon-sm" />
                Create event
              </>
            )}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/events">
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
