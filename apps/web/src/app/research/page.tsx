'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, MoreVertical, Pin, Archive, Trash2,
  Grid3X3, List, Loader2, AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { el as elLocale, enUS } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
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
import { useConfirm, deleteConfirmCopy } from '@/components/ui/confirm-dialog';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { commonEn, commonEl } from '@/lib/i18n/strings-common';
import {
  researchEn,
  researchEl,
  useResearchPrimaryText,
} from '@/lib/i18n/strings-research';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import {
  listResearchBoards,
  createResearchBoard,
  createResearchNode,
  updateResearchBoard,
  deleteResearchBoard,
  type ResearchBoard,
} from '@/lib/api';
import { BoardTemplatesDialog, type BoardTemplate } from '@/components/research/BoardTemplates';
import { BehavioralNudge } from '@/components/behavioral/BehavioralNudge';

const BOARD_COLORS: { nameKey: 'color_default' | 'color_blue' | 'color_green' | 'color_purple' | 'color_orange' | 'color_pink' | 'color_cyan'; value: string | null }[] = [
  { nameKey: 'color_default', value: null },
  { nameKey: 'color_blue', value: '#3B82F6' },
  { nameKey: 'color_green', value: '#22C55E' },
  { nameKey: 'color_purple', value: '#A855F7' },
  { nameKey: 'color_orange', value: '#F97316' },
  { nameKey: 'color_pink', value: '#EC4899' },
  { nameKey: 'color_cyan', value: '#06B6D4' },
];

const BOARD_ICONS: { nameKey: 'icon_document' | 'icon_image' | 'icon_link' | 'icon_note' | 'icon_sparkles'; value: string; glyph: CfbGlyphName }[] = [
  { nameKey: 'icon_document', value: 'document', glyph: 'book' },
  { nameKey: 'icon_image', value: 'image', glyph: 'bookmark' },
  { nameKey: 'icon_link', value: 'link', glyph: 'compare' },
  { nameKey: 'icon_note', value: 'note', glyph: 'research' },
  { nameKey: 'icon_sparkles', value: 'sparkles', glyph: 'spark' },
];

function getBoardGlyph(iconValue: string | null): CfbGlyphName {
  return BOARD_ICONS.find((i) => i.value === iconValue)?.glyph ?? 'research';
}

/**
 * Greek for the preview board seeded by `lib/preview-api.ts`. Keyed by the
 * exact English description, so user-authored boards are never touched.
 */
const PREVIEW_BOARD_DESC_EL: Record<string, string> = {
  'Sample research board for the preview.': 'Δείγμα πίνακα έρευνας για την προεπισκόπηση.',
};

export default function ResearchBoardsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const confirm = useConfirm();
  const t = useResearchPrimaryText();
  const { primary } = useLanguagePreference();
  const dateLocale = primary === 'el' ? elLocale : enUS;

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
      success(t(researchEn('created'), researchEl('created')), `"${result.board.title}" ${t(researchEn('created_ready'), researchEl('created_ready'))}`);
      setCreateDialogOpen(false);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setNewBoardColor(null);
      setNewBoardIcon('document');
      router.push(`/research/${result.board.id}`);
    },
    onError: (err) => {
      showError(t(researchEn('fail_create'), researchEl('fail_create')), err instanceof Error ? err.message : t(researchEn('try_again'), researchEl('try_again')));
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
      success(t(researchEn('deleted'), researchEl('deleted')), t(researchEn('deleted_hint'), researchEl('deleted_hint')));
    },
    onError: (err) => {
      showError(t(researchEn('fail_delete'), researchEl('fail_delete')), err instanceof Error ? err.message : t(researchEn('try_again'), researchEl('try_again')));
    },
  });

  const boards = data?.boards ?? [];
  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const handleArchive = async (board: ResearchBoard) => {
    const ok = await confirm({
      title: <BilingualText en={`Archive board “${board.title}”?`} el={`Αρχειοθέτηση πίνακα “${board.title}”;`} />,
      description: (
        <BilingualText
          en="It moves out of your active boards. You can restore it later."
          el="Μεταφέρεται εκτός των ενεργών πινάκων. Μπορείτε να τον επαναφέρετε αργότερα."
        />
      ),
      confirmLabel: <BilingualText en={researchEn('archive')} el={researchEl('archive')} compact />,
      variant: 'default',
    });
    if (!ok) return;
    updateMutation.mutate({ boardId: board.id, data: { isArchived: true } });
    success(t(researchEn('archived'), researchEl('archived')), `"${board.title}"`);
  };

  const handleDelete = async (board: ResearchBoard) => {
    if (await confirm(deleteConfirmCopy({ en: 'board', el: 'πίνακα' }, board.title))) {
      deleteMutation.mutate(board.id);
    }
  };

  const handleSelectTemplate = async (template: BoardTemplate) => {
    try {
      const result = await createResearchBoard({
        title: template.name,
        description: template.description,
        color: template.color,
        tags: template.tags,
      });

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
      success(
        t(researchEn('created_tpl'), researchEl('created_tpl')),
        `"${template.name}" · ${template.initialNodes.length} ${t(researchEn('tpl_nodes'), researchEl('tpl_nodes'))}`,
      );
      router.push(`/research/${result.board.id}`);
    } catch (err) {
      showError(t(researchEn('fail_tpl'), researchEl('fail_tpl')), err instanceof Error ? err.message : t(researchEn('try_again'), researchEl('try_again')));
    }
  };

  return (
    <AppShell
      showHelp
      askAi="Help me open a market, product, or competitive research board and tell me what to capture first."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)} className="gap-2 rounded-xl" disabled={isLoading}>
            <CfbGlyph name="spark" className="icon-sm" />
            <BilingualText en={researchEn('use_template')} el={researchEl('use_template')} compact />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 rounded-xl" disabled={isLoading}>
            <Plus className="icon-sm" />
            <BilingualText en={researchEn('new_board')} el={researchEl('new_board')} compact />
          </Button>
        </div>
      }
    >
      {isLoading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="icon-xl animate-spin text-primary-accessible" />
          <p className="text-sm text-muted-foreground">
            <BilingualText en={researchEn('loading')} el={researchEl('loading')} compact />
          </p>
        </div>
      )}
      {!isLoading && error && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="icon-lg mb-3 text-destructive-accessible" />
          <p className="mb-4 text-destructive-accessible">
            <BilingualText en={researchEn('load_fail')} el={researchEl('load_fail')} />
          </p>
          <Button className="rounded-xl" onClick={() => queryClient.invalidateQueries({ queryKey: ['research-boards'] })}>
            <BilingualText en={researchEn('retry')} el={researchEl('retry')} compact />
          </Button>
        </div>
      )}
      {!isLoading && !error && (
        <>
          <BehavioralNudge surface="canvas" compact className="mb-4" />

          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            <BilingualText en={researchEn('lead')} el={researchEl('lead')} />
          </p>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(researchEn('search_ph'), researchEl('search_ph'))}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-10"
                aria-label={bilingualAria(researchEn('search_ph'), researchEl('search_ph'))}
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2 rounded-xl"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3X3 className="icon-sm" />
                <BilingualText en={researchEn('grid')} el={researchEl('grid')} compact />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2 rounded-xl"
                aria-pressed={viewMode === 'list'}
              >
                <List className="icon-sm" />
                <BilingualText en={researchEn('list')} el={researchEl('list')} compact />
              </Button>
            </div>
          </div>

          {boards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CfbGlyph name="research" className="mb-6 icon-lg text-muted-foreground/50" />
              <h2 className="mb-2 text-xl font-semibold">
                <BilingualText en={researchEn('empty_title')} el={researchEl('empty_title')} />
              </h2>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                <BilingualText en={researchEn('empty_hint')} el={researchEl('empty_hint')} />
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setTemplatesDialogOpen(true)}>
                  <CfbGlyph name="spark" className="icon-sm" />
                  <BilingualText en={researchEn('use_template')} el={researchEl('use_template')} compact />
                </Button>
                <Button className="gap-2 rounded-xl" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="icon-sm" />
                  <BilingualText en={researchEn('empty_cta')} el={researchEl('empty_cta')} compact />
                </Button>
              </div>
            </div>
          )}

          {pinnedBoards.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Pin className="icon-sm" />
                <BilingualText en={researchEn('pinned')} el={researchEl('pinned')} compact />
              </h2>
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
                  : 'flex flex-col gap-3',
              )}>
                {pinnedBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    viewMode={viewMode}
                    dateLocale={dateLocale}
                    onOpen={() => router.push(`/research/${board.id}`)}
                    onTogglePin={() => handleTogglePin(board)}
                    onArchive={() => handleArchive(board)}
                    onDelete={() => handleDelete(board)}
                  />
                ))}
              </div>
            </div>
          )}

          {regularBoards.length > 0 && (
            <div>
              {pinnedBoards.length > 0 && (
                <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                  <BilingualText en={researchEn('all_boards')} el={researchEl('all_boards')} compact />
                </h2>
              )}
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
                  : 'flex flex-col gap-3',
              )}>
                {regularBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    viewMode={viewMode}
                    dateLocale={dateLocale}
                    onOpen={() => router.push(`/research/${board.id}`)}
                    onTogglePin={() => handleTogglePin(board)}
                    onArchive={() => handleArchive(board)}
                    onDelete={() => handleDelete(board)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredBoards.length === 0 && boards.length > 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <BilingualText en={researchEn('no_match')} el={researchEl('no_match')} />
            </div>
          )}

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="rounded-xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  <BilingualText en={researchEn('create_title')} el={researchEl('create_title')} />
                </DialogTitle>
                <DialogDescription>
                  <BilingualText en={researchEn('create_desc')} el={researchEl('create_desc')} />
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <BilingualText en={researchEn('field_title')} el={researchEl('field_title')} compact />
                  </label>
                  <Input
                    className="rounded-xl"
                    placeholder={t(researchEn('title_ph'), researchEl('title_ph'))}
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <BilingualText en={researchEn('field_desc')} el={researchEl('field_desc')} compact />
                  </label>
                  <Input
                    className="rounded-xl"
                    placeholder={t(researchEn('desc_ph'), researchEl('desc_ph'))}
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <BilingualText en={researchEn('field_color')} el={researchEl('field_color')} compact />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOARD_COLORS.map((color) => (
                      <button
                        key={color.nameKey}
                        type="button"
                        onClick={() => setNewBoardColor(color.value)}
                        className={cn(
                          'h-8 w-8 rounded-xl border-2 transition-all',
                          newBoardColor === color.value
                            ? 'scale-110 border-primary'
                            : 'border-transparent hover:scale-105',
                          !color.value && 'bg-secondary',
                        )}
                        style={color.value ? { backgroundColor: color.value } : undefined}
                        title={t(researchEn(color.nameKey), researchEl(color.nameKey))}
                        aria-label={bilingualAria(researchEn(color.nameKey), researchEl(color.nameKey))}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <BilingualText en={researchEn('field_icon')} el={researchEl('field_icon')} compact />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOARD_ICONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setNewBoardIcon(icon.value)}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border transition-all',
                          newBoardIcon === icon.value
                            ? 'border-primary bg-primary/10 text-primary-accessible'
                            : 'border-border hover:border-primary/50',
                        )}
                        title={t(researchEn(icon.nameKey), researchEl(icon.nameKey))}
                        aria-label={bilingualAria(researchEn(icon.nameKey), researchEl(icon.nameKey))}
                      >
                        <CfbGlyph name={icon.glyph} className="icon-md" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" className="rounded-xl" onClick={() => setCreateDialogOpen(false)}>
                  <BilingualText en={commonEn('cancel')} el={commonEl('cancel')} compact />
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={handleCreateBoard}
                  disabled={!newBoardTitle.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="icon-sm mr-2 animate-spin" />
                  ) : null}
                  <BilingualText en={researchEn('create_board')} el={researchEl('create_board')} compact />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <BoardTemplatesDialog
            open={templatesDialogOpen}
            onClose={() => setTemplatesDialogOpen(false)}
            onSelectTemplate={handleSelectTemplate}
          />
        </>
      )}
    </AppShell>
  );
}

function BoardCard({
  board,
  viewMode,
  dateLocale,
  onOpen,
  onTogglePin,
  onArchive,
  onDelete,
}: {
  board: ResearchBoard;
  viewMode: 'grid' | 'list';
  dateLocale: Locale;
  onOpen: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const glyph = getBoardGlyph(board.icon);
  const updated = formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true, locale: dateLocale });

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant={viewMode === 'list' ? 'ghost' : 'secondary'}
          size="sm"
          className="h-8 w-8 rounded-xl p-0"
          aria-label={bilingualAria(researchEn('more'), researchEl('more'))}
        >
          <MoreVertical className="icon-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onTogglePin}>
          <Pin className="icon-sm mr-2" />
          <BilingualText
            en={board.isPinned ? researchEn('unpin') : researchEn('pin')}
            el={board.isPinned ? researchEl('unpin') : researchEl('pin')}
            compact
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive}>
          <Archive className="icon-sm mr-2" />
          <BilingualText en={researchEn('archive')} el={researchEl('archive')} compact />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive-accessible">
          <Trash2 className="icon-sm mr-2" />
          <BilingualText en={commonEn('delete')} el={commonEl('delete')} compact />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer rounded-xl transition-colors hover:border-border hover:bg-muted/20" onClick={onOpen}>
        <CardContent className="flex items-center gap-4 p-4">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: board.color ?? 'var(--muted-foreground)' }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CfbGlyph name={glyph} className="icon-sm shrink-0 text-muted-foreground" />
              <h3 className="truncate font-semibold">{board.title}</h3>
              {board.isPinned && <Pin className="icon-sm shrink-0 text-primary-accessible" />}
            </div>
            {board.description && (
              <p className="truncate text-sm text-muted-foreground">
                {PREVIEW_BOARD_DESC_EL[board.description]
                  ? <BilingualText en={board.description} el={PREVIEW_BOARD_DESC_EL[board.description]} compact />
                  : board.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-sm text-muted-foreground">
            {board.nodeCount} <BilingualText en={researchEn('items')} el={researchEl('items')} compact />
          </div>
          <div className="shrink-0 text-sm text-muted-foreground">{updated}</div>
          {menu}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group cursor-pointer rounded-xl transition-colors hover:border-border hover:bg-muted/20" onClick={onOpen}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start gap-2.5">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: board.color ?? 'var(--muted-foreground)' }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-snug">
              <span className="mr-1.5 inline-flex align-middle text-muted-foreground">
                <CfbGlyph name={glyph} className="icon-sm" />
              </span>
              {board.title}
            </h3>
            {board.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {PREVIEW_BOARD_DESC_EL[board.description]
                  ? <BilingualText en={board.description} el={PREVIEW_BOARD_DESC_EL[board.description]} wrap />
                  : board.description}
              </p>
            )}
          </div>
          {board.isPinned && <Pin className="icon-sm shrink-0 text-muted-foreground" />}
          <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            {menu}
          </div>
        </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {board.nodeCount} <BilingualText en={researchEn('items')} el={researchEl('items')} compact />
            </span>
            <span>{updated}</span>
          </div>
      </CardContent>
    </Card>
  );
}
