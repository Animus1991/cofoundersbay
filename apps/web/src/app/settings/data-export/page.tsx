'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Download, FileText, Shield, Clock, Check,
  AlertTriangle, Loader2, ArrowLeft, Archive, Trash2,
  User, MessageCircle, Calendar, Briefcase, Settings,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type ExportStatus = 'idle' | 'processing' | 'ready' | 'expired';

type ExportRequest = {
  id: string;
  status: ExportStatus;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  downloadUrl: string | null;
  fileSize: number | null;
  dataTypes: string[];
};

type DataCategory = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  included: boolean;
};

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'profile',
    label: 'Profile Information',
    description: 'Your name, bio, skills, and preferences',
    icon: User,
    included: true,
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'All your conversations and attachments',
    icon: MessageCircle,
    included: true,
  },
  {
    id: 'connections',
    label: 'Connections',
    description: 'Your network and connection history',
    icon: User,
    included: true,
  },
  {
    id: 'activity',
    label: 'Activity History',
    description: 'Your actions and interactions on the platform',
    icon: Calendar,
    included: true,
  },
  {
    id: 'milestones',
    label: 'Milestones',
    description: 'Your goals and progress tracking',
    icon: Briefcase,
    included: true,
  },
  {
    id: 'settings',
    label: 'Account Settings',
    description: 'Your preferences and configurations',
    icon: Settings,
    included: true,
  },
];

async function getExportStatus(): Promise<{ exports: ExportRequest[] }> {
  const response = await fetch('/api/v1/user/data-export', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get export status');
  }
  
  return response.json();
}

async function requestExport(dataTypes: string[]): Promise<{ export: ExportRequest }> {
  const response = await fetch('/api/v1/user/data-export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: JSON.stringify({ dataTypes }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to request export');
  }
  
  return response.json();
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ExportCard({ exportReq }: { exportReq: ExportRequest }) {
  const statusConfig: Record<ExportStatus, { label: string; color: string; icon: React.ElementType }> = {
    idle: { label: 'Pending', color: 'text-muted-foreground', icon: Clock },
    processing: { label: 'Processing', color: 'text-status-warning', icon: Loader2 },
    ready: { label: 'Ready', color: 'text-status-success', icon: Check },
    expired: { label: 'Expired', color: 'text-destructive-accessible', icon: AlertTriangle },
  };

  const config = statusConfig[exportReq.status];
  const StatusIcon = config.icon;

  return (
    <Card className="border-border/60">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              exportReq.status === 'ready' ? 'bg-status-success-bg' : 'bg-muted'
            )}>
              <Archive className={cn(
                'icon-md',
                exportReq.status === 'ready' ? 'text-status-success' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground">Data Export</p>
                <Badge
                  variant="outline"
                  className={cn('text-xs', config.color)}
                >
                  <StatusIcon className={cn(
                    'icon-sm mr-1',
                    exportReq.status === 'processing' && 'animate-spin'
                  )} />
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Requested {formatDate(exportReq.requestedAt)}
              </p>
              {exportReq.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Completed {formatDate(exportReq.completedAt)}
                </p>
              )}
              {exportReq.fileSize && (
                <p className="text-xs text-muted-foreground mt-1">
                  Size: {formatFileSize(exportReq.fileSize)}
                </p>
              )}
            </div>
          </div>

          {exportReq.status === 'ready' && exportReq.downloadUrl && (
            <a href={exportReq.downloadUrl} download>
              <Button size="sm" className="gap-2">
                <Download className="icon-sm" />
                Download
              </Button>
            </a>
          )}
        </div>

        {exportReq.status === 'processing' && (
          <div className="mt-4">
            <Progress value={33} className="h-1" />
            <p className="text-xs text-muted-foreground mt-2">
              This may take a few minutes depending on the amount of data...
            </p>
          </div>
        )}

        {exportReq.expiresAt && exportReq.status === 'ready' && (
          <p className="text-xs text-status-warning mt-3 flex items-center gap-1">
            <Clock className="icon-sm" />
            Download expires {formatDate(exportReq.expiresAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DataExportPage() {
  const { success, error: showError } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(DATA_CATEGORIES.map((c) => c.id))
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['data-exports'],
    queryFn: getExportStatus,
    refetchInterval: (query) => {
      const exports = query.state.data?.exports || [];
      const hasProcessing = exports.some((e) => e.status === 'processing');
      return hasProcessing ? 5000 : false;
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => requestExport(Array.from(selectedCategories)),
    onSuccess: () => {
      success('Export requested', 'We\'ll notify you when your data is ready to download.');
      refetch();
    },
    onError: () => {
      showError('Export failed', 'Could not request data export. Please try again.');
    },
  });

  const exports = data?.exports || [];
  const hasActiveExport = exports.some((e) => e.status === 'processing');

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AppShell title="Data Export" description="Download a copy of your data">
      <div className="w-full">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="icon-sm" />
          Back to Settings
        </Link>


        {/* GDPR Info */}
        <Card className="mb-6 border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Shield className="icon-md text-primary-accessible shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Your Data Rights</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Under GDPR and similar regulations, you have the right to receive a copy of your personal data 
                  in a portable format. This export includes all data we store about you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Exports */}
        {exports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3">Previous Exports</h2>
            <div className="space-y-3">
              {exports.map((exportReq) => (
                <ExportCard key={exportReq.id} exportReq={exportReq} />
              ))}
            </div>
          </div>
        )}

        {/* New Export Request */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Request New Export</CardTitle>
            <CardDescription>
              Select the data you want to include in your export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {DATA_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.has(category.id);

                return (
                  <label
                    key={category.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 hover:bg-muted/30'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(category.id)}
                      className="sr-only"
                    />
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'icon-sm',
                        isSelected ? 'text-primary-accessible' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{category.label}</p>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-sm border-2 flex items-center justify-center transition-colors',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-border'
                    )}>
                      {isSelected && <Check className="icon-sm text-primary-foreground" />}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                {selectedCategories.size} of {DATA_CATEGORIES.length} categories selected
              </div>
              <Button
                onClick={() => exportMutation.mutate()}
                disabled={selectedCategories.size === 0 || hasActiveExport || exportMutation.isPending}
                className="gap-2"
              >
                {exportMutation.isPending ? (
                  <Loader2 className="icon-sm animate-spin" />
                ) : (
                  <Download className="icon-sm" />
                )}
                {hasActiveExport ? 'Export in Progress' : 'Request Export'}
              </Button>
            </div>

            {hasActiveExport && (
              <p className="text-xs text-status-warning mt-3 flex items-center gap-1">
                <AlertTriangle className="icon-sm" />
                Please wait for the current export to complete before requesting a new one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Delete Account Link */}
        <div className="mt-8 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="icon-md text-destructive-accessible shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Delete Your Account</p>
              <p className="text-xs text-muted-foreground mb-3">
                If you want to permanently delete your account and all associated data, 
                you can do so from your account settings.
              </p>
              <Button variant="outline" size="sm" className="text-destructive-accessible border-destructive/30 hover:bg-destructive/10" asChild>
                <Link href="/settings">
                  Go to Account Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
