'use client';

import { useCallback } from 'react';
import {
  MousePointer2, Hand, Square, Circle, Diamond, Triangle,
  Minus, MoveRight, Type, StickyNote, GitBranch,
  Spline, Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawTool =
  | 'select'
  | 'hand'
  | 'shape_rect'
  | 'shape_circle'
  | 'shape_diamond'
  | 'shape_triangle'
  | 'shape_line'
  | 'shape_arrow'
  | 'shape_text'
  | 'note'
  | 'connect'
  | 'mermaid';

interface ToolGroup {
  label: string;
  tools: ToolDef[];
}

interface ToolDef {
  tool: DrawTool;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  color?: string;
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    label: 'Selection',
    tools: [
      { tool: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
      { tool: 'hand',   icon: Hand,          label: 'Pan',    shortcut: 'H' },
    ],
  },
  {
    label: 'Shapes',
    tools: [
      { tool: 'shape_rect',     icon: Square,    label: 'Rectangle', shortcut: 'R', color: '#3B82F6' },
      { tool: 'shape_circle',   icon: Circle,    label: 'Circle',    shortcut: 'O', color: '#8B5CF6' },
      { tool: 'shape_diamond',  icon: Diamond,   label: 'Diamond',   shortcut: 'D', color: '#F59E0B' },
      { tool: 'shape_triangle', icon: Triangle,  label: 'Triangle',  shortcut: 'T', color: '#10B981' },
      { tool: 'shape_line',     icon: Minus,     label: 'Line',      shortcut: 'L', color: '#94A3B8' },
      { tool: 'shape_arrow',    icon: MoveRight, label: 'Arrow',     shortcut: 'A', color: '#6366F1' },
    ],
  },
  {
    label: 'Text & Notes',
    tools: [
      { tool: 'shape_text', icon: Type,        label: 'Text Label', shortcut: 'X', color: '#475569' },
      { tool: 'note',       icon: StickyNote,  label: 'Sticky Note', shortcut: 'N', color: '#F59E0B' },
    ],
  },
  {
    label: 'Connect',
    tools: [
      { tool: 'connect', icon: GitBranch, label: 'Connector', shortcut: 'C', color: '#10B981' },
    ],
  },
  {
    label: 'Diagram',
    tools: [
      { tool: 'mermaid', icon: Spline, label: 'Mermaid Diagram', shortcut: 'M', color: '#EC4899' },
    ],
  },
];

interface CanvasDrawToolbarProps {
  activeTool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  onToggleLibrary?: () => void;
  libraryOpen?: boolean;
}

export function CanvasDrawToolbar({ activeTool, onToolChange, onToggleLibrary, libraryOpen }: CanvasDrawToolbarProps) {
  const handleKey = useCallback((tool: DrawTool) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onToolChange(tool);
  }, [onToolChange]);

  return (
    <div
      className="flex flex-col items-center gap-1 py-2 px-1.5 bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl z-40 select-none"
      style={{ width: 44 }}
    >
      {TOOL_GROUPS.map((group, gi) => (
        <div key={group.label} className="flex flex-col items-center gap-0.5 w-full">
          {gi > 0 && <div className="w-6 h-px bg-border/60 my-0.5" />}
          {group.tools.map((def) => {
            const Icon = def.icon;
            const isActive = activeTool === def.tool;
            return (
              <button
                key={def.tool}
                onMouseDown={handleKey(def.tool)}
                title={`${def.label}${def.shortcut ? ` (${def.shortcut})` : ''}`}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-100',
                  'hover:bg-secondary active:scale-95',
                  isActive
                    ? 'bg-primary/15 ring-1 ring-primary/50 text-primary-accessible'
                    : 'text-muted-foreground',
                )}
                style={isActive && def.color ? { color: def.color } : undefined}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      ))}

      {/* Shape Library toggle */}
      {onToggleLibrary && (
        <>
          <div className="w-6 h-px bg-border/60 my-0.5" />
          <button
            onMouseDown={(e) => { e.stopPropagation(); onToggleLibrary(); }}
            title="Shape Library (Shapes panel)"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-100',
              'hover:bg-secondary active:scale-95',
              libraryOpen ? 'bg-violet-500/15 ring-1 ring-violet-400/50 text-violet-500' : 'text-muted-foreground',
            )}
          >
            <Library className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Active tool indicator dot */}
      <div className="w-6 h-px bg-border/60 my-0.5" />
      <div
        className="w-2 h-2 rounded-full transition-colors duration-200"
        style={{
          backgroundColor:
            TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t.tool === activeTool)?.color ?? '#3B82F6',
        }}
        title="Active tool"
      />
    </div>
  );
}
