'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Undo, Redo, Quote, Code, Minus, Highlighter, RemoveFormatting,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';

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

  const ToolBtn = ({
    onClick,
    icon: Icon,
    title,
    children,
  }: {
    onClick: () => void;
    icon?: React.ElementType;
    title: string;
    children?: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
    >
      {Icon ? <Icon className="w-3.5 h-3.5" /> : children}
    </button>
  );

  if (readOnly) {
    return (
      <SanitizedHtml
        className={cn('prose prose-sm dark:prose-invert max-w-none p-4', className)}
        html={content}
      />
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 px-2.5 py-2 border-b border-border bg-card sticky top-0 z-10">
        <ToolBtn onClick={() => execCommand('undo')} icon={Undo} title="Undo (Ctrl+Z)" />
        <ToolBtn onClick={() => execCommand('redo')} icon={Redo} title="Redo (Ctrl+Shift+Z)" />
        <div className="w-px h-5 bg-border mx-1 self-center" />
        <ToolBtn onClick={() => execCommand('bold')} icon={Bold} title="Bold (Ctrl+B)" />
        <ToolBtn onClick={() => execCommand('italic')} icon={Italic} title="Italic (Ctrl+I)" />
        <ToolBtn onClick={() => execCommand('underline')} icon={Underline} title="Underline (Ctrl+U)" />
        <ToolBtn onClick={() => execCommand('strikeThrough')} icon={Strikethrough} title="Strikethrough" />
        <div className="w-px h-5 bg-border mx-1 self-center" />
        <ToolBtn onClick={() => execCommand('formatBlock', 'h2')} title="Heading 1"><span className="text-2xs font-bold">H1</span></ToolBtn>
        <ToolBtn onClick={() => execCommand('formatBlock', 'h3')} title="Heading 2"><span className="text-2xs font-bold">H2</span></ToolBtn>
        <ToolBtn onClick={() => execCommand('formatBlock', 'h4')} title="Heading 3"><span className="text-2xs font-bold">H3</span></ToolBtn>
        <ToolBtn onClick={() => execCommand('formatBlock', 'p')} title="Paragraph"><span className="text-2xs">P</span></ToolBtn>
        <div className="w-px h-5 bg-border mx-1 self-center" />
        <ToolBtn onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
        <ToolBtn onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
        <div className="w-px h-5 bg-border mx-1 self-center" />
        <ToolBtn onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" />
        <ToolBtn onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" />
        <ToolBtn onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" />
        <div className="w-px h-5 bg-border mx-1 self-center" />
        <ToolBtn onClick={insertLink} icon={LinkIcon} title="Insert Link" />
        <ToolBtn onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} title="Blockquote" />
        <ToolBtn onClick={() => execCommand('formatBlock', 'pre')} icon={Code} title="Code Block" />
        <ToolBtn onClick={() => execCommand('insertHorizontalRule')} icon={Minus} title="Horizontal Rule" />
        <div className="w-px h-5 bg-border mx-1 self-center" />
        <ToolBtn onClick={() => execCommand('hiliteColor', '#fef08a')} icon={Highlighter} title="Highlight" />
        <ToolBtn onClick={() => execCommand('removeFormat')} icon={RemoveFormatting} title="Clear Formatting" />
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 min-h-[200px] px-5 py-4 outline-none overflow-y-auto text-sm text-foreground leading-relaxed cursor-text',
            'prose prose-sm dark:prose-invert max-w-none',
            '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-4',
            '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3',
            '[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mb-1.5 [&_h4]:mt-2.5',
            '[&_p]:mb-2 [&_p]:leading-relaxed',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3',
            '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3',
            '[&_a]:text-primary-emphasis [&_a]:underline [&_a]:underline-offset-2',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3',
            '[&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto',
            '[&_code]:bg-secondary [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
            '[&_hr]:border-border [&_hr]:my-4',
          )}
          suppressContentEditableWarning
        />
        {isEmpty && (
          <div className="absolute top-4 left-5 text-sm text-muted-foreground/50 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
