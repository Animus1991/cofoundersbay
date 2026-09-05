'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, ShieldCheck, ShieldAlert, Download, FileText, Copy, Check,
  AlertTriangle, Info, Unlock, Hash,
  ChevronDown, Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  updateConversationValidationMode,
  acceptConversationValidation,
  declineConversationValidation,
  exportConversationTranscript,
  type ConversationValidationMode as ApiValidationMode,
} from '@/lib/api';
import { cn } from '@/lib/utils';

export type ValidationMode = 'casual' | 'one_party' | 'two_party';

export type ConversationValidationState = {
  mode: ValidationMode;
  initiatedBy: string | null;
  initiatedAt: string | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
  lastValidatedAt: string | null;
  validationHash: string | null;
  transcriptAvailable: boolean;
};

type ConversationValidationProps = {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  validationState: ConversationValidationState;
  onModeChange?: (mode: ValidationMode) => void;
};

const MODE_CONFIG: Record<ValidationMode, {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  casual: {
    label: 'Casual Chat',
    description: 'Standard private messaging, no validation',
    icon: Unlock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  one_party: {
    label: 'One-Party Validation',
    description: 'You can save/validate your side of the conversation',
    icon: Shield,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  two_party: {
    label: 'Two-Party Validation',
    description: 'Both parties agree to validated transcript',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
};


function ValidationModeIndicator({ state }: { state: ConversationValidationState }) {
  const config = MODE_CONFIG[state.mode];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5', config.bgColor)}>
      <Icon className={cn('h-3 w-3', config.color)} />
      <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
    </div>
  );
}

export function ConversationValidationBadge({
  state,
  compact = false,
}: {
  state: ConversationValidationState;
  compact?: boolean;
}) {
  const config = MODE_CONFIG[state.mode];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn('flex h-6 w-6 items-center justify-center rounded-full', config.bgColor)}
        title={config.label}
      >
        <Icon className={cn('h-3.5 w-3.5', config.color)} />
      </div>
    );
  }

  return <ValidationModeIndicator state={state} />;
}

export function ConversationValidationMenu({
  conversationId,
  currentUserId,
  otherUserId,
  otherUserName,
  validationState,
  onModeChange,
}: ConversationValidationProps) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateModeMutation = useMutation({
    mutationFn: (mode: ValidationMode) => updateConversationValidationMode(conversationId, mode as ApiValidationMode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      onModeChange?.(data.validationState.mode);
      success('Validation mode updated', `Conversation is now in ${MODE_CONFIG[data.validationState.mode].label} mode`);
      setShowModeDialog(false);
    },
    onError: () => {
      showError('Failed to update', 'Could not change validation mode');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptConversationValidation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      success('Validation accepted', 'Two-party validation is now active');
      setShowAcceptDialog(false);
    },
    onError: () => {
      showError('Failed to accept', 'Could not accept validation request');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => declineConversationValidation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      success('Validation declined', 'Conversation remains in casual mode');
      setShowAcceptDialog(false);
    },
    onError: () => {
      showError('Failed to decline', 'Could not decline validation request');
    },
  });

  const handleExport = async (format: 'json' | 'txt') => {
    try {
      const blob = await exportConversationTranscript(conversationId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId.slice(0, 8)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Transcript exported', `Downloaded as ${format.toUpperCase()}`);
    } catch {
      showError('Export failed', 'Could not download transcript');
    }
  };

  const copyHash = () => {
    if (validationState.validationHash) {
      navigator.clipboard.writeText(validationState.validationHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const config = MODE_CONFIG[validationState.mode];
  const Icon = config.icon;
  const isPendingAcceptance = 
    validationState.mode === 'two_party' && 
    validationState.initiatedBy && 
    validationState.initiatedBy !== currentUserId &&
    !validationState.acceptedBy;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
            <Icon className={cn('h-3.5 w-3.5', config.color)} />
            <span className="hidden sm:inline">{config.label}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-foreground">Conversation Validation</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowModeDialog(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Change validation mode
          </DropdownMenuItem>
          
          {validationState.transcriptAvailable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <Download className="mr-2 h-4 w-4" />
                Export as JSON (.json)
              </DropdownMenuItem>
            </>
          )}
          
          {validationState.validationHash && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={copyHash}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-emerald-500" />
                ) : (
                  <Hash className="mr-2 h-4 w-4" />
                )}
                {copied ? 'Hash copied!' : 'Copy validation hash'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pending acceptance banner */}
      {isPendingAcceptance && (
        <div className="mx-4 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {otherUserName} requested two-party validation
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Both parties will be able to save and verify the conversation transcript
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => declineMutation.mutate()}
                  disabled={declineMutation.isPending}
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode selection dialog */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-accessible" />
              Conversation Validation Mode
            </DialogTitle>
            <DialogDescription>
              Choose how this conversation should be validated
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {(Object.entries(MODE_CONFIG) as [ValidationMode, typeof MODE_CONFIG[ValidationMode]][]).map(
              ([mode, modeConfig]) => {
                const ModeIcon = modeConfig.icon;
                const isActive = validationState.mode === mode;

                return (
                  <button
                    key={mode}
                    onClick={() => updateModeMutation.mutate(mode)}
                    disabled={updateModeMutation.isPending}
                    className={cn(
                      'w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 hover:bg-muted/50'
                    )}
                  >
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', modeConfig.bgColor)}>
                      <ModeIcon className={cn('h-5 w-5', modeConfig.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{modeConfig.label}</p>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {modeConfig.description}
                      </p>
                      {mode === 'two_party' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Requires acceptance from {otherUserName}
                        </p>
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">About validation modes</p>
                <ul className="space-y-1">
                  <li><strong>Casual:</strong> Standard messaging, no records saved</li>
                  <li><strong>One-Party:</strong> You can save transcripts; other party is notified</li>
                  <li><strong>Two-Party:</strong> Both agree to validated, verifiable transcript</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TranscriptExportButton({
  conversationId,
  validationState,
}: {
  conversationId: string;
  validationState: ConversationValidationState;
}) {
  const { success, error: showError } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'txt') => {
    setIsExporting(true);
    try {
      const blob = await exportConversationTranscript(conversationId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${conversationId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Transcript exported', `Downloaded as ${format.toUpperCase()}`);
    } catch {
      showError('Export failed', 'Could not download transcript');
    } finally {
      setIsExporting(false);
    }
  };

  if (validationState.mode === 'casual') {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Save Transcript
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('txt')}>
          <FileText className="mr-2 h-4 w-4" />
          Plain Text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <Download className="mr-2 h-4 w-4" />
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ValidationHashDisplay({ hash }: { hash: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
      <code className="flex-1 text-xs font-mono text-muted-foreground truncate">
        {hash}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={copyHash}
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
