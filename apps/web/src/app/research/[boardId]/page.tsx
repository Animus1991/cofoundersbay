'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, ZoomIn, ZoomOut, Maximize2, Upload, StickyNote,
  FileText, Image as ImageIcon, Link as LinkIcon, MoreVertical,
  Trash2, Lock, Unlock, Loader2, Save, Settings, Users, Share2,
  Move, MousePointer2, Hand, Grid3X3, Sparkles, Map, MessageCircle,
  Filter, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/layout/SidebarContext';
import { SideNav } from '@/components/layout/SideNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  getResearchBoard,
  updateResearchBoard,
  createResearchNode,
  updateResearchNode,
  deleteResearchNode,
  batchUpdateResearchNodes,
  uploadResearchAsset,
  type ResearchNode,
  type ResearchBoardFull,
} from '@/lib/api';
import { ResearchNodeCard } from '@/components/research/ResearchNodeCard';
import { ResearchNodeViewer } from '@/components/research/ResearchNodeViewer';
import { ResearchConnectorLines } from '@/components/research/ResearchConnectorLines';
import { BoardExport } from '@/components/research/BoardExport';
import { EntityReferenceSelector } from '@/components/research/EntityReferenceSelector';
import { NodeFilterBar } from '@/components/research/NodeTagsEditor';
import { AIAnalysisPanel } from '@/components/research/AIAnalysisPanel';
import { BoardSettingsPanel } from '@/components/research/BoardSettingsPanel';
import { CommentsPanel } from '@/components/research/CommentsPanel';
import { BoardMiniMap } from '@/components/research/BoardMiniMap';
import { CollaboratorsBar, LiveCursors } from '@/components/research/CollaboratorsBar';
import { useResearchCollaboration } from '@/hooks/useResearchCollaboration';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Tool = 'select' | 'pan' | 'note';

type NodeUpdateData = {
  title?: string;
  content?: string;
  url?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  color?: string;
  collapsed?: boolean;
  locked?: boolean;
  tags?: string[];
};

export default function ResearchBoardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const boardId = params?.boardId as string;

  // Canvas state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [showGrid, setShowGrid] = useState(true);

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewingNode, setViewingNode] = useState<ResearchNode | null>(null);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Entity reference selector
  const [showEntitySelector, setShowEntitySelector] = useState(false);

  // Filtering state
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Panel states
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [commentsNodeId, setCommentsNodeId] = useState<string | null>(null);

  const currentUser = useCurrentUser();

  const { isConnected, collaborators, emitCursor, emitNodeMove, emitNodeUpdate } = useResearchCollaboration({
    boardId: boardId ?? null,
    enabled: !!boardId,
  });

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['research-board', boardId],
    queryFn: () => getResearchBoard(boardId),
  });

  const board = data?.board;

  // Filtered nodes derived from board data
  const filteredNodes = useMemo(() => {
    const nodes = board?.nodes ?? [];
    if (!filterSearch && filterTags.length === 0) return nodes;
    return nodes.filter((n) => {
      const matchesSearch = !filterSearch ||
        (n.title ?? '').toLowerCase().includes(filterSearch.toLowerCase()) ||
        (n.content ?? '').toLowerCase().includes(filterSearch.toLowerCase());
      const matchesTags = filterTags.length === 0 ||
        filterTags.every((t) => n.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [board?.nodes, filterSearch, filterTags]);

  const updateBoardMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateResearchBoard>[1]) => updateResearchBoard(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: (data: Parameters<typeof createResearchNode>[1]) => createResearchNode(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: NodeUpdateData }) =>
      updateResearchNode(nodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: deleteResearchNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
      setSelectedNodeId(null);
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof batchUpdateResearchNodes>[1]) =>
      batchUpdateResearchNodes(boardId, updates),
  });

  // Save canvas state periodically
  useEffect(() => {
    if (!board) return;
    const timeout = setTimeout(() => {
      updateBoardMutation.mutate({ canvasState: { zoom, pan } });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [zoom, pan]);

  // Restore canvas state on load
  useEffect(() => {
    if (board?.canvasState && typeof board.canvasState === 'object') {
      const state = board.canvasState as { zoom?: number; pan?: { x: number; y: number } };
      if (state.zoom) setZoom(state.zoom);
      if (state.pan) setPan(state.pan);
    }
  }, [board?.id]);

  // Zoom handlers
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setZoom((prev) => {
      const newZoom = Math.min(Math.max(prev + delta, 0.25), 3);
      return newZoom;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    } else if (activeTool === 'pan' || e.shiftKey) {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [activeTool, handleZoom]);

  // Pan handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    
    if (activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (activeTool === 'note') {
      // Create note at click position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        createNodeMutation.mutate({
          type: 'note',
          title: 'New Note',
          content: '',
          posX: x,
          posY: y,
          width: 280,
          height: 200,
        });
        setActiveTool('select');
      }
    } else {
      setSelectedNodeId(null);
    }
  }, [activeTool, pan, zoom, createNodeMutation]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
      const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
      
      // Update node position locally for smooth dragging
      queryClient.setQueryData(['research-board', boardId], (old: { board: ResearchBoardFull } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          board: {
            ...old.board,
            nodes: old.board.nodes.map((n) =>
              n.id === draggingNodeId ? { ...n, posX: x, posY: y } : n
            ),
          },
        };
      });
    }
  }, [isPanning, panStart, draggingNodeId, dragOffset, pan, zoom, boardId, queryClient]);

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingNodeId) {
      const node = board?.nodes.find((n) => n.id === draggingNodeId);
      if (node) {
        updateNodeMutation.mutate({
          nodeId: draggingNodeId,
          data: { posX: node.posX, posY: node.posY },
        });
      }
    }
    setIsPanning(false);
    setDraggingNodeId(null);
  }, [draggingNodeId, board, updateNodeMutation]);

  // Node drag handlers
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    const node = board?.nodes.find((n) => n.id === nodeId);
    if (!node || node.locked) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    setDraggingNodeId(nodeId);
    setDragOffset({ x: mouseX - node.posX, y: mouseY - node.posY });
    setSelectedNodeId(nodeId);
  }, [activeTool, board, pan, zoom]);

  // File upload handler
  const handleFileUpload = async (files: FileList) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let offsetX = 0;
    for (const file of Array.from(files)) {
      try {
        const { upload } = await uploadResearchAsset(file);
        
        const type = file.type.startsWith('image/') ? 'image' :
                     file.type === 'application/pdf' ? 'pdf' : 'document';

        await createNodeMutation.mutateAsync({
          type,
          title: file.name,
          uploadId: upload.id,
          url: upload.url,
          posX: (rect.width / 2 - pan.x) / zoom + offsetX,
          posY: (rect.height / 2 - pan.y) / zoom,
          width: type === 'image' ? 320 : 280,
          height: type === 'image' ? 240 : 200,
          metadata: {
            mimeType: upload.mimeType,
            sizeBytes: upload.sizeBytes,
            originalName: upload.originalName,
          },
        });

        offsetX += 300;
      } catch (err) {
        showError('Upload failed', err instanceof Error ? err.message : 'Please try again');
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    success('Files uploaded', `${files.length} file(s) added to board`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          const node = board?.nodes.find((n) => n.id === selectedNodeId);
          if (node && !node.locked) {
            deleteNodeMutation.mutate(selectedNodeId);
          }
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setViewingNode(null);
        setActiveTool('select');
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      } else if (e.key === 'n' || e.key === 'N') {
        setActiveTool('note');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, board, deleteNodeMutation]);

  // Drag and drop files
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const { expanded, toggle } = useSidebar();

  if (isLoading) {
    return (
      <div className="h-screen bg-background">
        <SideNav />
        <div
          className={cn(
            'h-screen flex items-center justify-center transition-[margin-left] duration-200 ease-out',
            expanded ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="h-screen bg-background">
        <SideNav />
        <div
          className={cn(
            'h-screen flex flex-col items-center justify-center transition-[margin-left] duration-200 ease-out',
            expanded ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
          )}
        >
          <p className="text-destructive mb-4">Failed to load board</p>
          <Button onClick={() => router.push('/research')}>Back to Boards</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <SideNav />

      {/* Main content area - offset by sidebar */}
      <div
        className={cn(
          'h-screen flex flex-col overflow-hidden transition-[margin-left] duration-200 ease-out',
          expanded ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
        )}
      >
        {/* Toolbar */}
        <div className="h-14 border-b bg-card/95 backdrop-blur flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle for mobile/collapsed state */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="hidden lg:flex h-8 w-8 p-0"
              title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {expanded ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
            <Link href="/research">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold truncate max-w-[200px]">{board.title}</h1>
            <CollaboratorsBar collaborators={collaborators} isConnected={isConnected} className="ml-2" />
          </div>

        <div className="flex items-center gap-2">
          {/* Tool buttons */}
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            <Button
              variant={activeTool === 'select' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('select')}
              title="Select (V)"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'pan' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('pan')}
              title="Pan (H)"
            >
              <Hand className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'note' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('note')}
              title="Add Note (N)"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Add content */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTool('note')}>
                <StickyNote className="h-4 w-4 mr-2" />
                Sticky Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const url = prompt('Enter URL:');
                if (url) {
                  createNodeMutation.mutate({
                    type: 'link',
                    title: url,
                    url,
                    posX: (window.innerWidth / 2 - pan.x) / zoom,
                    posY: (window.innerHeight / 2 - pan.y) / zoom,
                  });
                }
              }}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEntitySelector(true)}>
                <Users className="h-4 w-4 mr-2" />
                Reference Entity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.25)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleZoom(0.25)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              title="Reset View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            variant={showGrid ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Filter toggle */}
          <Button
            variant={showFilterBar ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilterBar((v) => !v)}
            title="Filter nodes"
          >
            <Filter className="h-4 w-4" />
          </Button>

          {/* MiniMap toggle */}
          <Button
            variant={showMiniMap ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowMiniMap((v) => !v)}
            title="Toggle mini-map"
          >
            <Map className="h-4 w-4" />
          </Button>

          {/* AI Analysis */}
          <Button
            variant={showAIPanel ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowAIPanel((v) => !v)}
            title="AI Board Analysis"
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Analyze</span>
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Export */}
          {board && <BoardExport board={board} canvasRef={canvasRef as React.RefObject<HTMLDivElement>} />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowBoardSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Board Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setShowBoardSettings(true); }}>
                <Users className="h-4 w-4 mr-2" />
                Collaborators
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAIPanel((v) => !v)}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Analysis
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowMiniMap((v) => !v)}>
                <Map className="h-4 w-4 mr-2" />
                {showMiniMap ? 'Hide' : 'Show'} Mini-Map
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilterBar && board && (
        <div className="px-4 py-2 border-b bg-card/80 backdrop-blur shrink-0 z-40">
          <NodeFilterBar
            availableTags={Array.from(new Set(board.nodes.flatMap((n) => n.tags)))}
            selectedTags={filterTags}
            onTagsChange={setFilterTags}
            searchQuery={filterSearch}
            onSearchChange={setFilterSearch}
          />
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          'flex-1 relative overflow-hidden',
          activeTool === 'pan' && 'cursor-grab',
          isPanning && 'cursor-grabbing',
          activeTool === 'note' && 'cursor-crosshair',
        )}
        style={{
          backgroundImage: showGrid
            ? `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`
            : undefined,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e);
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const worldX = (e.clientX - rect.left - pan.x) / zoom;
            const worldY = (e.clientY - rect.top - pan.y) / zoom;
            emitCursor(worldX, worldY);
          }
        }}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Transform container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* Connector lines */}
          <ResearchConnectorLines
            connectors={board.connectors}
            nodes={board.nodes}
          />

          {/* Nodes */}
          {filteredNodes.map((node) => (
            <ResearchNodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isDragging={draggingNodeId === node.id}
              onSelect={() => setSelectedNodeId(node.id)}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              onDoubleClick={() => setViewingNode(node)}
              onUpdate={(data) => updateNodeMutation.mutate({ nodeId: node.id, data })}
              onDelete={() => deleteNodeMutation.mutate(node.id)}
              onCommentClick={() => setCommentsNodeId(node.id)}
            />
          ))}
        </div>

        {/* Live cursors */}
        <LiveCursors collaborators={collaborators} pan={pan} zoom={zoom} />

        {/* MiniMap */}
        {showMiniMap && board && (
          <div className="absolute bottom-4 right-4 pointer-events-auto z-40">
            <BoardMiniMap
              nodes={board.nodes}
              pan={pan}
              zoom={zoom}
              viewportWidth={canvasRef.current?.clientWidth ?? window.innerWidth}
              viewportHeight={canvasRef.current?.clientHeight ?? window.innerHeight}
              onNavigate={setPan}
            />
          </div>
        )}

        {/* AI Analysis Panel */}
        {showAIPanel && (
          <div className="absolute top-4 right-4 z-40 pointer-events-auto">
            <AIAnalysisPanel
              boardId={boardId}
              onClose={() => setShowAIPanel(false)}
              onApplyTags={(tags) => {
                if (!board) return;
                updateBoardMutation.mutate({ tags: [...new Set([...(board.tags ?? []), ...tags])] });
              }}
            />
          </div>
        )}

        {/* Comments Panel */}
        {commentsNodeId && currentUser && (
          <div className="absolute top-4 left-4 z-40 pointer-events-auto" style={{ width: 340 }}>
            <CommentsPanel
              nodeId={commentsNodeId}
              nodeTitle={board?.nodes.find((n) => n.id === commentsNodeId)?.title}
              currentUserId={currentUser.id}
              onClose={() => setCommentsNodeId(null)}
            />
          </div>
        )}

        {/* Drop zone overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 transition-opacity data-[dragging=true]:opacity-100">
          <div className="bg-primary/10 border-2 border-dashed border-primary rounded-xl p-8 text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-muted-foreground">PDFs, images, documents</p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFileUpload(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Node viewer popup */}
      {viewingNode && (
        <ResearchNodeViewer
          node={viewingNode}
          onClose={() => setViewingNode(null)}
          onUpdate={(data) => {
            updateNodeMutation.mutate({ nodeId: viewingNode.id, data });
            setViewingNode({ ...viewingNode, ...data });
          }}
        />
      )}

      {/* Entity reference selector */}
      <EntityReferenceSelector
        open={showEntitySelector}
        onClose={() => setShowEntitySelector(false)}
        onSelect={(entity) => {
          createNodeMutation.mutate({
            type: 'reference',
            title: entity.title,
            content: JSON.stringify({
              entityType: entity.type,
              entityId: entity.id,
              subtitle: entity.subtitle,
              avatarUrl: entity.avatarUrl,
            }),
            posX: (window.innerWidth / 2 - pan.x) / zoom,
            posY: (window.innerHeight / 2 - pan.y) / zoom,
          });
        }}
      />

      {/* Board settings dialog */}
      {board && currentUser && (
        <BoardSettingsPanel
          board={board}
          open={showBoardSettings}
          onClose={() => setShowBoardSettings(false)}
          currentUserId={currentUser.id}
        />
      )}
      </div>
    </div>
  );
}
