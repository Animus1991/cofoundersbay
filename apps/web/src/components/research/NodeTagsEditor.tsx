'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const SUGGESTED_TAGS = [
  'research', 'market-analysis', 'competitor', 'funding', 'team',
  'product', 'strategy', 'validation', 'customer', 'technology',
  'legal', 'finance', 'marketing', 'operations', 'growth',
  'mentor-notes', 'due-diligence', 'pitch-deck', 'investor',
];

const TAG_COLORS: Record<string, string> = {
  research: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'market-analysis': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  competitor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  funding: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  team: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  product: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  strategy: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  validation: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

interface NodeTagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
}

export function NodeTagsEditor({ tags, onChange, compact = false }: NodeTagsEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default;
  };

  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag]);
    }
    setInputValue('');
  }, [tags, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }, [inputValue, tags, addTag, removeTag]);

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (tag) => !tags.includes(tag) && tag.includes(inputValue.toLowerCase())
  );

  if (compact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1">
            <Tag className="icon-sm" />
            {tags.length > 0 && <span className="text-xs">{tags.length}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-3" align="start">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={cn('gap-1 pr-1', getTagColor(tag))}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="icon-sm" />
                  </button>
                </Badge>
              ))}
            </div>

            <Input
              placeholder="Add tag..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8"
            />

            {filteredSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filteredSuggestions.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border',
                      'hover:bg-accent transition-colors'
                    )}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className={cn('gap-1 pr-1', getTagColor(tag))}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
            >
              <X className="icon-sm" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a tag..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputValue.trim() && addTag(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus className="icon-sm" />
        </Button>
      </div>

      {filteredSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-1">
            {filteredSuggestions.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className={cn(
                  'text-xs px-2 py-1 rounded-full border',
                  'hover:bg-accent transition-colors'
                )}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NodeFilterBarProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NodeFilterBar({
  availableTags,
  selectedTags,
  onTagsChange,
  searchQuery,
  onSearchChange,
}: NodeFilterBarProps) {
  const toggleTag = useCallback((tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }, [selectedTags, onTagsChange]);

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-card/95 backdrop-blur border-b">
      <Input
        placeholder="Search nodes..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
      />

      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filter:</span>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                'text-xs px-2 py-1 rounded-full border whitespace-nowrap transition-all',
                selectedTags.includes(tag)
                  ? cn(getTagColor(tag), 'ring-2 ring-primary ring-offset-1')
                  : 'hover:bg-accent'
              )}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTagsChange([])}
              className="text-xs h-6"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
