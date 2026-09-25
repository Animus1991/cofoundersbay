'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, MoreVertical, Pin, Archive, Trash2,
  Grid3X3, List, Loader2, AlertCircle, Copy, ArchiveRestore,
} from 'lucide-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { el as elLocale, enUS } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { choiceControl, rowOptions, usePageControls, usePageList } from '@/lib/page-controls';
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
import { RelativeTime } from '@/components/common/RelativeTime';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { bilingualAria } from '@/lib/i18n/format';
import { commonEn, commonEl } from '@/lib/i18n/strings-common';
import {
  researchEn,
  researchEl,
  useResearchPrimaryText,
  RESEARCH_TAG_EL,
} from '@/lib/i18n/strings-research';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import {
  listResearchBoards,
  createResearchBoard,
  createResearchNode,
  updateResearchBoard,
  deleteResearchBoard,
  getResearchBoard,
  type ResearchBoard,
} from '@/lib/api';
import {
  BoardTemplatesDialog,
  BOARD_TEMPLATES,
  ResearchTemplateTile,
  type BoardTemplate,
} from '@/components/research/BoardTemplates';
import { BehavioralNudge } from '@/components/behavioral/BehavioralNudge';
import { BUILDER_BTN } from '@/components/builder/BuilderStageChrome';
import { qk } from '@/lib/query-keys';

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

const PREVIEW_BOARD_TITLE_EL: Record<string, string> = {
  'Go-to-market canvas': 'Καμβάς εισόδου στην αγορά',
};

type BoardFilter = 'all' | 'pinned' | 'empty' | 'archived';
type BoardSort = 'updated' | 'title' | 'nodes';

function sortBoards(list: ResearchBoard[], sort: BoardSort): ResearchBoard[] {
  const copy = [...list];
  if (sort === 'title') {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'nodes') {
    copy.sort((a, b) => b.nodeCount - a.nodeCount || a.title.localeCompare(b.title));
  } else {
    copy.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }
  return copy;
}

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
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [sort, setSort] = useState<BoardSort>('updated');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardColor, setNewBoardColor] = useState<string | null>(null);
  const [newBoardIcon, setNewBoardIcon] = useState<string>('document');

  const showArchived = filter === 'archived';
  const { data, isLoading, error } = useQuery({
    queryKey: qk('research-boards', showArchived),
    queryFn: () => listResearchBoards({ archived: showArchived }),
  });
  const bootLoad = isLoading && !data && filter === 'all';

  const createMutation = useMutation({
    mutationFn: createResearchBoard,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk('research-boards') });
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
      queryClient.invalidateQueries({ queryKey: qk('research-boards') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResearchBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk('research-boards') });
      success(t(researchEn('deleted'), researchEl('deleted')), t(researchEn('deleted_hint'), researchEl('deleted_hint')));
    },
    onError: (err) => {
      showError(t(researchEn('fail_delete'), researchEl('fail_delete')), err instanceof Error ? err.message : t(researchEn('try_again'), researchEl('try_again')));
    },
  });

  const boards = data?.boards ?? [];
  const filteredBoards = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = boards.filter((b) =>
      b.title.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
    if (filter === 'pinned') list = list.filter((b) => b.isPinned);
    if (filter === 'empty') list = list.filter((b) => b.nodeCount === 0);
    return sortBoards(list, sort);
  }, [boards, searchQuery, filter, sort]);

  const pinnedBoards = filteredBoards.filter((b) => b.isPinned);
  const regularBoards = filteredBoards.filter((b) => !b.isPinned);
  const useSplit = filter === 'all';
  const totalNodes = boards.reduce((sum, b) => sum + (b.nodeCount ?? 0), 0);
  const pinnedCount = boards.filter((b) => b.isPinned).length;
  const latest = sortBoards(boards, 'updated')[0] ?? null;

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

  const handleRestore = async (board: ResearchBoard) => {
    const ok = await confirm({
      title: <BilingualText en={researchEn('restore_title')} el={researchEl('restore_title')} />,
      description: <BilingualText en={researchEn('restore_desc')} el={researchEl('restore_desc')} />,
      confirmLabel: <BilingualText en={researchEn('restore')} el={researchEl('restore')} compact />,
      variant: 'default',
    });
    if (!ok) return;
    updateMutation.mutate({ boardId: board.id, data: { isArchived: false } });
    success(t(researchEn('restored'), researchEl('restored')), `"${board.title}"`);
  };

  const handleDelete = async (board: ResearchBoard) => {
    if (await confirm(deleteConfirmCopy({ en: 'board', el: 'πίνακα' }, board.title))) {
      deleteMutation.mutate(board.id);
    }
  };

  const handleDuplicate = async (board: ResearchBoard) => {
    try {
      const full = await getResearchBoard(board.id);
      const result = await createResearchBoard({
        title: `${board.title}${t(researchEn('copy_suffix'), researchEl('copy_suffix'))}`,
        description: board.description ?? undefined,
        color: board.color ?? undefined,
        icon: board.icon ?? undefined,
        tags: board.tags,
      });
      for (const node of full.board.nodes) {
        await createResearchNode(result.board.id, {
          type: node.type,
          title: node.title ?? undefined,
          content: node.content ?? undefined,
          url: node.url ?? undefined,
          posX: node.posX,
          posY: node.posY,
          width: node.width,
          height: node.height,
          color: node.color ?? undefined,
          metadata: node.metadata ?? undefined,
          tags: node.tags,
        });
      }
      queryClient.invalidateQueries({ queryKey: qk('research-boards') });
      success(
        t(researchEn('duplicated'), researchEl('duplicated')),
        `"${result.board.title}" · ${full.board.nodes.length} ${t(researchEn('tpl_nodes'), researchEl('tpl_nodes'))}`,
      );
      router.push(`/research/${result.board.id}`);
    } catch (err) {
      showError(t(researchEn('fail_duplicate'), researchEl('fail_duplicate')), err instanceof Error ? err.message : t(researchEn('try_again'), researchEl('try_again')));
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

      queryClient.invalidateQueries({ queryKey: qk('research-boards') });
      success(
        t(researchEn('created_tpl'), researchEl('created_tpl')),
        `"${template.name}" · ${template.initialNodes.length} ${t(researchEn('tpl_nodes'), researchEl('tpl_nodes'))}`,
      );
      router.push(`/research/${result.board.id}`);
    } catch (err) {
      showError(t(researchEn('fail_tpl'), researchEl('fail_tpl')), err instanceof Error ? err.message : t(researchEn('try_again'), researchEl('try_again')));
    }
  };

  const cardHandlers = (board: ResearchBoard) => ({
    onOpen: () => router.push(`/research/${board.id}`),
    onTogglePin: () => handleTogglePin(board),
    onArchive: () => handleArchive(board),
    onRestore: () => handleRestore(board),
    onDuplicate: () => handleDuplicate(board),
    onDelete: () => handleDelete(board),
  });

  const filters: { id: BoardFilter; labelEn: string; labelEl: string }[] = [
    { id: 'all', labelEn: researchEn('filter_all'), labelEl: researchEl('filter_all') },
    { id: 'pinned', labelEn: researchEn('pinned'), labelEl: researchEl('pinned') },
    { id: 'empty', labelEn: researchEn('filter_empty'), labelEl: researchEl('filter_empty') },
    { id: 'archived', labelEn: researchEn('filter_archived'), labelEl: researchEl('filter_archived') },
  ];

  const sorts: { id: BoardSort; labelEn: string; labelEl: string }[] = [
    { id: 'updated', labelEn: researchEn('sort_updated'), labelEl: researchEl('sort_updated') },
    { id: 'title', labelEn: researchEn('sort_title'), labelEl: researchEl('sort_title') },
    { id: 'nodes', labelEn: researchEn('sort_nodes'), labelEl: researchEl('sort_nodes') },
  ];

  /*
   * What counts the list, and what narrows it.
   *
   * The boards are the page, and so are the two ways to start one - the
   * header buttons and the template cards, which for a founder with no
   * boards are the way in. These two are not: three tiles counting what the
   * list already shows, and twelve controls in a row above it.
   */
  // Offered to the assistant: the rail's filter and sort and the layout
  // switch, through the same setters. Board-level work is canvas_command.
  usePageControls([
    choiceControl('board_filter', 'Board filter', 'Φίλτρο πινάκων', filters.map((f) => ({ key: f.id, labelEn: f.labelEn, labelEl: f.labelEl })), filter, (v) => setFilter(v as BoardFilter)),
    choiceControl('sort', 'Sort boards', 'Ταξινόμηση πινάκων', sorts.map((o) => ({ key: o.id, labelEn: o.labelEn, labelEl: o.labelEl })), sort, (v) => setSort(v as BoardSort)),
    choiceControl('view', 'Board layout', 'Διάταξη πινάκων', [
      { value: 'grid', en: 'Grid', el: 'Πλέγμα' },
      { value: 'list', en: 'List', el: 'Λίστα' },
    ], viewMode, (v) => setViewMode(v as 'grid' | 'list')),
    // The board menu's own actions over the boards on screen - the same
    // handlers, so Archive, Restore and Delete still ask first.
    ...(() => {
      const byTitle = (list: ResearchBoard[]) => rowOptions(list, (b) => b.id, (b) => b.title);
      const board = (id?: string) => filteredBoards.find((b) => b.id === id);
      const active = filteredBoards.filter((b) => !b.isArchived);
      return [
        // updateBoard writes only the fields it is sent (research.service), so
        // pin / unpin and archive / restore are each other's exact opposite.
        { id: 'pin_board', labelEn: 'Pin board', labelEl: 'Καρφίτσωμα πίνακα', writes: true, options: byTitle(active.filter((b) => !b.isPinned)), undo: (v?: string) => ({ control: 'unpin_board', value: v }), run: (v?: string) => { const b = board(v); if (b) handleTogglePin(b); } },
        { id: 'unpin_board', labelEn: 'Unpin board', labelEl: 'Ξεκαρφίτσωμα πίνακα', writes: true, options: byTitle(filteredBoards.filter((b) => b.isPinned)), undo: (v?: string) => ({ control: 'pin_board', value: v }), run: (v?: string) => { const b = board(v); if (b) handleTogglePin(b); } },
        { id: 'duplicate_board', labelEn: 'Duplicate board', labelEl: 'Αντίγραφο πίνακα', writes: true, options: byTitle(filteredBoards), run: (v?: string) => { const b = board(v); if (b) void handleDuplicate(b); } },
        { id: 'archive_board', labelEn: 'Archive board', labelEl: 'Αρχειοθέτηση πίνακα', writes: true, options: byTitle(active), undo: (v?: string) => ({ control: 'restore_board', value: v }), run: (v?: string) => { const b = board(v); if (b) void handleArchive(b); } },
        { id: 'restore_board', labelEn: 'Restore archived board', labelEl: 'Επαναφορά αρχειοθετημένου πίνακα', writes: true, options: byTitle(filteredBoards.filter((b) => b.isArchived)), undo: (v?: string) => ({ control: 'archive_board', value: v }), run: (v?: string) => { const b = board(v); if (b) void handleRestore(b); } },
        { id: 'delete_board', labelEn: 'Delete board', labelEl: 'Διαγραφή πίνακα', writes: true, options: byTitle(filteredBoards), run: (v?: string) => { const b = board(v); if (b) void handleDelete(b); } },
      ];
    })(),
  ]);
  usePageList([
    {
      id: 'boards',
      labelEn: 'Research boards',
      labelEl: 'Πίνακες έρευνας',
      rows: isLoading ? undefined : filteredBoards.map((b) =>
        `${b.title} · ${b.nodeCount} nodes${b.isPinned ? ' · pinned' : ''}${b.isArchived ? ' · archived' : ''} · updated ${b.updatedAt.slice(0, 10)}`,
      ),
      total: boards.length,
    },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'chart',
      labelEn: 'Summary',
      labelEl: 'Σύνοψη',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 min-w-0 gap-5 lg:grid-cols-3">
            <Card className="min-w-0">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <CfbGlyph name="research" className="icon-sm text-primary-accessible" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      <BilingualText en={researchEn('stat_boards')} el={researchEl('stat_boards')} compact />
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      <BilingualText en={researchEn('stat_boards_hint')} el={researchEl('stat_boards_hint')} wrap />
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-2xl font-bold tabular-nums">{boards.length}</span>
                  <span className="mb-1 text-xs text-muted-foreground">
                    {pinnedCount}{' '}
                    <BilingualText
                      en={researchEn('stat_pinned_n')}
                      el={researchEl(pinnedCount === 1 ? 'stat_pinned_n_one' : 'stat_pinned_n')}
                      compact
                    />
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <CfbGlyph name="bookmark" className="icon-sm text-primary-accessible" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      <BilingualText en={researchEn('stat_notes')} el={researchEl('stat_notes')} compact />
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      <BilingualText en={researchEn('stat_notes_hint')} el={researchEl('stat_notes_hint')} wrap />
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-2xl font-bold tabular-nums">{totalNodes}</span>
                  <span className="mb-1 text-xs text-muted-foreground">
                    <BilingualText en={researchEn('items')} el={researchEl('items')} compact />
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <CfbGlyph name="flag" className="icon-sm text-primary-accessible" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      <BilingualText en={researchEn('stat_next')} el={researchEl('stat_next')} compact />
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {latest ? (
                        PREVIEW_BOARD_TITLE_EL[latest.title]
                          ? <BilingualText en={latest.title} el={PREVIEW_BOARD_TITLE_EL[latest.title]} wrap />
                          : latest.title
                      ) : (
                        <BilingualText en={researchEn('stat_next_empty')} el={researchEl('stat_next_empty')} wrap />
                      )}
                    </p>
                  </div>
                </div>
                {latest ? (
                  <Button size="sm" variant="outline" className={`mt-auto ${BUILDER_BTN}`} asChild>
                    <Link href={`/research/${latest.id}`}>
                      <BilingualText en={researchEn('open_board')} el={researchEl('open_board')} compact />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className={`mt-auto ${BUILDER_BTN}`} onClick={() => setTemplatesDialogOpen(true)}>
                    <CfbGlyph name="spark" className="icon-sm mr-1.5" />
                    <BilingualText en={researchEn('use_template')} el={researchEl('use_template')} compact />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'filters',
      glyph: 'target',
      labelEn: 'Find a board',
      labelEl: 'Εύρεση πίνακα',
      // A narrowed list with no visible reason reads as a broken list.
      badge: (filter !== 'all' ? 1 : 0) + (searchQuery.trim() ? 1 : 0) || null,
      content: (
        <div className="space-y-3">
          <div className="mb-4 mt-8 flex flex-col gap-3">
            <div className="relative w-full min-w-0">
              <Search className="icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(researchEn('search_ph'), researchEl('search_ph'))}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-10"
                aria-label={bilingualAria(researchEn('search_ph'), researchEl('search_ph'))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
                {filters.map((f) => (
                  <Button
                    key={f.id}
                    variant={filter === f.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(f.id)}
                    className={`gap-1.5 ${BUILDER_BTN}`}
                    aria-pressed={filter === f.id}
                  >
                    <BilingualText en={f.labelEn} el={f.labelEl} compact />
                  </Button>
                ))}
              </div>
              <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
                {sorts.map((s) => (
                  <Button
                    key={s.id}
                    variant={sort === s.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSort(s.id)}
                    className={`gap-1.5 ${BUILDER_BTN}`}
                    aria-pressed={sort === s.id}
                  >
                    <BilingualText en={s.labelEn} el={s.labelEl} compact />
                  </Button>
                ))}
              </div>
              <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`gap-1.5 ${BUILDER_BTN}`}
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid3X3 className="icon-sm" />
                  <BilingualText en={researchEn('grid')} el={researchEl('grid')} compact />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`gap-1.5 ${BUILDER_BTN}`}
                  aria-pressed={viewMode === 'list'}
                >
                  <List className="icon-sm" />
                  <BilingualText en={researchEn('list')} el={researchEl('list')} compact />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
  return (
    <AppShell
      rail={rail}
      showHelp
      askAi="Help me open a market, product, or competitive research board and tell me what to capture first."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setTemplatesDialogOpen(true)} className={`gap-1.5 ${BUILDER_BTN}`} disabled={bootLoad}>
            <CfbGlyph name="spark" className="icon-sm" />
            <BilingualText en={researchEn('use_template')} el={researchEl('use_template')} compact />
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className={`gap-1.5 ${BUILDER_BTN}`} disabled={bootLoad}>
            <Plus className="icon-sm" />
            <BilingualText en={researchEn('new_board')} el={researchEl('new_board')} compact />
          </Button>
        </div>
      }
    >
      {bootLoad && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="icon-xl animate-spin text-primary-accessible" />
          <p className="text-sm text-muted-foreground">
            <BilingualText en={researchEn('loading')} el={researchEl('loading')} compact />
          </p>
        </div>
      )}
      {!bootLoad && error && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="icon-lg mb-3 text-destructive-accessible" />
          <p className="mb-4 text-destructive-accessible">
            <BilingualText en={researchEn('load_fail')} el={researchEl('load_fail')} />
          </p>
          <Button size="sm" className={BUILDER_BTN} onClick={() => queryClient.invalidateQueries({ queryKey: qk('research-boards') })}>
            <BilingualText en={researchEn('retry')} el={researchEl('retry')} compact />
          </Button>
        </div>
      )}
      {!bootLoad && !error && (
        <>
          <BehavioralNudge surface="canvas" compact className="mb-5" />


          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  <BilingualText en={researchEn('templates_heading')} el={researchEl('templates_heading')} compact />
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <BilingualText en={researchEn('templates_hint')} el={researchEl('templates_hint')} wrap />
                </p>
              </div>
              <Button variant="ghost" size="sm" className={BUILDER_BTN} onClick={() => setTemplatesDialogOpen(true)}>
                <BilingualText en={researchEn('templates_see_all')} el={researchEl('templates_see_all')} compact />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BOARD_TEMPLATES.slice(0, 3).map((template) => (
                <ResearchTemplateTile key={template.id} template={template} onSelect={handleSelectTemplate} />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <BilingualText en={researchEn('link_builder')} el={researchEl('link_builder')} compact />
              {' · '}
              <Link href="/builder?tab=idea_core" className="text-foreground underline-offset-4 hover:underline">
                <BilingualText en={researchEn('link_idea')} el={researchEl('link_idea')} compact />
              </Link>
              {' · '}
              <Link href="/builder?tab=market_analysis" className="text-foreground underline-offset-4 hover:underline">
                <BilingualText en={researchEn('link_market')} el={researchEl('link_market')} compact />
              </Link>
            </p>
          </section>


          {boards.length === 0 && filter === 'all' && (
            <div className="rounded-2xl border border-border/60 bg-card/60 px-5 py-10 text-center">
              <CfbGlyph name="research" className="mx-auto mb-4 icon-lg text-muted-foreground/50" />
              <h2 className="mb-2 text-sm font-semibold">
                <BilingualText en={researchEn('empty_title')} el={researchEl('empty_title')} />
              </h2>
              <p className="mx-auto mb-5 max-w-md text-xs text-muted-foreground">
                <BilingualText en={researchEn('empty_hint')} el={researchEl('empty_hint')} />
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" className={`gap-1.5 ${BUILDER_BTN}`} onClick={() => setTemplatesDialogOpen(true)}>
                  <CfbGlyph name="spark" className="icon-sm" />
                  <BilingualText en={researchEn('use_template')} el={researchEl('use_template')} compact />
                </Button>
                <Button size="sm" className={`gap-1.5 ${BUILDER_BTN}`} onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="icon-sm" />
                  <BilingualText en={researchEn('empty_cta')} el={researchEl('empty_cta')} compact />
                </Button>
              </div>
            </div>
          )}

          {useSplit && pinnedBoards.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Pin className="icon-sm" />
                <BilingualText en={researchEn('pinned')} el={researchEl('pinned')} compact />
              </h2>
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3',
              )}>
                {pinnedBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    viewMode={viewMode}
                    dateLocale={dateLocale}
                    archived={showArchived}
                    {...cardHandlers(board)}
                  />
                ))}
              </div>
            </div>
          )}

          {useSplit && regularBoards.length > 0 && (
            <div>
              {pinnedBoards.length > 0 && (
                <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                  <BilingualText en={researchEn('all_boards')} el={researchEl('all_boards')} compact />
                </h2>
              )}
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-3',
              )}>
                {regularBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    viewMode={viewMode}
                    dateLocale={dateLocale}
                    archived={showArchived}
                    {...cardHandlers(board)}
                  />
                ))}
              </div>
            </div>
          )}

          {!useSplit && filteredBoards.length > 0 && (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-3',
            )}>
              {filteredBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  viewMode={viewMode}
                  dateLocale={dateLocale}
                  archived={showArchived}
                  {...cardHandlers(board)}
                />
              ))}
            </div>
          )}

          {isLoading && !bootLoad && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="icon-sm animate-spin" />
              <BilingualText en={researchEn('loading')} el={researchEl('loading')} compact />
            </div>
          )}

          {filteredBoards.length === 0 && boards.length > 0 && !isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <BilingualText
                en={searchQuery ? researchEn('no_match') : filter === 'archived' ? researchEn('archived_empty') : filter === 'empty' ? researchEn('empty_filter') : researchEn('pinned_empty')}
                el={searchQuery ? researchEl('no_match') : filter === 'archived' ? researchEl('archived_empty') : filter === 'empty' ? researchEl('empty_filter') : researchEl('pinned_empty')}
              />
            </div>
          )}

          {boards.length === 0 && filter === 'archived' && !isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <BilingualText en={researchEn('archived_empty')} el={researchEl('archived_empty')} />
            </div>
          )}

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  <BilingualText en={researchEn('create_title')} el={researchEl('create_title')} />
                </DialogTitle>
                <DialogDescription>
                  <BilingualText en={researchEn('create_desc')} el={researchEl('create_desc')} />
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
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
                <Button variant="ghost" size="sm" className={BUILDER_BTN} onClick={() => setCreateDialogOpen(false)}>
                  <BilingualText en={commonEn('cancel')} el={commonEl('cancel')} compact />
                </Button>
                <Button
                  size="sm"
                  className={BUILDER_BTN}
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
  archived,
  onOpen,
  onTogglePin,
  onArchive,
  onRestore,
  onDuplicate,
  onDelete,
}: {
  board: ResearchBoard;
  viewMode: 'grid' | 'list';
  dateLocale: Locale;
  archived: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const glyph = getBoardGlyph(board.icon);
  const title = PREVIEW_BOARD_TITLE_EL[board.title]
    ? <BilingualText en={board.title} el={PREVIEW_BOARD_TITLE_EL[board.title]} compact />
    : board.title;
  const description = board.description
    ? PREVIEW_BOARD_DESC_EL[board.description]
      ? <BilingualText en={board.description} el={PREVIEW_BOARD_DESC_EL[board.description]} wrap />
      : board.description
    : null;
  const updated = (
    <RelativeTime
      date={board.updatedAt}
      format={(iso) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: dateLocale })}
    />
  );

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
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="icon-sm mr-2" />
          <BilingualText en={researchEn('duplicate')} el={researchEl('duplicate')} compact />
        </DropdownMenuItem>
        {archived ? (
          <DropdownMenuItem onClick={onRestore}>
            <ArchiveRestore className="icon-sm mr-2" />
            <BilingualText en={researchEn('restore')} el={researchEl('restore')} compact />
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="icon-sm mr-2" />
            <BilingualText en={researchEn('archive')} el={researchEl('archive')} compact />
          </DropdownMenuItem>
        )}
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
      <Card className="cursor-pointer transition-colors hover:border-border hover:bg-muted/20" onClick={onOpen}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary-accessible">
            <CfbGlyph name={glyph} className="icon-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{title}</h3>
              {board.isPinned && <Pin className="icon-sm shrink-0 text-primary-accessible" />}
            </div>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">
            {board.nodeCount} <BilingualText en={researchEn('items')} el={researchEl('items')} compact />
          </div>
          <div className="hidden shrink-0 text-xs text-muted-foreground md:block">{updated}</div>
          {menu}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer transition-colors hover:border-border hover:bg-muted/20" onClick={onOpen}>
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary-accessible">
            <CfbGlyph name={glyph} className="icon-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug">
                {title}
                {board.isPinned && <Pin className="ml-1.5 inline icon-sm align-text-top text-muted-foreground" />}
              </h3>
              {menu}
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {board.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-2xs text-muted-foreground">
            {board.tags.map((tag) => (
              <span key={tag}>
                <BilingualText en={tag} el={RESEARCH_TAG_EL[tag] ?? tag} compact />
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {board.nodeCount} <BilingualText en={researchEn('items')} el={researchEl('items')} compact />
          </span>
          <span>{updated}</span>
        </div>
      </CardContent>
    </Card>
  );
}
