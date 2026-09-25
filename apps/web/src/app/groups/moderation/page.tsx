'use client';

import { useState } from 'react';
import {
  Shield,
  Flag,
  UserX,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  MoreVertical,
  Eye,
  Ban,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListEmptyState, NoFilterResults } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { UnavailableMenuItem } from '@/components/common/UnavailableMenuItem';
import { STATUS } from '@/lib/semantic-colors';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

type ModerationReport = {
  id: string;
  type: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'off-topic';
  contentType: 'post' | 'comment' | 'profile' | 'member';
  contentPreview: string;
  reportedBy: string;
  reportedUser: string;
  groupName: string;
  status: ReportStatus;
  reportedAt: string;
  priority: 'high' | 'medium' | 'low';
};

const TYPE_CONFIG: Record<ModerationReport['type'], { label: string; chip: string }> = {
  spam: { label: 'Spam', chip: STATUS.warning.chip },
  harassment: { label: 'Harassment', chip: STATUS.danger.chip },
  misinformation: { label: 'Misinformation', chip: STATUS.warning.chip },
  inappropriate: { label: 'Inappropriate', chip: STATUS.accent.chip },
  'off-topic': { label: 'Off-topic', chip: STATUS.neutral.chip },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; chip: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', chip: STATUS.warning.chip, icon: Clock },
  reviewed: { label: 'Reviewed', chip: STATUS.info.chip, icon: Eye },
  resolved: { label: 'Resolved', chip: STATUS.success.chip, icon: CheckCircle },
  dismissed: { label: 'Dismissed', chip: STATUS.neutral.chip, icon: XCircle },
};

const MOCK_REPORTS: ModerationReport[] = [
  { id: '1', type: 'spam', contentType: 'post', contentPreview: 'Check out this amazing investment opportunity! 10x returns guaranteed...', reportedBy: 'Alice M.', reportedUser: 'John D.', groupName: 'AI Founders Network', status: 'pending', reportedAt: '2 hours ago', priority: 'high' },
  { id: '2', type: 'harassment', contentType: 'comment', contentPreview: 'Your idea is terrible and you should quit...', reportedBy: 'Bob S.', reportedUser: 'Anonymous_123', groupName: 'SaaS Growth Hackers', status: 'pending', reportedAt: '4 hours ago', priority: 'high' },
  { id: '3', type: 'misinformation', contentType: 'post', contentPreview: 'This framework has been proven to cause 100% failure rates...', reportedBy: 'Carol K.', reportedUser: 'TechGuru99', groupName: 'AI Founders Network', status: 'reviewed', reportedAt: '1 day ago', priority: 'medium' },
  { id: '4', type: 'off-topic', contentType: 'post', contentPreview: 'Looking for a roommate in New York City...', reportedBy: 'Dave P.', reportedUser: 'Newuser2024', groupName: 'Early Stage Investors', status: 'resolved', reportedAt: '2 days ago', priority: 'low' },
  { id: '5', type: 'inappropriate', contentType: 'profile', contentPreview: 'Profile contains explicit promotional content...', reportedBy: 'Eve R.', reportedUser: 'SpamBot_001', groupName: 'CleanTech Builders', status: 'dismissed', reportedAt: '3 days ago', priority: 'low' },
];

function ReportCard({ report }: { report: ModerationReport }) {
  const typeCfg = TYPE_CONFIG[report.type];
  const statusCfg = STATUS_CONFIG[report.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="transition-all hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={cn('text-xs border', typeCfg.chip)}>
                <AlertTriangle className="mr-1 icon-sm" />
                {typeCfg.label}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">{report.contentType}</Badge>
              <Badge variant="outline" className={cn('text-xs border', statusCfg.chip)}>
                <StatusIcon className="mr-1 icon-sm" />
                {statusCfg.label}
              </Badge>
              {report.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">High Priority</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">
              &ldquo;{report.contentPreview}&rdquo;
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span>Reported by: <span className="font-medium text-foreground">{report.reportedBy}</span></span>
              <span>Against: <span className="font-medium text-foreground">{report.reportedUser}</span></span>
              <span>In: <span className="font-medium text-foreground">{report.groupName}</span></span>
              <span className="flex items-center gap-1"><Clock className="icon-sm" />{report.reportedAt}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Report actions">
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* The queue is sample data (see the notice above the list):
                  there is no group-report store behind it, so none of
                  these can act, and each says so. */}
              <UnavailableMenuItem icon={<Eye className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="View Content" el="Προβολή περιεχομένου" reasonEn="Sample report - group reports have no queue yet." reasonEl="Δείγμα - οι αναφορές ομάδων δεν έχουν ακόμη ουρά." />
              <UnavailableMenuItem icon={<CheckCircle className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Mark Resolved" el="Επίλυση" reasonEn="Sample report - group reports have no queue yet." reasonEl="Δείγμα - οι αναφορές ομάδων δεν έχουν ακόμη ουρά." />
              <UnavailableMenuItem icon={<XCircle className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Dismiss" el="Απόρριψη" reasonEn="Sample report - group reports have no queue yet." reasonEl="Δείγμα - οι αναφορές ομάδων δεν έχουν ακόμη ουρά." />
              <UnavailableMenuItem icon={<UserX className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Remove Member" el="Αφαίρεση μέλους" reasonEn="Sample report - group reports have no queue yet." reasonEl="Δείγμα - οι αναφορές ομάδων δεν έχουν ακόμη ουρά." />
              <UnavailableMenuItem className="text-destructive-accessible" icon={<Ban className="mr-2 mt-0.5 icon-sm" aria-hidden="true" />} en="Ban User" el="Αποκλεισμός χρήστη" reasonEn="Sample report - group reports have no queue yet." reasonEl="Δείγμα - οι αναφορές ομάδων δεν έχουν ακόμη ουρά." />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {report.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="default" className="h-7 text-xs" disabled title="Sample report - group reports have no queue yet"><CheckCircle className="mr-1 icon-sm" aria-hidden="true" />Resolve</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled title="Sample report - group reports have no queue yet"><XCircle className="mr-1 icon-sm" aria-hidden="true" />Dismiss</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive-accessible border-destructive/30" disabled title="Sample report - group reports have no queue yet"><Ban className="mr-1 icon-sm" aria-hidden="true" />Ban User</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GroupsModerationPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const pendingCount = MOCK_REPORTS.filter(r => r.status === 'pending').length;
  const highPriority = MOCK_REPORTS.filter(r => r.priority === 'high' && r.status === 'pending').length;

  const filtered = MOCK_REPORTS.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !search || r.reportedUser.toLowerCase().includes(q) || r.groupName.toLowerCase().includes(q) || r.contentPreview.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Offered to the assistant: the queue tab; the reports go out as a sample
  // list, since there is no group moderation queue behind them yet.
  usePageList([
    {
      id: 'reports',
      labelEn: 'Group reports',
      labelEl: 'Αναφορές ομάδων',
      rows: filtered.map((r) => `${r.type} · ${r.contentType} by ${r.reportedUser} in ${r.groupName} · ${r.status} · ${r.priority} priority`),
      total: MOCK_REPORTS.length,
      sample: true,
    },
  ]);
  usePageControls([
    choiceControl('report_tab', 'Report queue', 'Ουρά αναφορών', [
      { value: 'pending', en: 'Pending', el: 'Σε αναμονή' },
      { value: 'reviewed', en: 'Reviewed', el: 'Εξετασμένες' },
      { value: 'resolved', en: 'Resolved', el: 'Επιλυμένες' },
      { value: 'all', en: 'All', el: 'Όλες' },
    ], activeTab, setActiveTab),
  ]);

  return (
    <AppShell
      title="Moderation queue"
      description="Review and action community reports. High-priority items are flagged first so nothing urgent slips through."
    >
      <div className="space-y-6">
        <SampleDataNotice
          surface="Community moderation"
          detail="These reports are samples - reports filed against people are handled in the platform moderation queue (Admin -> Reports), and group-level reports have no store yet."
          askAiPrompt="Where do I handle reports about a member of my community?"
        />
        {/* Alert Banner */}
        {highPriority > 0 && (
          <Card className="border-status-danger-border/40 bg-status-danger-bg">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className={cn('icon-md shrink-0', STATUS.danger.icon)} />
              <p className="text-sm">
                <span className="font-semibold">{highPriority} high-priority report{highPriority > 1 ? 's' : ''}</span> require immediate attention
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 kpi-odd-span-md gap-4 md:grid-cols-4">
          {[
            { label: 'Pending', value: pendingCount, color: STATUS.warning.icon },
            { label: 'High Priority', value: highPriority, color: STATUS.danger.icon },
            { label: 'Resolved (30d)', value: MOCK_REPORTS.filter(r => r.status === 'resolved').length, color: STATUS.success.icon },
            { label: 'Total Reports', value: MOCK_REPORTS.length, color: 'text-foreground' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All ({MOCK_REPORTS.length})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filtered.map(report => <ReportCard key={report.id} report={report} />)}
            {filtered.length === 0 && (
              search ? (
                <NoFilterResults entity="reports" onClear={() => setSearch('')} />
              ) : activeTab === 'pending' ? (
                <ListEmptyState
                  icon={CheckCircle}
                  tone="success"
                  title="All caught up"
                  description="There are no pending reports to review. New community reports will appear here for action."
                />
              ) : (
                <ListEmptyState
                  icon={Shield}
                  tone="neutral"
                  title="No reports here"
                  description={`There are no ${activeTab === 'all' ? '' : `${activeTab} `}reports to show right now.`}
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
