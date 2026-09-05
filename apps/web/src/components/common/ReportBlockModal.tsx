'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag, Ban, AlertTriangle, Shield, X, Check, Loader2,
  UserX, Mail, CreditCard, Eye, HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { blockUser, createUserReport } from '@/lib/api';
import { cn } from '@/lib/utils';

type ReportReason = 
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'scam'
  | 'privacy_violation'
  | 'other';

type ReportBlockModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  mode: 'report' | 'block' | 'both';
  onBlocked?: (userId: string) => void;
};

const REPORT_REASONS: { value: ReportReason; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: 'harassment',
    label: 'Harassment or bullying',
    icon: UserX,
    description: 'Threatening, abusive, or intimidating behavior',
  },
  {
    value: 'spam',
    label: 'Spam or promotional content',
    icon: Mail,
    description: 'Unsolicited messages or advertisements',
  },
  {
    value: 'fake_profile',
    label: 'Fake or misleading profile',
    icon: Eye,
    description: 'Impersonation or false information',
  },
  {
    value: 'inappropriate_content',
    label: 'Inappropriate content',
    icon: AlertTriangle,
    description: 'Offensive, explicit, or harmful content',
  },
  {
    value: 'scam',
    label: 'Scam or fraud',
    icon: CreditCard,
    description: 'Attempting to deceive or defraud users',
  },
  {
    value: 'privacy_violation',
    label: 'Privacy violation',
    icon: Shield,
    description: 'Sharing private information without consent',
  },
  {
    value: 'other',
    label: 'Other',
    icon: HelpCircle,
    description: 'Something else not listed above',
  },
];

function mapReportReason(reason: ReportReason): 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'other' {
  switch (reason) {
    case 'harassment':
      return 'harassment';
    case 'spam':
      return 'spam';
    case 'fake_profile':
      return 'fake';
    case 'inappropriate_content':
      return 'inappropriate';
    default:
      return 'other';
  }
}

async function submitReport(data: {
  userId: string;
  reason: ReportReason;
  details: string;
  blockUser: boolean;
}): Promise<{ reportId: string }> {
  const reasonMeta = REPORT_REASONS.find((entry) => entry.value === data.reason);
  const report = await createUserReport({
    reportedId: data.userId,
    type: mapReportReason(data.reason),
    reason: data.details.trim()
      ? `${reasonMeta?.label ?? 'User report'}: ${data.details.trim()}`
      : reasonMeta?.description ?? 'User report submitted from conversation flow.',
    context: {
      source: 'messages',
      category: data.reason,
      details: data.details.trim() || null,
      alsoBlocked: data.blockUser,
    },
  });
  if (data.blockUser) {
    await blockUser(data.userId);
  }
  return { reportId: report.report.id };
}

export function ReportBlockModal({
  open,
  onOpenChange,
  userId,
  userName,
  mode,
  onBlocked,
}: ReportBlockModalProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'select' | 'report' | 'block' | 'confirm'>('select');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);

  const reportMutation = useMutation({
    mutationFn: submitReport,
    onSuccess: () => {
      if (alsoBlock) {
        onBlocked?.(userId);
      }
      success(
        alsoBlock ? 'Report submitted and user blocked' : 'Report submitted',
        alsoBlock
          ? 'Our team will review the report, and this user can no longer contact you.'
          : 'Our team will review this report within 24 hours.',
      );
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      handleClose();
    },
    onError: (error) => {
      showError('Failed to submit report', error instanceof Error ? error.message : 'Please try again later.');
    },
  });

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      onBlocked?.(userId);
      success('User blocked', `${userName} has been blocked. They can no longer contact you.`);
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      handleClose();
    },
    onError: (error) => {
      showError('Failed to block user', error instanceof Error ? error.message : 'Please try again later.');
    },
  });

  const handleClose = () => {
    setStep('select');
    setSelectedReason(null);
    setDetails('');
    setAlsoBlock(false);
    onOpenChange(false);
  };

  const handleSubmitReport = () => {
    if (!selectedReason) return;
    
    reportMutation.mutate({
      userId,
      reason: selectedReason,
      details,
      blockUser: alsoBlock,
    });
  };

  const handleBlockUser = () => {
    blockMutation.mutate(userId);
  };

  const isLoading = reportMutation.isPending || blockMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'select' && mode === 'both' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-accessible" />
                What would you like to do?
              </DialogTitle>
              <DialogDescription>
                Choose an action for {userName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              <button
                onClick={() => setStep('report')}
                className="w-full flex items-start gap-3 rounded-lg border border-border/60 p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Flag className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Report user</p>
                  <p className="text-sm text-muted-foreground">
                    Report inappropriate behavior to our moderation team
                  </p>
                </div>
              </button>
              
              <button
                onClick={() => setStep('block')}
                className="w-full flex items-start gap-3 rounded-lg border border-border/60 p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <Ban className="h-5 w-5 text-destructive-accessible" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Block user</p>
                  <p className="text-sm text-muted-foreground">
                    Prevent this user from contacting you
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {(step === 'report' || (step === 'select' && mode === 'report')) && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-amber-500" />
                Report {userName}
              </DialogTitle>
              <DialogDescription>
                Help us understand what happened
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Why are you reporting this user?
                </Label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                        selectedReason === reason.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border/60 hover:bg-muted/30'
                      )}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={() => setSelectedReason(reason.value)}
                        className="mt-1 h-4 w-4 text-primary-accessible border-border focus:ring-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{reason.label}</p>
                        <p className="text-xs text-muted-foreground">{reason.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason && (
                <div>
                  <Label htmlFor="details" className="text-sm font-medium mb-2 block">
                    Additional details (optional)
                  </Label>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide any additional context that might help us investigate..."
                    rows={3}
                    maxLength={1000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {details.length}/1000
                  </p>
                </div>
              )}

              {selectedReason && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoBlock}
                    onChange={(e) => setAlsoBlock(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Also block this user</span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {mode === 'both' && (
                <Button variant="ghost" onClick={() => setStep('select')} disabled={isLoading}>
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={!selectedReason || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
                Submit Report
              </Button>
            </div>
          </>
        )}

        {(step === 'block' || (step === 'select' && mode === 'block')) && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive-accessible" />
                Block {userName}?
              </DialogTitle>
              <DialogDescription>
                This action can be undone from your settings
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
                <p className="text-sm text-foreground">When you block someone:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-destructive-accessible" />
                    They won't be able to message you
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-destructive-accessible" />
                    They won't see your profile
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 shrink-0 mt-0.5 text-destructive-accessible" />
                    They won't appear in your matches
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    They won't be notified that you blocked them
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {mode === 'both' && (
                <Button variant="ghost" onClick={() => setStep('select')} disabled={isLoading}>
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlockUser}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Block User
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
