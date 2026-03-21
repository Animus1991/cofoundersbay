'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, MoreVertical, Pin, Archive, Trash2,
  FileText, Image as ImageIcon, Link as LinkIcon, StickyNote,
  Grid3X3, List, Loader2, FolderOpen, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  listResearchBoards,
  createResearchBoard,
  createResearchNode,
  updateResearchBoard,
  deleteResearchBoard,
  type ResearchBoard,
} from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { BoardTemplatesDialog, type BoardTemplate } from '@/components/research/BoardTemplates';

const BOARD_COLORS = [
  { name: 'Default', value: null },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
];

const BOARD_ICONS = [
  { name: 'Document', value: 'document', icon: FileText },
  { name: 'Image', value: 'image', icon: ImageIcon },
  { name: 'Link', value: 'link', icon: LinkIcon },
  { name: 'Note', value: 'note', icon: StickyNote },
  { name: 'Sparkles', value: 'sparkles', icon: Sparkles },
];

function getIconComponent(iconValue: string | null) {
  const found = BOARD_ICONS.find((i) => i.value === iconValue);
  return found?.icon ?? FileText;
}

export default function ResearchBoardsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardColor, setNewBoardColor] = useState<string | null>(null);
  const [newBoardIcon, setNewBoardIcon] = useState<string>('document');

  const { data, isLoading, error } = useQuery({
    queryKey: ['research-boards'],
    queryFn: listResearchBoards,
  });

  const createMutation = useMutation({
    mutationFn: createResearchBoard,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['research-boards'] });
      success('Board created', `"${result.board.title}" is ready`);
      setCreateDialogOpen(false);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setNewBoardColor(null);
      setNewBoardIcon('document');
      router.push(`/research/${result.board.id}`);
    },
    onError: (err) => {
      showError('Failed to create board', err instanceof Error ? err.message : 'Please try again');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: Parameters<typeof updateResearchBoard>[1] }) =>
      updateResearchBoard(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-boards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResearchBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-boards'] });
      success('Board deleted', 'The board has been removed');
    },
    onError: (err) => {
      showError('Failed to delete', err instanceof Error ? err.message : 'Please try again');
    },
  });

  const boards = data?.boards ?? [];
  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedBoards = filteredBoards.filter((b) => b.isPinned);
  const regularBoards = filteredBoards.filter((b) => !b.isPinned);

  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) return;
    createMutation.mutate({
      title: newBoardTitle.trim(),
      description: newBoardDescription.trim() || undefined,
      color: newBoardColor ?? undefined,
      icon: newBoardIcon,
    });
  };

  const handleTogglePin = (board: ResearchBoard) => {
    updateMutation.mutate({ boardId: board.id, data: { isPinned: !board.isPinned } });
  };

  const handleArchive = (board: ResearchBoard) => {
    updateMutation.mutate({ boardId: board.id, data: { isArchived: true } });
    success('Board archived', `"${board.title}" has been archived`);
  };

  const handleDelete = (board: ResearchBoard) => {
    if (confirm(`Delete "${board.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(board.id);
    }
  };

  const handleSelectTemplate = async (template: BoardTemplate) => {
    try {
      // Create the board first
      const result = await createResearchBoard({
        title: template.name,
        description: template.description,
        color: template.color,
        tags: template.tags,
      });

      // Then create all the template nodes
      for (const node of template.initialNodes) {
        await createResearchNode(result.board.id, {
          type: node.type,
          title: node.title,
          content: node.content,
          posX: node.posX,
          posY: node.posY,
          width: node.width,
          height: node.height,
          color: node.color,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['research-boards'] });
      success('Board created from template', `"${template.name}" is ready with ${template.initialNodes.length} nodes`);
      router.push(`/research/${result.board.id}`);
    } catch (err) {
      showError('Failed to create from template', err instanceof Error ? err.message : 'Please try again');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-destructive mb-4">Failed to load research boards</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['research-boards'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Research Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Visual research boards for startup ecosystem intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Use Template
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Board
          </Button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {boards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <FolderOpen className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No research boards yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first research board to start organizing startup ecosystem research,
            market analysis, and strategic insights.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Board
          </Button>
        </div>
      )}

      {/* Pinned Boards */}
      {pinnedBoards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned
          </h2>
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3'
          )}>
            {pinnedBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                viewMode={viewMode}
                onOpen={() => router.push(`/research/${board.id}`)}
                onTogglePin={() => handleTogglePin(board)}
                onArchive={() => handleArchive(board)}
                onDelete={() => handleDelete(board)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Boards */}
      {regularBoards.length > 0 && (
        <div>
          {pinnedBoards.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground mb-4">All Boards</h2>
          )}
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3'
          )}>
            {regularBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                viewMode={viewMode}
                onOpen={() => router.push(`/research/${board.id}`)}
                onTogglePin={() => handleTogglePin(board)}
                onArchive={() => handleArchive(board)}
                onDelete={() => handleDelete(board)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredBoards.length === 0 && boards.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No boards match your search</p>
        </div>
      )}

      {/* Create Board Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Research Board</DialogTitle>
            <DialogDescription>
              A new workspace for organizing research, documents, and insights
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Market Research Q1 2024"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Brief description of this board's purpose"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 flex-wrap">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setNewBoardColor(color.value)}
                    className={cn(
                      'w-8 h-8 rounded-lg border-2 transition-all',
                      newBoardColor === color.value
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105',
                      !color.value && 'bg-secondary'
                    )}
                    style={color.value ? { backgroundColor: color.value } : undefined}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {BOARD_ICONS.map((icon) => {
                  const Icon = icon.icon;
                  return (
                    <button
                      key={icon.value}
                      onClick={() => setNewBoardIcon(icon.value)}
                      className={cn(
                        'w-10 h-10 rounded-lg border flex items-center justify-center transition-all',
                        newBoardIcon === icon.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                      title={icon.name}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBoard}
              disabled={!newBoardTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <BoardTemplatesDialog
        open={templatesDialogOpen}
        onClose={() => setTemplatesDialogOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

function BoardCard({
  board,
  viewMode,
  onOpen,
  onTogglePin,
  onArchive,
  onDelete,
}: {
  board: ResearchBoard;
  viewMode: 'grid' | 'list';
  onOpen: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const Icon = getIconComponent(board.icon);

  if (viewMode === 'list') {
    return (
      <Card
        className="cursor-pointer hover:border-primary/40 transition-colors"
        onClick={onOpen}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: board.color ? `${board.color}20` : 'var(--secondary)' }}
          >
            <Icon
              className="h-6 w-6"
              style={{ color: board.color ?? 'var(--muted-foreground)' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{board.title}</h3>
              {board.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
            </div>
            {board.description && (
              <p className="text-sm text-muted-foreground truncate">{board.description}</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground shrink-0">
            {board.nodeCount} items
          </div>
          <div className="text-sm text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onTogglePin}>
                <Pin className="h-4 w-4 mr-2" />
                {board.isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-md group"
      onClick={onOpen}
    >
      <CardContent className="p-0">
        <div
          className="h-32 rounded-t-xl flex items-center justify-center relative"
          style={{ backgroundColor: board.color ? `${board.color}15` : 'var(--secondary)' }}
        >
          <Icon
            className="h-12 w-12 opacity-40"
            style={{ color: board.color ?? 'var(--muted-foreground)' }}
          />
          {board.isPinned && (
            <div className="absolute top-3 left-3">
              <Pin className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onTogglePin}>
                  <Pin className="h-4 w-4 mr-2" />
                  {board.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
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
        <div className="p-4">
          <h3 className="font-semibold truncate mb-1">{board.title}</h3>
          {board.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{board.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{board.nodeCount} items</span>
            <span>{formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
