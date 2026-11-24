import { CalendarDays, Clock, Flag, Users, Video } from 'lucide-react';

export type EventType = 'milestone' | 'session' | 'event' | 'deadline' | 'meeting';

/* The kind's chip: icon + word + colour, never colour alone (docs §132.4).
   Shared between the page and its tests. */
export const TYPE_CONFIG: Record<EventType, { labelEn: string; labelEl: string; color: string; icon: React.ElementType; bg: string }> = {
  milestone:  { labelEn: 'Milestone', labelEl: 'Ορόσημο', color: 'text-status-warning',   icon: Flag,           bg: 'bg-status-warning-bg border-status-warning-border' },
  session:    { labelEn: 'Session',   labelEl: 'Συνεδρία', color: 'text-status-info',    icon: Video,          bg: 'bg-status-info-bg border-status-info-border' },
  event:      { labelEn: 'Event',     labelEl: 'Εκδήλωση', color: 'text-status-accent',  icon: CalendarDays,   bg: 'bg-status-accent-bg border-status-accent-border' },
  deadline:   { labelEn: 'Deadline',  labelEl: 'Προθεσμία', color: 'text-status-danger',     icon: Clock,          bg: 'bg-status-danger-bg border-status-danger-border' },
  meeting:    { labelEn: 'Meeting',   labelEl: 'Συνάντηση', color: 'text-status-success', icon: Users,          bg: 'bg-status-success-bg border-status-success-border' },
};
