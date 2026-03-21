'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Heading1, Heading2, Undo, Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!content);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
      setIsEmpty(!content);
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      setIsEmpty(!textContent.trim());
      onChange(html);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
      }
    }
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    active = false,
  }: {
    onClick: () => void;
    icon: React.ElementType;
    title: string;
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={cn(
        'h-8 w-8 p-0',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  if (readOnly) {
    return (
      <div
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none p-4',
          className
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => execCommand('undo')}
            icon={Undo}
            title="Undo (Ctrl+Z)"
          />
          <ToolbarButton
            onClick={() => execCommand('redo')}
            icon={Redo}
            title="Redo (Ctrl+Shift+Z)"
          />
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => execCommand('formatBlock', 'h1')}
            icon={Heading1}
            title="Heading 1"
          />
          <ToolbarButton
            onClick={() => execCommand('formatBlock', 'h2')}
            icon={Heading2}
            title="Heading 2"
          />
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => execCommand('bold')}
            icon={Bold}
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton
            onClick={() => execCommand('italic')}
            icon={Italic}
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            onClick={() => execCommand('underline')}
            icon={Underline}
            title="Underline (Ctrl+U)"
          />
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => execCommand('insertUnorderedList')}
            icon={List}
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => execCommand('insertOrderedList')}
            icon={ListOrdered}
            title="Numbered List"
          />
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => execCommand('justifyLeft')}
            icon={AlignLeft}
            title="Align Left"
          />
          <ToolbarButton
            onClick={() => execCommand('justifyCenter')}
            icon={AlignCenter}
            title="Align Center"
          />
          <ToolbarButton
            onClick={() => execCommand('justifyRight')}
            icon={AlignRight}
            title="Align Right"
          />
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={insertLink}
          icon={LinkIcon}
          title="Insert Link"
        />
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-[200px] p-4 outline-none',
            'prose prose-sm dark:prose-invert max-w-none',
            '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4',
            '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3',
            '[&_p]:mb-2',
            '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2',
            '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2',
            '[&_a]:text-primary [&_a]:underline',
          )}
          suppressContentEditableWarning
        />
        {isEmpty && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
