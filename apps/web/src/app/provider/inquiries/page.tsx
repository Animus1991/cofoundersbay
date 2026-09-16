'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Inbox,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/common/EmptyState';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

type Inquiry = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientCompany?: string;
  service: string;
  message: string;
  receivedAt: string;
  status: 'new' | 'replied' | 'converted' | 'declined';
  budget?: string;
};

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    new: { color: 'bg-status-info-bg text-status-info border-status-info-border', icon: Mail },
    replied: { color: 'bg-status-warning-bg text-status-warning border-status-warning-border', icon: Clock },
    converted: { color: 'bg-status-success-bg text-status-success border-status-success-border', icon: CheckCircle },
    declined: { color: 'bg-gray-500/10 text-muted-foreground border-gray-500/20', icon: XCircle },
  };

  const config = statusConfig[inquiry.status];
  const StatusIcon = config.icon;

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={inquiry.clientAvatar} />
            <AvatarFallback>{inquiry.clientName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{inquiry.clientName}</span>
                  <Badge variant="outline" className={cn('text-xs', config.color)}>
                    <StatusIcon className="mr-1 icon-sm" />
                    {inquiry.status}
                  </Badge>
                </div>
                {inquiry.clientCompany && (
                  <p className="text-sm text-muted-foreground">{inquiry.clientCompany}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{inquiry.receivedAt}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="icon-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Reply</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Converted</DropdownMenuItem>
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive-accessible">Decline</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <Badge variant="secondary" className="mt-2 text-xs">
              {inquiry.service}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">{inquiry.message}</p>
            {inquiry.status === 'new' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm">Reply</Button>
                <Button size="sm" variant="outline">View Details</Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MOCK_INQUIRIES: Inquiry[] = [
    {
      id: '1',
      clientName: 'John Doe',
      clientCompany: 'TechStart Inc',
      service: 'Startup Legal Package',
      message: 'Hi, I need help with my startup incorporation documents. We are a team of 3 co-founders and need founder agreements as well.',
      receivedAt: '2 hours ago',
      status: 'new',
      budget: '$2,000-3,000',
    },
    {
      id: '2',
      clientName: 'Jane Smith',
      clientCompany: 'GreenTech Co',
      service: 'Financial Model Creation',
      message: 'Looking for help with our Series A financial model. We need 5-year projections with multiple scenarios.',
      receivedAt: '1 day ago',
      status: 'replied',
      budget: '$3,500-5,000',
    },
    {
      id: '3',
      clientName: 'Mike Johnson',
      clientCompany: 'DataFlow',
      service: 'Contract Review',
      message: 'Need to review our terms of service and privacy policy before launch.',
      receivedAt: '2 days ago',
      status: 'converted',
      budget: '$1,500',
    },
    {
      id: '4',
      clientName: 'Sarah Williams',
      clientCompany: 'HealthPulse',
      service: 'Startup Legal Package',
      message: 'Interested in your legal package. Can you provide more details on what is included?',
      receivedAt: '3 days ago',
      status: 'new',
      budget: '$2,500',
    },
    {
      id: '5',
      clientName: 'Tom Brown',
      service: 'Pitch Deck Design',
      message: 'Looking for a pitch deck redesign for our upcoming fundraise.',
      receivedAt: '1 week ago',
      status: 'declined',
      budget: '$800',
    },
  ];

export default function ProviderInquiriesPage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const inquiries = showDemoData ? MOCK_INQUIRIES : [];

  const conversionRate = Math.round((inquiries.filter((i) => i.status === 'converted').length / Math.max(inquiries.length, 1)) * 100);
  const responseRate = Math.round(((inquiries.filter((i) => i.status === 'replied' || i.status === 'converted').length) / Math.max(inquiries.length, 1)) * 100);

  const filteredInquiries = inquiries.filter((i) => {
    const matchesSearch =
      !search ||
      i.clientName.toLowerCase().includes(search.toLowerCase()) ||
      i.service.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || i.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    replied: inquiries.filter((i) => i.status === 'replied').length,
    converted: inquiries.filter((i) => i.status === 'converted').length,
  };

  return (
    <AppShell
      title="Inquiries"
      description="Manage incoming service inquiries"
    >
      <div className="space-y-6">

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Inquiries', value: inquiries.length, icon: Inbox, color: 'text-primary-accessible' },
            { label: 'New', value: counts.new, icon: Mail, color: 'text-status-info' },
            { label: 'Response Rate', value: `${responseRate}%`, icon: TrendingUp, color: 'text-status-success' },
            { label: 'Conversion', value: `${conversionRate}%`, icon: DollarSign, color: 'text-status-warning' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg p-2 bg-secondary"><Icon className={cn('icon-sm', color)} /></div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-2xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="new">
              New <Badge variant="secondary" className="ml-1">{counts.new}</Badge>
            </TabsTrigger>
            <TabsTrigger value="replied">
              Replied <Badge variant="secondary" className="ml-1">{counts.replied}</Badge>
            </TabsTrigger>
            <TabsTrigger value="converted">
              Converted <Badge variant="secondary" className="ml-1">{counts.converted}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredInquiries.map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
            {filteredInquiries.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                  <h3 className="font-medium">No inquiries found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'all'
                      ? 'You have no inquiries yet'
                      : `No ${activeTab} inquiries`}
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
