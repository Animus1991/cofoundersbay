'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Bell, BellOff, Trash2, Play, Clock, Filter,
  Plus, Edit2, MoreHorizontal, CheckCircle, AlertCircle,
  Sparkles, Users, Briefcase, MapPin, Target,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type SavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: {
    roles?: string[];
    skills?: string[];
    industries?: string[];
    locations?: string[];
    stage?: string[];
  };
  alertsEnabled: boolean;
  alertFrequency: 'instant' | 'daily' | 'weekly';
  lastRun?: string;
  resultCount?: number;
  newResults?: number;
  createdAt: string;
};

const DEMO_SEARCHES: SavedSearch[] = [
  {
    id: '1',
    name: 'Technical Co-founders in Athens',
    query: 'CTO OR "technical co-founder"',
    filters: {
      roles: ['cofounder', 'technical_talent'],
      locations: ['Athens', 'Greece'],
      skills: ['React', 'Node.js', 'Python'],
    },
    alertsEnabled: true,
    alertFrequency: 'daily',
    lastRun: '2026-03-26T10:00:00Z',
    resultCount: 23,
    newResults: 3,
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'SaaS Mentors with Fundraising Experience',
    query: 'mentor fundraising',
    filters: {
      roles: ['mentor', 'advisor'],
      industries: ['SaaS', 'B2B'],
      skills: ['Fundraising', 'Pitch Deck', 'Investor Relations'],
    },
    alertsEnabled: true,
    alertFrequency: 'weekly',
    lastRun: '2026-03-25T08:00:00Z',
    resultCount: 15,
    newResults: 1,
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Pre-seed Investors in Europe',
    query: 'angel OR "pre-seed"',
    filters: {
      roles: ['investor', 'angel'],
      locations: ['Europe'],
      stage: ['pre_seed', 'seed'],
    },
    alertsEnabled: false,
    alertFrequency: 'instant',
    lastRun: '2026-03-20T14:00:00Z',
    resultCount: 42,
    newResults: 0,
    createdAt: '2026-01-10T00:00:00Z',
  },
];

function SearchCard({
  search,
  onRun,
  onToggleAlerts,
  onEdit,
  onDelete,
}: {
  search: SavedSearch;
  onRun: () => void;
  onToggleAlerts: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const filterCount = Object.values(search.filters).filter((v) => v && v.length > 0).length;
  const lastRunDate = search.lastRun ? new Date(search.lastRun) : null;
  const timeAgo = lastRunDate
    ? formatTimeAgo(lastRunDate)
    : 'Never';

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{search.name}</h3>
              {search.newResults && search.newResults > 0 && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {search.newResults} new
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Search className="h-3 w-3" />
              <span className="truncate">{search.query}</span>
            </p>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {search.filters.roles?.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {role}
                </Badge>
              ))}
              {search.filters.industries?.slice(0, 2).map((ind) => (
                <Badge key={ind} variant="outline" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {ind}
                </Badge>
              ))}
              {search.filters.locations?.slice(0, 1).map((loc) => (
                <Badge key={loc} variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {loc}
                </Badge>
              ))}
              {filterCount > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{filterCount - 3} more
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {search.resultCount} results
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last run {timeAgo}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={search.alertsEnabled}
                onCheckedChange={onToggleAlerts}
                aria-label="Toggle alerts"
              />
              {search.alertsEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onRun}>
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function EditSearchDialog({
  search,
  open,
  onClose,
  onSave,
}: {
  search: SavedSearch | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<SavedSearch>) => void;
}) {
  const [name, setName] = useState(search?.name || '');
  const [alertFrequency, setAlertFrequency] = useState(search?.alertFrequency || 'daily');

  const handleSave = () => {
    onSave({ name, alertFrequency });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Saved Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Search Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My saved search"
            />
          </div>

          <div className="space-y-2">
            <Label>Alert Frequency</Label>
            <div className="flex gap-2">
              {(['instant', 'daily', 'weekly'] as const).map((freq) => (
                <Button
                  key={freq}
                  variant={alertFrequency === freq ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertFrequency(freq)}
                  className="capitalize"
                >
                  {freq}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [searches, setSearches] = useState<SavedSearch[]>(DEMO_SEARCHES);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleRun = (search: SavedSearch) => {
    // Build query params from search
    const params = new URLSearchParams();
    params.set('q', search.query);
    if (search.filters.roles?.length) params.set('roles', search.filters.roles.join(','));
    if (search.filters.skills?.length) params.set('skills', search.filters.skills.join(','));
    if (search.filters.industries?.length) params.set('industries', search.filters.industries.join(','));
    if (search.filters.locations?.length) params.set('locations', search.filters.locations.join(','));

    router.push(`/discover?${params.toString()}`);
  };

  const handleToggleAlerts = (id: string) => {
    setSearches((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, alertsEnabled: !s.alertsEnabled } : s
      )
    );
    success('Alert settings updated');
  };

  const handleEdit = (search: SavedSearch) => {
    setEditingSearch(search);
  };

  const handleSaveEdit = (data: Partial<SavedSearch>) => {
    if (!editingSearch) return;
    setSearches((prev) =>
      prev.map((s) =>
        s.id === editingSearch.id ? { ...s, ...data } : s
      )
    );
    success('Search updated');
  };

  const handleDelete = (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
    success('Search deleted');
  };

  const handleCreateNew = () => {
    router.push('/discover?saveSearch=true');
  };

  const totalNewResults = searches.reduce((sum, s) => sum + (s.newResults || 0), 0);

  return (
    <AppShell
      title="Saved Searches"
      description="Manage your saved search filters and get notified of new matches"
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Saved Searches
            </h1>
            <p className="text-muted-foreground mt-1">
              {searches.length} saved searches
              {totalNewResults > 0 && (
                <span className="text-primary ml-2">• {totalNewResults} new results</span>
              )}
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Search
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{searches.length}</p>
                <p className="text-xs text-muted-foreground">Saved Searches</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Bell className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {searches.filter((s) => s.alertsEnabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNewResults}</p>
                <p className="text-xs text-muted-foreground">New Results</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search List */}
        {searches.length === 0 ? (
          <EmptyState
            illustration="search"
            title="No saved searches"
            description="Save your search queries to quickly find matching profiles and get alerts for new results"
            action={
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Search
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {searches.map((search) => (
              <SearchCard
                key={search.id}
                search={search}
                onRun={() => handleRun(search)}
                onToggleAlerts={() => handleToggleAlerts(search.id)}
                onEdit={() => handleEdit(search)}
                onDelete={() => setDeleteConfirm(search.id)}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <EditSearchDialog
          search={editingSearch}
          open={!!editingSearch}
          onClose={() => setEditingSearch(null)}
          onSave={handleSaveEdit}
        />

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Saved Search?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              This will permanently delete this saved search and stop any associated alerts.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
