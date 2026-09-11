'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileText, Image as ImageIcon, Link as LinkIcon, StickyNote,
  MoreHorizontal, Lock, Unlock, Trash2, X,
  Eye, EyeOff, Minimize2, MessageCircle,
  BookOpen, Palette, FileType, Users,
  Lightbulb, FlaskConical, HelpCircle, ListChecks, GitBranch, Sparkles,
  // Strategy & Planning
  Presentation, ClipboardList, LayoutGrid, Target, Map, Compass,
  // Financial
  DollarSign, PieChart, Receipt, Landmark, TrendingUp, Calculator,
  // Legal
  Scale, ShieldCheck, FileCheck, Stamp, Copyright, ShieldAlert,
  // Product & Tech
  PenTool, Code, Blocks, Server, Bug, Rocket,
  // Marketing & Sales
  BarChart3, Search, UserCircle, Megaphone, Filter, Funnel,
  // Team & Operations
  Network, Calendar, CheckSquare, GanttChart, Gauge, UserPlus, GraduationCap,
  // Communication
  Mail, Newspaper, FileSpreadsheet, Send, Inbox,
  // Data & Metrics
  Database, Award, ClipboardCheck, Activity, FileBarChart,
  // Investor Relations
  Briefcase, TrendingDown, FolderOpen, CircleDollarSign,
  // Task Management
  ListTodo, Flag, Repeat, MessageSquare,
  // Shapes & Diagram
  Square, Circle, Diamond, Triangle, Minus, MoveRight, Type, Spline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResearchNode } from '@/lib/api';
import { CanvasCommentPins } from '@/components/research/CanvasCommentPin';
import { ShapeNode, type ShapeVariant, type ShapeMeta } from './ShapeNode';
import { MermaidDiagramNode } from './MermaidDiagramNode';
import { VisualTemplateNode, type TemplateVariant } from './VisualTemplateNode';
import { FlowDiagramNode, DEFAULT_FLOW_DIAGRAM } from './FlowDiagramNode';
import { WhiteboardNode } from './WhiteboardNode';
import { useRouter } from 'next/navigation';

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
  metadata?: Record<string, unknown>;
};

interface ResearchNodeCardProps {
  node: ResearchNode;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onUpdate: (data: NodeUpdateData) => void;
  onDelete: () => void;
  onCommentClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => void;
  zoom?: number;
  placingPin?: boolean;
  onPinPlaced?: () => void;
}

/* ─── Color helpers ──────────────────────────────────────────── */
const TYPE_DEFAULTS: Record<string, { color: string; label: string }> = {
  // ── Core ──────────────────────────────────────────
  note:            { color: '#F59E0B', label: 'NOTE' },
  document:        { color: '#3B82F6', label: 'DOC' },
  image:           { color: '#22C55E', label: 'IMAGE' },
  pdf:             { color: '#EF4444', label: 'PDF' },
  link:            { color: '#A855F7', label: 'LINK' },
  reference:       { color: '#64748B', label: 'REF' },
  // ── Research & Analysis ──────────────────────────
  insight:         { color: '#10B981', label: 'INSIGHT' },
  hypothesis:      { color: '#8B5CF6', label: 'HYPOTHESIS' },
  question:        { color: '#6366F1', label: 'QUESTION' },
  evidence:        { color: '#14B8A6', label: 'EVIDENCE' },
  citation:        { color: '#0EA5E9', label: 'CITATION' },
  // ── Strategy & Planning ──────────────────────────
  pitch_deck:      { color: '#EC4899', label: 'PITCH' },
  business_plan:   { color: '#7C3AED', label: 'BIZ PLAN' },
  business_model:  { color: '#8B5CF6', label: 'BIZ MODEL' },
  lean_canvas:     { color: '#A78BFA', label: 'LEAN' },
  swot:            { color: '#C084FC', label: 'SWOT' },
  roadmap:         { color: '#2563EB', label: 'ROADMAP' },
  okr:             { color: '#059669', label: 'OKR' },
  vision:          { color: '#7C3AED', label: 'VISION' },
  // ── Financial ────────────────────────────────────
  financial_model: { color: '#16A34A', label: 'FIN MODEL' },
  budget:          { color: '#15803D', label: 'BUDGET' },
  cap_table:       { color: '#047857', label: 'CAP TABLE' },
  invoice:         { color: '#059669', label: 'INVOICE' },
  term_sheet:      { color: '#0D9488', label: 'TERM SHEET' },
  revenue_model:   { color: '#10B981', label: 'REVENUE' },
  // ── Legal ────────────────────────────────────────
  contract:        { color: '#DC2626', label: 'CONTRACT' },
  nda:             { color: '#B91C1C', label: 'NDA' },
  legal:           { color: '#991B1B', label: 'LEGAL' },
  incorporation:   { color: '#9F1239', label: 'INCORP' },
  ip_filing:       { color: '#BE123C', label: 'IP FILING' },
  compliance:      { color: '#E11D48', label: 'COMPLIANCE' },
  // ── Product & Tech ──────────────────────────────
  wireframe:       { color: '#2563EB', label: 'WIREFRAME' },
  spec:            { color: '#1D4ED8', label: 'SPEC' },
  user_story:      { color: '#3B82F6', label: 'USER STORY' },
  api_doc:         { color: '#1E40AF', label: 'API DOC' },
  architecture:    { color: '#1E3A8A', label: 'ARCH' },
  bug_report:      { color: '#DC2626', label: 'BUG' },
  feature_request: { color: '#7C3AED', label: 'FEATURE' },
  // ── Marketing & Sales ───────────────────────────
  competitor:      { color: '#EA580C', label: 'COMPETITOR' },
  market_research: { color: '#D97706', label: 'MARKET' },
  persona:         { color: '#CA8A04', label: 'PERSONA' },
  branding:        { color: '#DB2777', label: 'BRAND' },
  go_to_market:    { color: '#E11D48', label: 'GTM' },
  funnel:          { color: '#F97316', label: 'FUNNEL' },
  // ── Team & Operations ───────────────────────────
  org_chart:       { color: '#0891B2', label: 'ORG CHART' },
  meeting_notes:   { color: '#0E7490', label: 'MEETING' },
  checklist:       { color: '#0D9488', label: 'CHECKLIST' },
  timeline:        { color: '#0284C7', label: 'TIMELINE' },
  kpi:             { color: '#0369A1', label: 'KPI' },
  hiring_plan:     { color: '#075985', label: 'HIRING' },
  onboarding:      { color: '#0C4A6E', label: 'ONBOARD' },
  // ── Communication & Content ─────────────────────
  email_draft:     { color: '#6D28D9', label: 'EMAIL' },
  press_release:   { color: '#7E22CE', label: 'PR' },
  presentation:    { color: '#9333EA', label: 'SLIDES' },
  proposal:        { color: '#A855F7', label: 'PROPOSAL' },
  newsletter:      { color: '#C026D3', label: 'NEWSLETTER' },
  // ── Data & Metrics ──────────────────────────────
  whitepaper:      { color: '#475569', label: 'PAPER' },
  case_study:      { color: '#64748B', label: 'CASE STUDY' },
  survey:          { color: '#94A3B8', label: 'SURVEY' },
  data:            { color: '#334155', label: 'DATA' },
  report:          { color: '#1E293B', label: 'REPORT' },
  // ── Investor Relations ──────────────────────────
  due_diligence:   { color: '#B45309', label: 'DD' },
  investor_update: { color: '#92400E', label: 'UPDATE' },
  data_room:       { color: '#78350F', label: 'DATA ROOM' },
  valuation:       { color: '#451A03', label: 'VALUATION' },
  // ── Task Management ─────────────────────────────
  task:            { color: '#F97316', label: 'TASK' },
  milestone:       { color: '#EF4444', label: 'MILESTONE' },
  sprint:          { color: '#F59E0B', label: 'SPRINT' },
  retrospective:   { color: '#84CC16', label: 'RETRO' },
  // Draw shapes
  shape_rect:      { color: '#3B82F6', label: 'RECT' },
  shape_circle:    { color: '#8B5CF6', label: 'CIRCLE' },
  shape_diamond:   { color: '#F59E0B', label: 'DIAMOND' },
  shape_triangle:  { color: '#10B981', label: 'TRIANGLE' },
  shape_line:      { color: '#94A3B8', label: 'LINE' },
  shape_arrow:     { color: '#6366F1', label: 'ARROW' },
  shape_text:      { color: '#475569', label: 'TEXT' },
  mermaid_diagram: { color: '#EC4899', label: 'DIAGRAM' },
  // Visual templates (Phase 2)
  visual_bmc:  { color: '#3B82F6', label: 'BMC' },
  visual_lean: { color: '#8B5CF6', label: 'LEAN' },
  visual_swot: { color: '#10B981', label: 'SWOT' },
  // Embedded interactive (Phase 2)
  flow_diagram: { color: '#6366F1', label: 'FLOW' },
  whiteboard:   { color: '#06B6D4', label: 'BOARD' },
};

function getEffectiveType(node: ResearchNode): string {
  const meta = node.metadata as Record<string, unknown> | null;
  return (meta?.displayType as string | undefined) || node.type;
}

function getNodeColor(node: ResearchNode) {
  const eff = getEffectiveType(node);
  return node.color || TYPE_DEFAULTS[eff]?.color || TYPE_DEFAULTS[node.type]?.color || '#3B82F6';
}

function getTypeIcon(type: string) {
  switch (type) {
    // Core
    case 'note':            return StickyNote;
    case 'image':           return ImageIcon;
    case 'link':            return LinkIcon;
    case 'pdf':             return FileType;
    case 'reference':       return Users;
    // Research & Analysis
    case 'insight':         return Lightbulb;
    case 'hypothesis':      return FlaskConical;
    case 'question':        return HelpCircle;
    case 'evidence':        return GitBranch;
    case 'citation':        return BookOpen;
    // Strategy & Planning
    case 'pitch_deck':      return Presentation;
    case 'business_plan':   return ClipboardList;
    case 'business_model':  return LayoutGrid;
    case 'lean_canvas':     return LayoutGrid;
    case 'swot':            return Target;
    case 'roadmap':         return Map;
    case 'okr':             return Target;
    case 'vision':          return Compass;
    // Financial
    case 'financial_model': return Calculator;
    case 'budget':          return DollarSign;
    case 'cap_table':       return PieChart;
    case 'invoice':         return Receipt;
    case 'term_sheet':      return Landmark;
    case 'revenue_model':   return TrendingUp;
    // Legal
    case 'contract':        return Scale;
    case 'nda':             return ShieldCheck;
    case 'legal':           return FileCheck;
    case 'incorporation':   return Stamp;
    case 'ip_filing':       return Copyright;
    case 'compliance':      return ShieldAlert;
    // Product & Tech
    case 'wireframe':       return PenTool;
    case 'spec':            return Code;
    case 'user_story':      return Blocks;
    case 'api_doc':         return Server;
    case 'architecture':    return Network;
    case 'bug_report':      return Bug;
    case 'feature_request': return Rocket;
    // Marketing & Sales
    case 'competitor':      return BarChart3;
    case 'market_research': return Search;
    case 'persona':         return UserCircle;
    case 'branding':        return Megaphone;
    case 'go_to_market':    return Megaphone;
    case 'funnel':          return Filter;
    // Team & Operations
    case 'org_chart':       return Network;
    case 'meeting_notes':   return Calendar;
    case 'checklist':       return CheckSquare;
    case 'timeline':        return GanttChart;
    case 'kpi':             return Gauge;
    case 'hiring_plan':     return UserPlus;
    case 'onboarding':      return GraduationCap;
    // Communication & Content
    case 'email_draft':     return Mail;
    case 'press_release':   return Newspaper;
    case 'presentation':    return Presentation;
    case 'proposal':        return Send;
    case 'newsletter':      return Inbox;
    // Data & Metrics
    case 'whitepaper':      return FileBarChart;
    case 'case_study':      return Award;
    case 'survey':          return ClipboardCheck;
    case 'data':            return Database;
    case 'report':          return FileBarChart;
    // Investor Relations
    case 'due_diligence':   return Briefcase;
    case 'investor_update': return TrendingUp;
    case 'data_room':       return FolderOpen;
    case 'valuation':       return CircleDollarSign;
    // Task Management
    case 'task':            return ListTodo;
    case 'milestone':       return Flag;
    case 'sprint':          return Repeat;
    case 'retrospective':   return MessageSquare;
    // Draw shapes
    case 'shape_rect':      return Square;
    case 'shape_circle':    return Circle;
    case 'shape_diamond':   return Diamond;
    case 'shape_triangle':  return Triangle;
    case 'shape_line':      return Minus;
    case 'shape_arrow':     return MoveRight;
    case 'shape_text':      return Type;
    case 'mermaid_diagram': return Spline;
    // Visual templates
    case 'visual_bmc':  return LayoutGrid;
    case 'visual_lean': return Target;
    case 'visual_swot': return Target;
    // Embedded interactive
    case 'flow_diagram': return GitBranch;
    case 'whiteboard':   return PenTool;
    // Default
    case 'document':
    default:                return FileText;
  }
}

function getTypeLabel(type: string) {
  return TYPE_DEFAULTS[type]?.label || 'DOC';
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ─── Node colors for color picker ───────────────────────────── */
const COLOR_PALETTE = [
  { label: 'Blue',   hex: '#3B82F6' },
  { label: 'Purple', hex: '#A855F7' },
  { label: 'Green',  hex: '#22C55E' },
  { label: 'Amber',  hex: '#F59E0B' },
  { label: 'Rose',   hex: '#F43F5E' },
  { label: 'Slate',  hex: '#64748B' },
];

export function ResearchNodeCard({
  node,
  isSelected,
  isDragging,
  onSelect,
  onDragStart,
  onDoubleClick,
  onUpdate,
  onDelete,
  onCommentClick,
  onContextMenu,
  onResizeStart,
  zoom,
  placingPin,
  onPinPlaced,
}: ResearchNodeCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(node.title || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const effectiveType = getEffectiveType(node);
  const nodeColor = getNodeColor(node);
  const Icon = getTypeIcon(effectiveType);
  const typeLabel = getTypeLabel(effectiveType);

  const router = useRouter();

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
      }
    };
    if (showMenu || showColorPicker) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showMenu, showColorPicker]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  // Get content preview (strip HTML) — available for all non-media/link types
  const getContentPreview = () => {
    const NON_TEXT = ['image', 'pdf', 'link', 'reference'];
    if (!NON_TEXT.includes(effectiveType) && !NON_TEXT.includes(node.type) && node.content) {
      const text = stripHtml(node.content);
      return text.length > 120 ? text.slice(0, 120) + '…' : text;
    }
    return null;
  };

  const contentPreview = getContentPreview();
  const isNote = effectiveType === 'note';
  const isImage = effectiveType === 'image' || node.type === 'image';
  const isDoc = !!node.upload && (node.type === 'document' || node.type === 'pdf');
  const isChecklist = effectiveType === 'checklist';
  const isTask = ['task', 'milestone', 'sprint', 'retrospective'].includes(effectiveType);
  const isSticky = isNote && (node.metadata as Record<string, unknown>)?.isSticky === true;

  // Inline sticky note editing state
  const [editingStickyContent, setEditingStickyContent] = useState(false);
  const [stickyContentDraft, setStickyContentDraft] = useState(node.content || '');
  const stickyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const SHAPE_TYPES = new Set(['shape_rect','shape_circle','shape_diamond','shape_triangle','shape_line','shape_arrow','shape_text']);
  const isShape = SHAPE_TYPES.has(effectiveType);
  const isMermaid = effectiveType === 'mermaid_diagram';
  const TEMPLATE_TYPES = new Set(['visual_bmc','visual_lean','visual_swot']);
  const isTemplate = TEMPLATE_TYPES.has(effectiveType);
  const isFlowDiagram = effectiveType === 'flow_diagram';
  const isWhiteboard  = effectiveType === 'whiteboard';

  // ── Shape node rendering ──────────────────────────────────────────────
  if (isShape) {
    const shapeMeta = (node.metadata ?? {}) as ShapeMeta;
    return (
      <div
        className={cn('absolute select-none', isDragging && 'opacity-75 scale-[1.02]')}
        style={{
          left: `${node.posX}px`,
          top: `${node.posY}px`,
          width: `${node.width}px`,
          height: `${node.height || 120}px`,
          zIndex: isSelected ? 10 : (node.zIndex || 1),
        }}
        onMouseDown={onDragStart}
        onClick={(e) => onSelect(e)}
        onContextMenu={onContextMenu}
      >
        <ShapeNode
          variant={effectiveType as ShapeVariant}
          width={node.width}
          height={node.height || 120}
          label={node.title || ''}
          meta={shapeMeta}
          isSelected={isSelected}
          onLabelChange={(label) => onUpdate({ title: label })}
          onMetaChange={(meta) => onUpdate({ metadata: meta as Record<string, unknown> })}
          onDelete={onDelete}
        />
        {isSelected && !node.locked && onResizeStart && (
          <>
            <div className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }} />
            <div className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }} />
          </>
        )}
      </div>
    );
  }

  // ── Visual template rendering ─────────────────────────────────────────
  if (isTemplate) {
    return (
      <div
        className={cn('absolute group select-none', isDragging && 'opacity-75 scale-[1.02]')}
        style={{
          left: `${node.posX}px`,
          top: `${node.posY}px`,
          width: `${node.width}px`,
          height: `${node.height || 400}px`,
          zIndex: isSelected ? 10 : (node.zIndex || 2),
        }}
        onMouseDown={onDragStart}
        onClick={(e) => onSelect(e)}
        onContextMenu={onContextMenu}
      >
        <VisualTemplateNode
          variant={effectiveType as TemplateVariant}
          width={node.width}
          height={node.height || 400}
          content={node.content}
          isSelected={isSelected}
          readOnly={node.locked}
          onChange={(c) => onUpdate({ content: c })}
          onDelete={onDelete}
        />
        {isSelected && !node.locked && onResizeStart && (
          <>
            <div className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }} />
            <div className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }} />
          </>
        )}
      </div>
    );
  }

  // ── Flow diagram rendering ─────────────────────────────────────────
  if (isFlowDiagram) {
    const defaultContent = JSON.stringify(DEFAULT_FLOW_DIAGRAM);
    return (
      <div
        className={cn('absolute group select-none', isDragging && 'opacity-75 scale-[1.02]')}
        style={{ left: `${node.posX}px`, top: `${node.posY}px`, width: `${node.width}px`, height: `${node.height || 360}px`, zIndex: isSelected ? 10 : (node.zIndex || 2) }}
        onMouseDown={onDragStart}
        onClick={(e) => onSelect(e)}
        onContextMenu={onContextMenu}
      >
        <FlowDiagramNode
          width={node.width}
          height={node.height || 360}
          content={node.content || defaultContent}
          isSelected={isSelected}
          readOnly={node.locked}
          onChange={(c) => onUpdate({ content: c })}
          onDelete={onDelete}
        />
        {isSelected && !node.locked && onResizeStart && (
          <>
            <div className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }} />
            <div className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }} />
          </>
        )}
      </div>
    );
  }

  // ── Whiteboard rendering ───────────────────────────────────────────
  if (isWhiteboard) {
    return (
      <div
        className={cn('absolute group select-none', isDragging && 'opacity-75 scale-[1.02]')}
        style={{ left: `${node.posX}px`, top: `${node.posY}px`, width: `${node.width}px`, height: `${node.height || 400}px`, zIndex: isSelected ? 10 : (node.zIndex || 2) }}
        onMouseDown={onDragStart}
        onClick={(e) => onSelect(e)}
        onContextMenu={onContextMenu}
      >
        <WhiteboardNode
          width={node.width}
          height={node.height || 400}
          content={node.content}
          isSelected={isSelected}
          readOnly={node.locked}
          onChange={(c) => onUpdate({ content: c })}
          onDelete={onDelete}
        />
        {isSelected && !node.locked && onResizeStart && (
          <>
            <div className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }} />
            <div className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize z-20" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }} />
          </>
        )}
      </div>
    );
  }

  // ── Mermaid diagram rendering ─────────────────────────────────────────
  if (isMermaid) {
    return (
      <div
        className={cn(
          'absolute group select-none rounded-xl border-2 bg-card shadow-sm transition-all duration-150',
          isSelected && 'ring-2 ring-primary ring-offset-1 shadow-md',
          !isSelected && 'hover:shadow-md',
          isDragging && 'opacity-75 shadow-xl scale-[1.02]',
          'cursor-grab active:cursor-grabbing',
        )}
        style={{
          left: `${node.posX}px`,
          top: `${node.posY}px`,
          width: `${node.width}px`,
          height: `${node.height || 300}px`,
          borderColor: '#EC4899B3',
          zIndex: isSelected ? 10 : (node.zIndex || 2),
        }}
        onMouseDown={onDragStart}
        onClick={(e) => onSelect(e)}
        onContextMenu={onContextMenu}
      >
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-1.5">
            <Spline className="w-3.5 h-3.5" style={{ color: '#EC4899' }} aria-hidden="true" />
            <span className="text-2xs font-semibold uppercase tracking-wide" style={{ color: '#EC4899' }}>DIAGRAM</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); handleDelete(e); }} className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-destructive/10 text-destructive-emphasis">
              <Trash2 className="icon-2xs" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="h-[calc(100%-36px)]" onMouseDown={(e) => e.stopPropagation()}>
          <MermaidDiagramNode
            content={node.content || ''}
            onChange={(c) => onUpdate({ content: c })}
            readOnly={node.locked}
          />
        </div>
        {isSelected && !node.locked && onResizeStart && (
          <>
            <div className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize opacity-0 group-hover:opacity-100" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }} />
            <div className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize opacity-0 group-hover:opacity-100" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize opacity-0 group-hover:opacity-100 z-10" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }} />
          </>
        )}
      </div>
    );
  }

  // ── Sticky note special rendering ──────────────────────────────────────
  if (isSticky) {
    const STICKY_COLORS = [
      { name: 'Yellow', bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
      { name: 'Green', bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
      { name: 'Blue', bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
      { name: 'Pink', bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
      { name: 'Purple', bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6' },
      { name: 'Orange', bg: '#FFEDD5', border: '#F97316', text: '#9A3412' },
    ];
    const stickyColor = STICKY_COLORS.find((c) => c.border === node.color) || STICKY_COLORS[0];

    return (
      <div
        className={cn(
          'absolute group select-none rounded-lg shadow-md transition-all duration-150',
          isSelected && 'ring-2 ring-primary ring-offset-1 shadow-lg',
          isDragging && 'opacity-75 shadow-xl scale-[1.02]',
          'cursor-grab active:cursor-grabbing',
        )}
        style={{
          left: `${node.posX}px`,
          top: `${node.posY}px`,
          width: `${node.width}px`,
          minHeight: '100px',
          backgroundColor: stickyColor.bg,
          borderLeft: `4px solid ${stickyColor.border}`,
          zIndex: isSelected ? 10 : (node.zIndex || 2),
        }}
        onMouseDown={onDragStart}
        onClick={(e) => onSelect(e)}
        onDoubleClick={(e) => {
          if (!node.locked) {
            e.stopPropagation();
            setStickyContentDraft(node.content || '');
            setEditingStickyContent(true);
          }
        }}
        onContextMenu={onContextMenu}
      >
        {/* Sticky header with color dots + delete */}
        <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
          <div className="flex items-center gap-1">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={(e) => { e.stopPropagation(); onUpdate({ color: c.border }); }}
                className={cn('w-3 h-3 rounded-full border transition-transform hover:scale-125', node.color === c.border ? 'border-foreground/60 scale-125' : 'border-transparent')}
                style={{ backgroundColor: c.border }}
                title={c.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdate({ locked: !node.locked }); }}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/10"
            >
              {node.locked ? <Lock className="w-2.5 h-2.5" style={{ color: stickyColor.text }} aria-hidden="true" /> : <Unlock className="w-2.5 h-2.5 opacity-40" aria-hidden="true" />}
            </button>
            <button
              onClick={handleDelete}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-200/50"
            >
              <X className="w-2.5 h-2.5 text-destructive-emphasis" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Sticky content — inline editable */}
        <div className="px-3 pb-3">
          {editingStickyContent ? (
            <textarea
              ref={stickyTextareaRef}
              value={stickyContentDraft}
              onChange={(e) => setStickyContentDraft(e.target.value)}
              onBlur={() => {
                setEditingStickyContent(false);
                if (stickyContentDraft !== node.content) onUpdate({ content: stickyContentDraft });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setStickyContentDraft(node.content || ''); setEditingStickyContent(false); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent outline-none resize-none text-xs leading-relaxed"
              style={{ color: stickyColor.text, minHeight: '60px' }}
              autoFocus
              placeholder="Write something…"
            />
          ) : (
            <p
              className="text-xs leading-relaxed whitespace-pre-wrap cursor-text min-h-[40px]"
              style={{ color: stickyColor.text }}
            >
              {node.content ? stripHtml(node.content) : <span className="opacity-40 italic">Double-click to edit…</span>}
            </p>
          )}
          {node.title && (
            <p className="text-2xs font-semibold mt-2 uppercase tracking-wide opacity-60" style={{ color: stickyColor.text }}>
              {node.title}
            </p>
          )}
        </div>

        {/* Resize handles */}
        {isSelected && !node.locked && onResizeStart && (
          <>
            <div className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }} />
            <div className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }} />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-10" onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }}>
              <svg viewBox="0 0 14 14" className="w-full h-full"><path d="M12 2L2 12M12 6L6 12M12 10L10 12" stroke={stickyColor.border} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" /></svg>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Standard node card rendering ──────────────────────────────────────
  return (
    <div
      className={cn(
        'absolute group select-none',
        'rounded-xl border-2 bg-card transition-all duration-150',
        'shadow-sm',
        isSelected && 'ring-2 ring-primary ring-offset-1 shadow-md',
        !isSelected && 'hover:shadow-md',
        isDragging && 'opacity-75 shadow-xl scale-[1.02]',
        node.locked && 'border-dashed',
        'cursor-grab active:cursor-grabbing',
      )}
      style={{
        left: `${node.posX}px`,
        top: `${node.posY}px`,
        width: `${node.width}px`,
        height: node.collapsed ? 'auto' : undefined,
        borderColor: `${nodeColor}B3`,
        zIndex: isSelected ? 10 : (node.zIndex || 2),
      }}
      onMouseDown={onDragStart}
      onClick={(e) => onSelect(e)}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {/* Type strip + actions */}
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-4 h-4 shrink-0" style={{ color: nodeColor }} />
          <span
            className="text-2xs font-semibold uppercase tracking-wide"
            style={{ color: nodeColor }}
          >
            {typeLabel}
          </span>
        </div>
        <div ref={menuRef} className="relative flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.locked && <Lock className="icon-2xs text-muted-foreground" aria-hidden="true" />}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); setShowColorPicker(false); }}
            className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          </button>

          {/* Context menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 min-w-[150px] bg-card border border-border rounded-xl shadow-lg py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onDoubleClick(); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary w-full text-left transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Open
              </button>
              {node.builderDocumentId && (
                <button
                  onClick={() => { router.push('/builder'); setShowMenu(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-primary-emphasis hover:bg-primary/10 w-full text-left transition-colors"
                >
                  <Rocket className="w-3.5 h-3.5" aria-hidden="true" /> Open in Builder
                </button>
              )}
              <button
                onClick={() => { onUpdate({ locked: !node.locked }); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary w-full text-left transition-colors"
              >
                {node.locked
                  ? <><Unlock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Unlock</>
                  : <><Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Lock</>
                }
              </button>
              <button
                onClick={() => { onUpdate({ collapsed: !node.collapsed }); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary w-full text-left transition-colors"
              >
                {node.collapsed
                  ? <><Eye className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Expand</>
                  : <><EyeOff className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Collapse</>
                }
              </button>
              <button
                onClick={() => { setShowColorPicker(true); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary w-full text-left transition-colors"
              >
                <Palette className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Color
              </button>
              {onCommentClick && (
                <button
                  onClick={() => { onCommentClick(); setShowMenu(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary w-full text-left transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Comments
                </button>
              )}
              <div className="my-1 border-t border-border/60" />
              <button
                onClick={(e) => { handleDelete(e); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive-emphasis hover:bg-destructive/10 w-full text-left transition-colors"
                disabled={node.locked}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
              </button>
            </div>
          )}

          {/* Color picker popover */}
          {showColorPicker && (
            <div
              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg p-2 z-50 flex flex-wrap gap-1.5 w-[116px]"
              onClick={(e) => e.stopPropagation()}
            >
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => { onUpdate({ color: c.hex }); setShowColorPicker(false); }}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                    node.color === c.hex ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content preview */}
      {!node.collapsed && (
        <div className="px-2.5 pb-2.5">
          {/* Image thumbnail */}
          {isImage && node.url && (
            <div className="rounded-lg overflow-hidden mb-2 h-24 bg-secondary">
              <img
                src={node.url}
                alt={node.title || 'Image'}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}

          {/* Checklist preview — show first few items as checkboxes */}
          {isChecklist && (() => {
            const meta = node.metadata as Record<string, unknown> | null;
            const items = (meta?.checklistItems as Array<{id: string; text: string; checked: boolean}>) || [];
            const done = items.filter((i) => i.checked).length;
            return (
              <div className="space-y-0.5">
                {items.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <div className={cn('w-3 h-3 rounded border shrink-0', item.checked ? 'bg-primary border-primary' : 'border-muted-foreground/40')} />
                    <span className={cn('text-2xs truncate', item.checked ? 'line-through text-muted-foreground/50' : 'text-foreground/70')}>
                      {item.text || 'Untitled item'}
                    </span>
                  </div>
                ))}
                {items.length > 4 && <p className="text-2xs text-muted-foreground/50">+{items.length - 4} more</p>}
                {items.length > 0 && (
                  <p className="text-2xs text-muted-foreground/50 mt-1">{done}/{items.length} done</p>
                )}
                {items.length === 0 && <p className="text-2xs text-muted-foreground/50 italic">Empty checklist</p>}
              </div>
            );
          })()}

          {/* Task status badge */}
          {isTask && (() => {
            const meta = node.metadata as Record<string, unknown> | null;
            const status = (meta?.status as string) || 'todo';
            const priority = (meta?.priority as string) || 'medium';
            const dueDate = meta?.dueDate as string | undefined;
            const STATUS_COLORS: Record<string, string> = { todo: 'bg-slate-100 text-slate-600', in_progress: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700', blocked: 'bg-red-100 text-red-700' };
            const PRIORITY_COLORS: Record<string, string> = { low: 'text-slate-400', medium: 'text-amber-500', high: 'text-orange-500', urgent: 'text-red-600 dark:text-red-400' };
            return (
              <div className="flex flex-wrap gap-1 items-center">
                <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-medium', STATUS_COLORS[status] || STATUS_COLORS['todo'])}>
                  {status.replace('_', ' ')}
                </span>
                <span className={cn('text-2xs font-semibold', PRIORITY_COLORS[priority] || PRIORITY_COLORS['medium'])}>
                  ● {priority}
                </span>
                {dueDate && <span className="text-2xs text-muted-foreground">Due {dueDate}</span>}
              </div>
            );
          })()}

          {/* Note/document content preview */}
          {contentPreview && !isImage && !isDoc && !isChecklist && !isTask && effectiveType !== 'link' && effectiveType !== 'reference' && node.type !== 'link' && node.type !== 'reference' && (
            <p className="text-2xs text-foreground/70 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {contentPreview}
            </p>
          )}

          {/* Document/PDF file info — always show icon box for doc types */}
          {isDoc && (
            <div className="flex items-center gap-2 py-2 px-2 rounded-lg bg-secondary mb-1.5">
              <Icon className="w-6 h-6 opacity-70 shrink-0" style={{ color: nodeColor }} />
              <div className="min-w-0">
                <p className="text-2xs text-muted-foreground truncate">
                  {node.upload?.mimeType ?? 'Document'}
                </p>
                {node.upload?.sizeBytes && (
                  <p className="text-2xs text-muted-foreground/60">{fmtSize(node.upload.sizeBytes)}</p>
                )}
              </div>
            </div>
          )}

          {/* Link preview */}
          {(effectiveType === 'link' || node.type === 'link') && node.url && (
            <p className="text-2xs text-primary-emphasis truncate underline">{node.url}</p>
          )}

          {/* Reference preview */}
          {(effectiveType === 'reference' || node.type === 'reference') && (
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-secondary">
              <Users className="icon-md text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-2xs text-muted-foreground truncate">Entity reference</span>
            </div>
          )}

          {/* Tags */}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {node.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-2xs px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {node.tags.length > 3 && (
                <span className="text-2xs text-muted-foreground">+{node.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Phase 10 — Builder document link badge */}
          {node.builderDocumentId && (
            <div
              className="flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 cursor-pointer w-fit"
              onClick={(e) => { e.stopPropagation(); router.push('/builder'); }}
              title="Linked to a Builder document — click to open Builder"
            >
              <Rocket className="w-2.5 h-2.5 text-primary-emphasis" aria-hidden="true" />
              <span className="text-2xs font-medium text-primary-emphasis">Linked to Builder</span>
            </div>
          )}

          {/* Title at the bottom — inline editable on double-click */}
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                if (titleDraft.trim() && titleDraft !== node.title) onUpdate({ title: titleDraft.trim() });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
                if (e.key === 'Escape') { setTitleDraft(node.title || ''); setEditingTitle(false); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="mt-2 w-full text-xs font-medium text-foreground leading-snug bg-transparent border-b border-primary outline-none px-0 py-0.5"
              autoFocus
            />
          ) : (
            <p
              className="mt-2 text-xs font-medium text-foreground leading-snug line-clamp-2 cursor-text"
              onDoubleClick={(e) => {
                if (node.locked) return;
                e.stopPropagation();
                setTitleDraft(node.title || '');
                setEditingTitle(true);
              }}
            >
              {node.title || node.upload?.originalName || 'Untitled'}
            </p>
          )}
        </div>
      )}

      {/* Collapsed indicator */}
      {node.collapsed && (
        <div className="px-2.5 pb-2 flex items-center gap-1.5">
          <Minimize2 className="icon-2xs text-muted-foreground" aria-hidden="true" />
          <span className="text-2xs text-muted-foreground truncate">
            {node.title || 'Untitled'}
          </span>
        </div>
      )}

      {/* Inline canvas comment pins overlay (Phase 8b) */}
      <CanvasCommentPins
        nodeId={node.id}
        zoom={zoom ?? 1}
        nodeWidth={node.width}
        nodeHeight={node.height || 200}
        enabled={!node.locked}
        placingPin={placingPin}
        onPinPlaced={onPinPlaced}
      />

      {/* Resize handles — visible on hover when selected and not locked */}
      {isSelected && !node.locked && !node.collapsed && onResizeStart && (
        <>
          {/* Right edge */}
          <div
            className="absolute top-2 -right-1 w-2 h-[calc(100%-16px)] cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 rounded-r"
            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }}
          />
          {/* Bottom edge */}
          <div
            className="absolute -bottom-1 left-2 w-[calc(100%-16px)] h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 rounded-b"
            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }}
          />
          {/* Corner handle */}
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }}
          >
            <svg viewBox="0 0 14 14" className="w-full h-full">
              <path d="M12 2L2 12M12 6L6 12M12 10L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/60" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
