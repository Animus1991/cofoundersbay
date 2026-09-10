'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Flag,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  MessageSquare,
  User,
  FileText,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Report = {
  id: string;
  type: 'user' | 'message' | 'content' | 'spam';
  reason: string;
  description?: string;
  reporterName: string;
  reporterAvatar?: string;
  targetName: string;
  targetType: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
};

function ReportCard({ report }: { report: Report }) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: <Clock className="icon-sm" aria-hidden="true" /> },
    reviewing: { color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: <AlertTriangle className="icon-sm" aria-hidden="true" /> },
    resolved: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: <CheckCircle2 className="icon-sm" aria-hidden="true" /> },
    dismissed: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: <XCircle className="icon-sm" aria-hidden="true" /> },
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-500/10 text-gray-600',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    high: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    user: <User className="icon-sm" aria-hidden="true" />,
    message: <MessageSquare className="icon-sm" aria-hidden="true" />,
    content: <FileText className="icon-sm" aria-hidden="true" />,
    spam: <AlertTriangle className="icon-sm" aria-hidden="true" />,
  };

  const config = statusConfig[report.status];

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="p-2 rounded-lg bg-secondary h-fit">
            {typeIcons[report.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{report.reason}</span>
                  <Badge variant="outline" className={cn('text-xs', priorityColors[report.priority])}>
                    {report.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Reported: <span className="font-medium">{report.targetName}</span> ({report.targetType})
                </p>
                {report.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {report.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs flex items-center gap-1', config.color)}>
                  {config.icon}
                  {report.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="icon-sm" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>View Target</DropdownMenuItem>
                    <DropdownMenuItem>Contact Reporter</DropdownMenuItem>
                    <DropdownMenuItem className="text-green-600 dark:text-green-400">Mark Resolved</DropdownMenuItem>
                    <DropdownMenuItem className="text-muted-foreground">Dismiss</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Avatar className="icon-sm">
                  <AvatarImage src={report.reporterAvatar} />
                  <AvatarFallback className="text-2xs">{report.reporterName[0]}</AvatarFallback>
                </Avatar>
                {report.reporterName}
              </span>
              <span>{report.createdAt}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pending');

  // Mock data
  const reports: Report[] = [
    {
      id: '1',
      type: 'user',
      reason: 'Harassment',
      description: 'User sent multiple unwanted messages after being asked to stop.',
      reporterName: 'John Doe',
      targetName: 'Mike Johnson',
      targetType: 'User',
      status: 'pending',
      priority: 'high',
      createdAt: 'Mar 21, 2025',
    },
    {
      id: '2',
      type: 'spam',
      reason: 'Spam Content',
      description: 'Posting promotional links in community discussions.',
      reporterName: 'Jane Smith',
      targetName: 'Tom Brown',
      targetType: 'User',
      status: 'reviewing',
      priority: 'medium',
      createdAt: 'Mar 20, 2025',
    },
    {
      id: '3',
      type: 'content',
      reason: 'Inappropriate Content',
      description: 'Profile contains misleading information about credentials.',
      reporterName: 'Sarah Williams',
      targetName: 'Alex Chen',
      targetType: 'Profile',
      status: 'pending',
      priority: 'medium',
      createdAt: 'Mar 19, 2025',
    },
    {
      id: '4',
      type: 'message',
      reason: 'Offensive Language',
      reporterName: 'David Kim',
      targetName: 'Conversation #1234',
      targetType: 'Message',
      status: 'resolved',
      priority: 'low',
      createdAt: 'Mar 18, 2025',
    },
  ];

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !search ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.targetName.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'all' || r.type === type;
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    return matchesSearch && matchesType && matchesTab;
  });

  const statusCounts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    reviewing: reports.filter((r) => r.status === 'reviewing').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight">Reports & Moderation</h1>
            <p className="text-muted-foreground">
              Review and manage user reports
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-xl font-bold">{reports.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.reviewing}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{statusCounts.resolved}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="reviewing">In Review ({statusCounts.reviewing})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="font-medium">No reports found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All caught up!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
