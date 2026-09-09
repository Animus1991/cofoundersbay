'use client';

import { useState } from 'react';
import {
  Calendar, Clock, Video, Phone, ExternalLink, Check,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ScheduleCallModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onScheduled?: (details: ScheduleDetails) => void;
};

type ScheduleDetails = {
  date: Date;
  time: string;
  duration: string;
  type: 'video' | 'phone';
  message?: string;
};

const DURATIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

function generateCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export function ScheduleCallModal({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientAvatar,
  onScheduled,
}: ScheduleCallModalProps) {
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState('30');
  const [callType, setCallType] = useState<'video' | 'phone'>('video');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarDays = generateCalendarDays(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDateDisabled = (date: Date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      onScheduled?.({
        date: selectedDate,
        time: selectedTime,
        duration,
        type: callType,
        message: message || undefined,
      });
      
      setStep('confirm');
    } catch (err) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep('date');
    setSelectedDate(null);
    setSelectedTime(null);
    setDuration('30');
    setCallType('video');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {recipientName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>Schedule a call with {recipientName}</span>
              <DialogDescription className="font-normal">
                {step === 'date' && 'Select a date'}
                {step === 'time' && 'Choose a time slot'}
                {step === 'details' && 'Add details'}
                {step === 'confirm' && 'Call scheduled!'}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {step === 'date' && (
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <Button aria-label="Previous" variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">{monthName}</span>
              <Button aria-label="Next" variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((date, i) => (
                <div key={i} className="aspect-square">
                  {date && (
                    <button
                      type="button"
                      disabled={isDateDisabled(date)}
                      onClick={() => {
                        setSelectedDate(date);
                        setStep('time');
                      }}
                      className={cn(
                        'w-full h-full rounded-lg text-sm transition-colors',
                        isDateDisabled(date) && 'text-muted-foreground/50 cursor-not-allowed',
                        !isDateDisabled(date) && 'hover:bg-primary/10',
                        selectedDate?.toDateString() === date.toDateString() && 'bg-primary text-primary-foreground',
                        date.toDateString() === today.toDateString() && !selectedDate && 'border border-primary'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Calendar Integration Notice */}
            <Card className="bg-muted/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Connect your calendar</p>
                  <p className="text-muted-foreground text-xs">
                    Sync with Google Calendar or Outlook for automatic availability
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'time' && selectedDate && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('date')} className="gap-1 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setSelectedTime(time);
                    setStep('details');
                  }}
                  className={cn(
                    'rounded-lg border border-border py-2 px-3 text-sm transition-colors hover:border-primary hover:bg-primary/5',
                    selectedTime === time && 'border-primary bg-primary/10'
                  )}
                >
                  {time}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Times shown in your local timezone (UTC{Intl.DateTimeFormat().resolvedOptions().timeZone})
            </p>
          </div>
        )}

        {step === 'details' && selectedDate && selectedTime && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('time')} className="gap-1 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime}
            </Button>

            {/* Call Type */}
            <div className="space-y-2">
              <Label>Call Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCallType('video')}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    callType === 'video' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Video className={cn('h-5 w-5', callType === 'video' ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="text-left">
                    <p className="font-medium text-sm">Video Call</p>
                    <p className="text-xs text-muted-foreground">Face-to-face meeting</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('phone')}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    callType === 'phone' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Phone className={cn('h-5 w-5', callType === 'phone' ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="text-left">
                    <p className="font-medium text-sm">Phone Call</p>
                    <p className="text-xs text-muted-foreground">Audio only</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Add a note about what you'd like to discuss..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Call
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'confirm' && selectedDate && selectedTime && (
          <div className="text-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Call Scheduled!</h3>
              <p className="text-muted-foreground mt-1">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}
              </p>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {callType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  <span>{callType === 'video' ? 'Video Call' : 'Phone Call'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{DURATIONS.find((d) => d.value === duration)?.label}</span>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              {recipientName} will receive a notification and calendar invite.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={resetAndClose}>
                Done
              </Button>
              <Button className="flex-1">
                Add to Calendar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
