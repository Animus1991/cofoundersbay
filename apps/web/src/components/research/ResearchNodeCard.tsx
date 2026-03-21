'use client';

import { useState, useCallback } from 'react';
import {
  FileText, Image as ImageIcon, Link as LinkIcon, StickyNote,
  MoreVertical, Lock, Unlock, Trash2, Copy, Edit2,
  Eye, EyeOff, Maximize2, Minimize2, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResearchNode } from '@/lib/api';

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

interface ResearchNodeCardProps {
  node: ResearchNode;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onUpdate: (data: NodeUpdateData) => void;
  onDelete: () => void;
  onCommentClick?: () => void;
}

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
}: ResearchNodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeIcon = () => {
    switch (node.type) {
      case 'note':
        return StickyNote;
      case 'image':
        return ImageIcon;
      case 'link':
        return LinkIcon;
      case 'pdf':
      case 'document':
      default:
        return FileText;
    }
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'note':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300';
      case 'image':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300';
      case 'link':
        return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300';
      case 'pdf':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300';
      case 'document':
        return 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/30 dark:border-gray-600 dark:text-gray-300';
    }
  };

  const Icon = getTypeIcon();
  const typeColor = getTypeColor();

  const handleLockToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ locked: !node.locked });
  }, [node.locked, onUpdate]);

  const handleCollapseToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ collapsed: !node.collapsed });
  }, [node.collapsed, onUpdate]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement duplicate functionality
    console.log('Duplicate node:', node.id);
  }, [node.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  const getPreviewContent = () => {
    if (node.type === 'note' && node.content) {
      return node.content.length > 100 ? node.content.substring(0, 100) + '...' : node.content;
    }
    if (node.upload?.originalName) {
      return node.upload.originalName;
    }
    if (node.url && node.type === 'link') {
      return node.url;
    }
    return node.title || 'Untitled';
  };

  const getMetadata = () => {
    const metadata = [];
    if (node.upload?.sizeBytes) {
      metadata.push(`${(node.upload.sizeBytes / 1024).toFixed(1)}KB`);
    }
    if (node.upload?.mimeType) {
      metadata.push(node.upload.mimeType.split('/')[1]?.toUpperCase() || 'FILE');
    }
    if (node.tags.length > 0) {
      metadata.push(node.tags.slice(0, 2).join(', '));
    }
    return metadata.join(' • ');
  };

  return (
    <div
      className={cn(
        'absolute bg-card border rounded-lg shadow-sm cursor-move transition-all duration-200',
        'hover:shadow-md hover:border-primary/40',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'opacity-80 shadow-lg',
        node.locked && 'border-dashed',
        node.color && 'border-2',
      )}
      style={{
        left: `${node.posX}px`,
        top: `${node.posY}px`,
        width: `${node.width}px`,
        height: node.collapsed ? 'auto' : `${node.height}px`,
        backgroundColor: node.color ? `${node.color}10` : undefined,
        borderColor: node.color || undefined,
        zIndex: node.zIndex,
      }}
      onMouseDown={onDragStart}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2 border-b">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0', typeColor)}>
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-sm font-medium truncate">
            {node.title || node.upload?.originalName || 'Untitled'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {node.collapsed ? (
            <Maximize2 className="w-3 h-3 text-muted-foreground" />
          ) : (
            <Minimize2 className="w-3 h-3 text-muted-foreground" />
          )}
          {node.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
      </div>

      {/* Content */}
      {!node.collapsed && (
        <div className="p-3 pt-2">
          <div className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
            {getPreviewContent()}
          </div>
          {getMetadata() && (
            <div className="text-xs text-muted-foreground mt-2 truncate">
              {getMetadata()}
            </div>
          )}
        </div>
      )}

      {/* Hover overlay with actions */}
      {isHovered && (
        <div className="absolute -top-1 -right-1 flex gap-1 bg-background border rounded-md shadow-sm p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleLockToggle}
            title={node.locked ? 'Unlock' : 'Lock'}
          >
            {node.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCollapseToggle}
            title={node.collapsed ? 'Expand' : 'Collapse'}
          >
            {node.collapsed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDuplicate}
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </Button>
          {onCommentClick && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => { e.stopPropagation(); onCommentClick(); }}
              title="Comments"
            >
              <MessageCircle className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={handleDelete}
            title="Delete"
            disabled={node.locked}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -inset-1 border-2 border-primary rounded-lg pointer-events-none" />
      )}

      {/* Resize handle */}
      {!node.locked && isHovered && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-tl-lg cursor-se-resize" />
      )}
    </div>
  );
}
