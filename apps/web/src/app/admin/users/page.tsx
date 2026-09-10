'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  Mail,
  CheckCircle2,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'active' | 'suspended' | 'pending' | 'banned';
  verified: boolean;
  createdAt: string;
  lastActive: string;
  tenant?: string;
};

function UserRow({ user }: { user: User }) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    active: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', icon: <CheckCircle2 className="icon-sm" aria-hidden="true" /> },
    suspended: { color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: <AlertTriangle className="icon-sm" aria-hidden="true" /> },
    pending: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: null },
    banned: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: <Ban className="icon-sm" aria-hidden="true" /> },
  };

  const config = statusConfig[user.status];
  const initials = user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '??';

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/p/${user.id}`} className="font-medium hover:text-primary-emphasis transition-colors">
            {user.name}
          </Link>
          {user.verified && <CheckCircle2 className="icon-sm text-primary-emphasis" aria-hidden="true" />}
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="hidden md:block text-sm text-muted-foreground w-24">
        {user.role}
      </div>
      <div className="hidden lg:block text-sm text-muted-foreground w-32">
        {user.tenant || 'Public'}
      </div>
      <div className="hidden md:block text-sm text-muted-foreground w-28">
        {user.lastActive}
      </div>
      <Badge variant="outline" className={cn('text-xs flex items-center gap-1 w-24 justify-center', config.color)}>
        {config.icon}
        {user.status}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="icon-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/p/${user.id}`}>View Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="mr-2 icon-sm" aria-hidden="true" />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Shield className="mr-2 icon-sm" aria-hidden="true" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === 'active' && (
            <DropdownMenuItem className="text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mr-2 icon-sm" aria-hidden="true" />
              Suspend User
            </DropdownMenuItem>
          )}
          {user.status === 'suspended' && (
            <DropdownMenuItem className="text-green-600 dark:text-green-400">
              <CheckCircle2 className="mr-2 icon-sm" aria-hidden="true" />
              Reactivate User
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-destructive-emphasis">
            <UserX className="mr-2 icon-sm" aria-hidden="true" />
            Ban User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Mock data
  const users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Founder',
      status: 'active',
      verified: true,
      createdAt: 'Jan 15, 2025',
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Mentor',
      status: 'active',
      verified: true,
      createdAt: 'Feb 1, 2025',
      lastActive: '1 day ago',
      tenant: 'TechStars Athens',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'Founder',
      status: 'suspended',
      verified: false,
      createdAt: 'Mar 10, 2025',
      lastActive: '1 week ago',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      role: 'Investor',
      status: 'active',
      verified: true,
      createdAt: 'Mar 5, 2025',
      lastActive: '3 hours ago',
    },
    {
      id: '5',
      name: 'Tom Brown',
      email: 'tom@example.com',
      role: 'Founder',
      status: 'pending',
      verified: false,
      createdAt: 'Mar 20, 2025',
      lastActive: 'Never',
    },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = role === 'all' || u.role.toLowerCase() === role;
    const matchesStatus = status === 'all' || u.status === status;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const statusCounts = {
    all: users.length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    pending: users.filter((u) => u.status === 'pending').length,
  };

  return (
    <AppShell>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage platform users and permissions
            </p>
          </div>
          <Button>Export Users</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{statusCounts.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-gray-600">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Suspended</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.suspended}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
              <SelectItem value="mentor">Mentor</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card>
          <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground">
            <div className="w-10" />
            <div className="flex-1">User</div>
            <div className="w-24">Role</div>
            <div className="hidden lg:block w-32">Tenant</div>
            <div className="w-28">Last Active</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-8" />
          </div>
          {filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
          {filteredUsers.length === 0 && (
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
              <h3 className="font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
