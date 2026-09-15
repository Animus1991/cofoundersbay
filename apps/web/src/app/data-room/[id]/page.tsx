'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Folder,
  Upload,
  Download,
  Share2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Users,
  Trash2,
  Edit,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
  FileCode,
  FileJson,
  FileType2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Types
interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xls' | 'ppt' | 'img' | 'other';
  size: number;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  folderId?: string;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  status: 'active' | 'archived' | 'pending';
  tags: string[];
  description?: string;
}

interface Folder {
  id: string;
  name: string;
  createdAt: string;
  documentCount: number;
  isPublic: boolean;
  parentId?: string;
}

interface Investor {
  id: string;
  name: string;
  email: string;
  firm?: string;
  avatarUrl?: string;
  accessLevel: 'view' | 'download' | 'admin';
  lastAccessed?: string;
  documentsViewed: number;
  documentsDownloaded: number;
}

interface AccessLog {
  id: string;
  investorId: string;
  investorName: string;
  action: 'view' | 'download' | 'upload' | 'share';
  documentName: string;
  timestamp: string;
  ipAddress?: string;
}

// Mock data
const DEMO_DOCUMENTS: Document[] = [
  {
    id: '1',
    name: 'Pitch Deck v2.pdf',
    type: 'pdf',
    size: 5242880,
    uploadedAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
    uploadedBy: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    folderId: '1',
    isPublic: true,
    downloadCount: 12,
    viewCount: 45,
    status: 'active',
    tags: ['pitch', 'investors', '2026'],
    description: 'Updated pitch deck with Q1 2026 metrics',
  },
  {
    id: '2',
    name: 'Financial Projections.xlsx',
    type: 'xls',
    size: 1048576,
    uploadedAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
    uploadedBy: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    folderId: '2',
    isPublic: false,
    downloadCount: 8,
    viewCount: 15,
    status: 'active',
    tags: ['financials', 'projections', 'confidential'],
  },
  {
    id: '3',
    name: 'Product Demo.mp4',
    type: 'other',
    size: 52428800,
    uploadedAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
    uploadedBy: {
      id: '2',
      name: 'Marcus Chen',
    },
    folderId: '1',
    isPublic: true,
    downloadCount: 5,
    viewCount: 32,
    status: 'active',
    tags: ['demo', 'product', 'video'],
  },
  {
    id: '4',
    name: 'Cap Table.pdf',
    type: 'pdf',
    size: 2097152,
    uploadedAt: '2026-03-08T16:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
    uploadedBy: {
      id: '1',
      name: 'Elena Papadopoulos',
    },
    folderId: '2',
    isPublic: false,
    downloadCount: 3,
    viewCount: 8,
    status: 'active',
    tags: ['legal', 'cap-table', 'confidential'],
    description: 'Updated with new investor allocations',
  },
];

const DEMO_FOLDERS: Folder[] = [
  {
    id: '1',
    name: 'Pitch Materials',
    createdAt: '2026-03-01T00:00:00Z',
    documentCount: 2,
    isPublic: true,
  },
  {
    id: '2',
    name: 'Financials',
    createdAt: '2026-03-01T00:00:00Z',
    documentCount: 2,
    isPublic: false,
  },
  {
    id: '3',
    name: 'Legal Documents',
    createdAt: '2026-03-01T00:00:00Z',
    documentCount: 0,
    isPublic: false,
  },
];

const DEMO_INVESTORS: Investor[] = [
  {
    id: '1',
    name: 'Alex Dimitriou',
    email: 'alex@investor.vc',
    firm: 'Dimitriou Ventures',
    accessLevel: 'download',
    lastAccessed: '2026-03-27T14:30:00Z',
    documentsViewed: 12,
    documentsDownloaded: 5,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@techfund.com',
    firm: 'TechFund Capital',
    accessLevel: 'view',
    lastAccessed: '2026-03-26T10:00:00Z',
    documentsViewed: 8,
    documentsDownloaded: 0,
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael@seedplus.io',
    firm: 'SeedPlus',
    accessLevel: 'admin',
    lastAccessed: '2026-03-27T16:00:00Z',
    documentsViewed: 15,
    documentsDownloaded: 8,
  },
];

const DEMO_ACCESS_LOGS: AccessLog[] = [
  {
    id: '1',
    investorId: '1',
    investorName: 'Alex Dimitriou',
    action: 'download',
    documentName: 'Pitch Deck v2.pdf',
    timestamp: '2026-03-27T14:30:00Z',
    ipAddress: '192.168.1.100',
  },
  {
    id: '2',
    investorId: '2',
    investorName: 'Sarah Johnson',
    action: 'view',
    documentName: 'Product Demo.mp4',
    timestamp: '2026-03-27T13:15:00Z',
    ipAddress: '192.168.1.101',
  },
  {
    id: '3',
    investorId: '1',
    investorName: 'Alex Dimitriou',
    action: 'view',
    documentName: 'Financial Projections.xlsx',
    timestamp: '2026-03-27T12:00:00Z',
    ipAddress: '192.168.1.100',
  },
];

export default function DataRoomPage() {
  const params = useParams();
  const roomId = params?.id as string;
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const documents = DEMO_DOCUMENTS;
  const folders = DEMO_FOLDERS;
  const investors = DEMO_INVESTORS;
  const accessLogs = DEMO_ACCESS_LOGS;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short',
      day: 'numeric',
      year: 'numeric' });
  };

  const getFileIcon = (type: string) => {
    const icons: Record<string, any> = {
      pdf: FileText,
      doc: FileText,
      xls: FileSpreadsheet,
      ppt: Presentation,
      img: Image,
      other: File,
    };
    return icons[type] || File;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder ? doc.folderId === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const totalStorage = documents.reduce((sum, doc) => sum + doc.size, 0);
  const maxStorage = 1073741824; // 1GB
  const storageUsedPercent = (totalStorage / maxStorage) * 100;

  return (
    <AppShell
      showHelp
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareDialogOpen(true)}
          >
            <Share2 className="icon-sm mr-2" />
            Share Access
          </Button>
          <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="icon-sm mr-2" />
            Upload
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="investors">Investors ({investors.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Storage Usage */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="icon-sm text-muted-foreground" />
                  <span className="text-sm font-medium">Storage Usage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(totalStorage)} / {formatFileSize(maxStorage)}
                </span>
              </div>
              <Progress value={storageUsedPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {documents.length} documents • {storageUsedPercent.toFixed(1)}% used
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Folders Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Folders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedFolder === null
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Folder className="icon-sm" />
                  All Documents
                  <Badge variant="secondary" className="ml-auto">
                    {documents.length}
                  </Badge>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      selectedFolder === folder.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Folder className="icon-sm" />
                    {folder.name}
                    {!folder.isPublic && <Lock className="icon-sm ml-1" />}
                    <Badge variant="secondary" className="ml-auto">
                      {folder.documentCount}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[300px]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="icon-sm" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="icon-sm" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'list' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((document) => {
                        const FileIcon = getFileIcon(document.type);
                        return (
                          <TableRow key={document.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <FileIcon className="icon-md text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{document.name}</p>
                                  {document.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {document.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{document.type.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell>{formatFileSize(document.size)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {document.uploadedBy.name.split(' ').map((n) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(document.uploadedAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {document.isPublic ? (
                                <Badge variant="outline" className="bg-status-success-bg text-status-success border-status-success-border">
                                  <Unlock className="icon-sm mr-1" />
                                  Public
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-status-warning-bg text-status-warning border-status-warning-border">
                                  <Lock className="icon-sm mr-1" />
                                  Private
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="icon-sm" />
                                  {document.viewCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="icon-sm" />
                                  {document.downloadCount}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="icon-sm" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="icon-sm mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="icon-sm mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="icon-sm mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="icon-sm mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive-accessible">
                                    <Trash2 className="icon-sm mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map((document) => {
                      const FileIcon = getFileIcon(document.type);
                      return (
                        <Card key={document.id} className="group">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <FileIcon className="h-10 w-10 text-muted-foreground" />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="icon-sm" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View</DropdownMenuItem>
                                  <DropdownMenuItem>Download</DropdownMenuItem>
                                  <DropdownMenuItem>Share</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive-accessible">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="mt-4">
                              <p className="font-medium truncate">{document.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(document.size)} • {formatDate(document.uploadedAt)}
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                {document.isPublic ? (
                                  <Badge variant="outline" className="text-xs bg-status-success-bg text-status-success border-status-success-border">
                                    Public
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-status-warning-bg text-status-warning border-status-warning-border">
                                    Private
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Eye className="icon-sm" />
                                  {document.viewCount}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Investor Access</CardTitle>
              <Button size="sm">
                <Users className="icon-sm mr-2" />
                Add Investor
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Firm</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investors.map((investor) => (
                    <TableRow key={investor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {investor.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{investor.name}</p>
                            <p className="text-xs text-muted-foreground">{investor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{investor.firm || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            investor.accessLevel === 'admin'
                              ? 'bg-status-accent-bg text-status-accent border-status-accent-border'
                              : investor.accessLevel === 'download'
                              ? 'bg-status-info-bg text-status-info border-status-info-border'
                              : 'bg-muted text-foreground border-border'
                          )}
                        >
                          {investor.accessLevel.charAt(0).toUpperCase() + investor.accessLevel.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {investor.lastAccessed ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDate(investor.lastAccessed)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="icon-sm" />
                            {investor.documentsViewed} viewed
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="icon-sm" />
                            {investor.documentsDownloaded} downloaded
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="icon-sm" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Activity</DropdownMenuItem>
                            <DropdownMenuItem>Edit Access</DropdownMenuItem>
                            <DropdownMenuItem>Resend Invite</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive-accessible">
                              Revoke Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Access Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.investorName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            log.action === 'download'
                              ? 'bg-status-info-bg text-status-info border-status-info-border'
                              : log.action === 'view'
                              ? 'bg-status-success-bg text-status-success border-status-success-border'
                              : 'bg-muted text-foreground border-border'
                          )}
                        >
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.documentName}</TableCell>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require NDA</p>
                    <p className="text-sm text-muted-foreground">
                      Require investors to sign NDA before accessing
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Notify when documents are accessed or downloaded
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Download Watermarking</p>
                    <p className="text-sm text-muted-foreground">
                      Add investor email watermark to downloaded PDFs
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Room ID</p>
                  <p className="text-sm text-muted-foreground">{roomId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">March 1, 2026</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Owner</p>
                  <p className="text-sm text-muted-foreground">Elena Papadopoulos</p>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="destructive" size="sm">
                    <Trash2 className="icon-sm mr-2" />
                    Delete Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Drag and drop files or click to browse
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="icon-xl mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, XLS, PPT up to 100MB
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Select Folder</p>
              <select className="w-full p-2 border rounded-md">
                <option>Root</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="public" className="rounded" />
              <label htmlFor="public" className="text-sm">
                Make documents public to all investors
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Data Room</DialogTitle>
            <DialogDescription>
              Invite investors to access this data room
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Email Address</p>
              <Input placeholder="investor@firm.com" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Access Level</p>
              <select className="w-full p-2 border rounded-md">
                <option value="view">View Only</option>
                <option value="download">View & Download</option>
                <option value="admin">Admin Access</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notify" className="rounded" defaultChecked />
              <label htmlFor="notify" className="text-sm">
                Send email notification
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
