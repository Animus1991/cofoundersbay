'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Download, Edit2, Save, Loader2, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { ResearchNode } from '@/lib/api';
import { RichTextEditor } from './RichTextEditor';

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

interface ResearchNodeViewerProps {
  node: ResearchNode;
  onClose: () => void;
  onUpdate: (data: NodeUpdateData) => void;
}

export function ResearchNodeViewer({ node, onClose, onUpdate }: ResearchNodeViewerProps) {
  const { success, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(node.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditable = node.type === 'note' || node.type === 'document';
  const canDownload = node.upload && (node.type === 'pdf' || node.type === 'document' || node.type === 'image');

  const handleSave = useCallback(async () => {
    if (!isEditable) return;
    
    setIsSaving(true);
    try {
      onUpdate({ content: editedContent });
      success('Changes saved', 'Your edits have been saved');
      setIsEditing(false);
    } catch (err) {
      showError('Failed to save', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setIsSaving(false);
    }
  }, [editedContent, isEditable, onUpdate, success, showError]);

  const handleDownload = useCallback(async () => {
    if (!node.upload) return;
    
    try {
      const response = await fetch(node.upload.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = node.upload.originalName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Download started', 'File download has begun');
    } catch (err) {
      showError('Download failed', err instanceof Error ? err.message : 'Please try again');
    }
  }, [node.upload, success, showError]);

  const renderContent = () => {
    if (node.type === 'link' && node.url) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <LinkIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">External Link</h3>
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all text-center"
          >
            {node.url}
          </a>
        </div>
      );
    }

    if (node.type === 'image' && node.url) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <img
            src={node.url}
            alt={node.title || 'Image'}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              showError('Failed to load image', 'The image could not be displayed');
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'pdf' && node.url) {
      return (
        <div className="h-full">
          <iframe
            src={node.url}
            className="w-full h-full border-0"
            title={node.title || 'PDF Document'}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              showError('Failed to load PDF', 'The PDF could not be displayed');
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      );
    }

    // Text content (note, document)
    if (isEditing) {
      return (
        <div className="h-full p-4 overflow-y-auto">
          <RichTextEditor
            content={editedContent}
            onChange={setEditedContent}
            placeholder="Start typing your research notes..."
            className="h-full"
          />
        </div>
      );
    }

    return (
      <div className="h-full p-6 overflow-y-auto">
        {editedContent ? (
          <RichTextEditor
            content={editedContent}
            onChange={() => {}}
            readOnly
            className="border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-12 h-12 mb-4" />
            <p>No content yet</p>
            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const getTitleIcon = () => {
    switch (node.type) {
      case 'image':
        return ImageIcon;
      case 'link':
        return LinkIcon;
      default:
        return FileText;
    }
  };

  const Icon = getTitleIcon();

  // Keyboard shortcuts for the editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditedContent(node.content || '');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleSave, node.content]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <h2 className="text-lg font-semibold truncate">
              {node.title || node.upload?.originalName || 'Untitled'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {canDownload && (
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
            )}
            {isEditable && !isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {isEditable && isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative h-[60vh] overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer for editing mode */}
        {isEditing && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/50">
            <div className="text-sm text-muted-foreground">
              Press Ctrl+S to save, Esc to cancel
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(node.content || '');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
