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
import { cn } from '@/lib/utils';

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

const TYPE_CONFIG: Record<ModerationReport['type'], { label: string; color: string }> = {
  spam: { label: 'Spam', color: 'bg-orange-500/10 text-orange-600' },
  harassment: { label: 'Harassment', color: 'bg-red-500/10 text-red-600' },
  misinformation: { label: 'Misinformation', color: 'bg-yellow-500/10 text-yellow-600' },
  inappropriate: { label: 'Inappropriate', color: 'bg-purple-500/10 text-purple-600' },
  'off-topic': { label: 'Off-topic', color: 'bg-gray-500/10 text-gray-600' },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  reviewed: { label: 'Reviewed', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Eye },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: XCircle },
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
              <Badge variant="secondary" className={cn('text-xs', typeCfg.color)}>
                <AlertTriangle className="mr-1 icon-2xs" aria-hidden="true" />
                {typeCfg.label}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">{report.contentType}</Badge>
              <Badge variant="outline" className={cn('text-xs', statusCfg.color)}>
                <StatusIcon className="mr-1 h-3 w-3" />
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
              <span className="flex items-center gap-1"><Clock className="icon-2xs" aria-hidden="true" />{report.reportedAt}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="icon-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Eye className="mr-2 icon-sm" aria-hidden="true" />View Content</DropdownMenuItem>
              <DropdownMenuItem><CheckCircle className="mr-2 icon-sm" aria-hidden="true" />Mark Resolved</DropdownMenuItem>
              <DropdownMenuItem><XCircle className="mr-2 icon-sm" aria-hidden="true" />Dismiss</DropdownMenuItem>
              <DropdownMenuItem><UserX className="mr-2 icon-sm" aria-hidden="true" />Remove Member</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive"><Ban className="mr-2 icon-sm" aria-hidden="true" />Ban User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {report.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="default" className="h-7 text-xs"><CheckCircle className="mr-1 icon-2xs" aria-hidden="true" />Resolve</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs"><XCircle className="mr-1 icon-2xs" aria-hidden="true" />Dismiss</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30"><Ban className="mr-1 icon-2xs" aria-hidden="true" />Ban User</Button>
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

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="icon-lg text-primary-emphasis" aria-hidden="true" />
            Moderation Queue
          </h1>
          <p className="text-muted-foreground">Review and action community reports</p>
        </div>

        {/* Alert Banner */}
        {highPriority > 0 && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="icon-md text-red-500 shrink-0" aria-hidden="true" />
              <p className="text-sm">
                <span className="font-semibold">{highPriority} high-priority report{highPriority > 1 ? 's' : ''}</span> require immediate attention
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Pending', value: pendingCount, color: 'text-amber-500' },
            { label: 'High Priority', value: highPriority, color: 'text-red-500' },
            { label: 'Resolved (30d)', value: MOCK_REPORTS.filter(r => r.status === 'resolved').length, color: 'text-green-500' },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
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
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" aria-hidden="true" />
                  <p className="font-medium">No reports found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'pending' ? 'All caught up! No pending reports.' : 'No reports match your search.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
