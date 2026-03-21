'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Bell, Mail, MessageSquare, Users, Calendar,
  Briefcase, TrendingUp, Shield, Volume2, VolumeX, Smartphone,
  Monitor, Save, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type NotificationChannel = 'push' | 'email' | 'inApp';

type NotificationSetting = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
};

type NotificationCategory = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  settings: NotificationSetting[];
};

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'messages',
    title: 'Messages',
    description: 'Notifications about direct messages and conversations',
    icon: MessageSquare,
    settings: [
      {
        id: 'new_message',
        label: 'New messages',
        description: 'When someone sends you a message',
        icon: MessageSquare,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'message_request',
        label: 'Message requests',
        description: 'When someone new wants to message you',
        icon: MessageSquare,
        channels: { push: true, email: true, inApp: true },
      },
    ],
  },
  {
    id: 'connections',
    title: 'Connections',
    description: 'Notifications about connection requests and updates',
    icon: Users,
    settings: [
      {
        id: 'connection_request',
        label: 'Connection requests',
        description: 'When someone wants to connect with you',
        icon: Users,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'connection_accepted',
        label: 'Connection accepted',
        description: 'When someone accepts your connection request',
        icon: Users,
        channels: { push: true, email: false, inApp: true },
      },
      {
        id: 'profile_view',
        label: 'Profile views',
        description: 'When someone views your profile',
        icon: Users,
        channels: { push: false, email: false, inApp: true },
      },
    ],
  },
  {
    id: 'matches',
    title: 'Matches & Recommendations',
    description: 'Notifications about new matches and AI recommendations',
    icon: TrendingUp,
    settings: [
      {
        id: 'new_match',
        label: 'New matches',
        description: 'When we find a new potential co-founder match',
        icon: TrendingUp,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'match_update',
        label: 'Match score updates',
        description: 'When your compatibility score changes',
        icon: TrendingUp,
        channels: { push: false, email: false, inApp: true },
      },
      {
        id: 'weekly_digest',
        label: 'Weekly match digest',
        description: 'Summary of your top matches each week',
        icon: Mail,
        channels: { push: false, email: true, inApp: false },
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects & Collaborations',
    description: 'Notifications about projects you\'re involved in',
    icon: Briefcase,
    settings: [
      {
        id: 'project_invite',
        label: 'Project invitations',
        description: 'When you\'re invited to join a project',
        icon: Briefcase,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'project_update',
        label: 'Project updates',
        description: 'Updates from projects you\'re part of',
        icon: Briefcase,
        channels: { push: true, email: false, inApp: true },
      },
      {
        id: 'role_application',
        label: 'Role applications',
        description: 'When someone applies to your project',
        icon: Users,
        channels: { push: true, email: true, inApp: true },
      },
    ],
  },
  {
    id: 'events',
    title: 'Events & Meetings',
    description: 'Notifications about scheduled events and calls',
    icon: Calendar,
    settings: [
      {
        id: 'event_reminder',
        label: 'Event reminders',
        description: 'Reminders before scheduled events',
        icon: Calendar,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'meeting_request',
        label: 'Meeting requests',
        description: 'When someone wants to schedule a call',
        icon: Calendar,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'event_update',
        label: 'Event changes',
        description: 'When an event is rescheduled or cancelled',
        icon: Calendar,
        channels: { push: true, email: true, inApp: true },
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Account',
    description: 'Important notifications about your account security',
    icon: Shield,
    settings: [
      {
        id: 'login_alert',
        label: 'Login alerts',
        description: 'When your account is accessed from a new device',
        icon: Shield,
        channels: { push: true, email: true, inApp: true },
      },
      {
        id: 'password_change',
        label: 'Password changes',
        description: 'When your password is changed',
        icon: Shield,
        channels: { push: true, email: true, inApp: true },
      },
    ],
  },
];

export default function NotificationPreferencesPage() {
  const { success } = useToast();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [emailDigestFrequency, setEmailDigestFrequency] = useState('weekly');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [isSaving, setIsSaving] = useState(false);

  const toggleChannel = (categoryId: string, settingId: string, channel: NotificationChannel) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          settings: cat.settings.map((setting) => {
            if (setting.id !== settingId) return setting;
            return {
              ...setting,
              channels: {
                ...setting.channels,
                [channel]: !setting.channels[channel],
              },
            };
          }),
        };
      })
    );
  };

  const toggleAllInCategory = (categoryId: string, channel: NotificationChannel, value: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          settings: cat.settings.map((setting) => ({
            ...setting,
            channels: {
              ...setting.channels,
              [channel]: value,
            },
          })),
        };
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      success('Preferences saved', 'Your notification preferences have been updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Notification Preferences</h1>
            <p className="text-muted-foreground">
              Control how and when you receive notifications
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Global Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Digest */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Digest Frequency</Label>
                <p className="text-sm text-muted-foreground">
                  How often to receive summary emails
                </p>
              </div>
              <Select value={emailDigestFrequency} onValueChange={setEmailDigestFrequency}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    {quietHoursEnabled ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    Quiet Hours
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pause push notifications during specific hours
                  </p>
                </div>
                <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
              </div>
              {quietHoursEnabled && (
                <div className="flex items-center gap-4 pl-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">From</Label>
                    <Select value={quietHoursStart} onValueChange={setQuietHoursStart}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const time = `${i.toString().padStart(2, '0')}:00`;
                          return <SelectItem key={time} value={time}>{time}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">To</Label>
                    <Select value={quietHoursEnd} onValueChange={setQuietHoursEnd}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const time = `${i.toString().padStart(2, '0')}:00`;
                          return <SelectItem key={time} value={time}>{time}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Channel Legend */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Push</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>In-App</span>
          </div>
        </div>

        {/* Notification Categories */}
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.settings.map((setting, i) => (
                    <div
                      key={setting.id}
                      className={cn(
                        'flex items-center justify-between py-3',
                        i < category.settings.length - 1 && 'border-b border-border/60'
                      )}
                    >
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{setting.label}</Label>
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          <Switch
                            checked={setting.channels.push}
                            onCheckedChange={() => toggleChannel(category.id, setting.id, 'push')}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <Switch
                            checked={setting.channels.email}
                            onCheckedChange={() => toggleChannel(category.id, setting.id, 'email')}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          <Switch
                            checked={setting.channels.inApp}
                            onCheckedChange={() => toggleChannel(category.id, setting.id, 'inApp')}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Save Button (Mobile) */}
        <div className="sm:hidden">
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
