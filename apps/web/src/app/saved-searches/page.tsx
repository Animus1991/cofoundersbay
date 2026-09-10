'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Bell, BellOff, Trash2, Play, Clock, Filter,
  Plus, Edit2, MoreHorizontal, CheckCircle, AlertCircle,
  Sparkles, Users, Briefcase, MapPin, Target, Loader2,
} from 'lucide-react';
import {
  listSavedSearches,
  updateSavedSearch,
  deleteSavedSearch,
  type SavedSearch,
} from '@/lib/api';
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

function SearchCard({
  search,
  onRun,
  onToggleAlerts,
  onEdit,
  onDelete,
}: {
  search: SavedSearch;
  onRun: () => void;
  onToggleAlerts: (current: boolean) => void;
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
              <Search className="icon-sm" aria-hidden="true" />
              <span className="truncate">{search.query}</span>
            </p>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {search.filters.roles?.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  <Users className="icon-sm mr-1" aria-hidden="true" />
                  {role}
                </Badge>
              ))}
              {search.filters.industries?.slice(0, 2).map((ind) => (
                <Badge key={ind} variant="outline" className="text-xs">
                  <Briefcase className="icon-sm mr-1" aria-hidden="true" />
                  {ind}
                </Badge>
              ))}
              {search.filters.locations?.slice(0, 1).map((loc) => (
                <Badge key={loc} variant="outline" className="text-xs">
                  <MapPin className="icon-sm mr-1" aria-hidden="true" />
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
                <Target className="icon-sm" aria-hidden="true" />
                {search.resultCount} results
              </span>
              <span className="flex items-center gap-1">
                <Clock className="icon-sm" aria-hidden="true" />
                Last run {timeAgo}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={search.alertsEnabled}
                onCheckedChange={() => onToggleAlerts(search.alertsEnabled)}
                aria-label="Toggle alerts"
              />
              {search.alertsEnabled ? (
                <Bell className="icon-sm text-primary-emphasis" aria-hidden="true" />
              ) : (
                <BellOff className="icon-sm text-muted-foreground" aria-hidden="true" />
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onRun}>
              <Play className="icon-sm mr-1" aria-hidden="true" />
              Run
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon">
                  <MoreHorizontal className="icon-sm" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="icon-sm mr-2" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive-emphasis">
                  <Trash2 className="icon-sm mr-2" aria-hidden="true" />
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
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => listSavedSearches(),
  });

  const searches = data?.searches ?? [];

  const toggleAlertsMutation = useMutation({
    mutationFn: ({ id, alertsEnabled }: { id: string; alertsEnabled: boolean }) =>
      updateSavedSearch(id, { alertsEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      success('Alert settings updated');
    },
    onError: () => showError('Failed to update alerts'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<SavedSearch, 'name' | 'alertsEnabled' | 'alertFrequency'>> }) =>
      updateSavedSearch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      success('Search updated');
    },
    onError: () => showError('Failed to update search'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      setDeleteConfirm(null);
      success('Search deleted');
    },
    onError: () => showError('Failed to delete search'),
  });

  const handleRun = (search: SavedSearch) => {
    const params = new URLSearchParams();
    params.set('q', search.query);
    if (search.filters.roles?.length) params.set('roles', search.filters.roles.join(','));
    if (search.filters.skills?.length) params.set('skills', search.filters.skills.join(','));
    if (search.filters.industries?.length) params.set('industries', search.filters.industries.join(','));
    if (search.filters.locations?.length) params.set('locations', search.filters.locations.join(','));
    router.push(`/discover?${params.toString()}`);
  };

  const handleToggleAlerts = (id: string, current: boolean) => {
    toggleAlertsMutation.mutate({ id, alertsEnabled: !current });
  };

  const handleSaveEdit = (data: Partial<SavedSearch>) => {
    if (!editingSearch) return;
    editMutation.mutate({ id: editingSearch.id, data });
    setEditingSearch(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
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
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold text-foreground flex items-center gap-2">
              <Search className="icon-lg text-primary-emphasis" aria-hidden="true" />
              Saved Searches
            </h1>
            <p className="text-muted-foreground mt-1">
              {searches.length} saved searches
              {totalNewResults > 0 && (
                <span className="text-primary-emphasis ml-2">• {totalNewResults} new results</span>
              )}
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="icon-sm mr-2" aria-hidden="true" />
            New Search
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Search className="icon-md text-primary-emphasis" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{searches.length}</p>
                <p className="text-xs text-muted-foreground">Saved Searches</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Bell className="icon-md text-emerald-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {searches.filter((s) => s.alertsEnabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Sparkles className="icon-md text-amber-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-bold">{totalNewResults}</p>
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
                <Plus className="icon-sm mr-2" aria-hidden="true" />
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
                onToggleAlerts={(current) => handleToggleAlerts(search.id, current)}
                onEdit={() => setEditingSearch(search)}
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
