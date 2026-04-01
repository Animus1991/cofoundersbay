'use client';

import { useState, useCallback, useRef } from 'react';
import { Sparkles, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { sendAIChat, getAgentIcon } from '@/lib/ai-api';

// Module-level cache shared with useAIInsight (max 50 entries, cleared on page reload)
const insightCache = new Map<string, string>();
const MAX_CACHE = 50;
function cacheSet(key: string, value: string) {
  if (insightCache.size >= MAX_CACHE) {
    const first = insightCache.keys().next().value;
    if (first !== undefined) insightCache.delete(first);
  }
  insightCache.set(key, value);
}

interface AIInsightButtonProps {
  prompt: string;
  agentId?: string;
  /** Stable key for in-session caching. Defaults to `${agentId}:${prompt}`. */
  cacheKey?: string;
  context?: Record<string, unknown>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'lg' | 'icon';
  label?: string;
}

export function AIInsightButton({
  prompt,
  agentId = 'general',
  cacheKey,
  context,
  className,
  variant = 'outline',
  size = 'sm',
  label = 'AI Insight',
}: AIInsightButtonProps) {
  const resolvedKey = cacheKey ?? `${agentId}:${prompt}`;
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(() => insightCache.get(resolvedKey) ?? null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef(resolvedKey);
  keyRef.current = resolvedKey;

  const fetchInsight = useCallback(async () => {
    const key = keyRef.current;
    const cached = insightCache.get(key);
    if (cached) {
      setResponse(cached);
      setIsExpanded((prev) => !prev);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await sendAIChat({
        message: prompt,
        agentId,
        context,
      });
      cacheSet(key, result.message);
      setResponse(result.message);
      setIsExpanded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get AI insight');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, agentId, context]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setIsExpanded(false);
  }, []);

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={fetchInsight}
          disabled={isLoading}
          className={cn(
            'flex items-center justify-center rounded-full p-1.5 transition-colors',
            'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30',
            isLoading && 'opacity-50 cursor-wait',
            className
          )}
          title={label}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </button>

        {response && isExpanded && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <span>{getAgentIcon(agentId)}</span>
                AI Insight
              </span>
              <button onClick={clearResponse} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="p-3 text-sm max-h-48 overflow-y-auto">
              {response.split('**').map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={fetchInsight}
        disabled={isLoading}
        className={cn(
          'gap-1.5',
          response && 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        )}
        {label}
        {response && (
          isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Button>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {response && isExpanded && (
        <div className="relative bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={clearResponse}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-2">
            <span className="text-lg">{getAgentIcon(agentId)}</span>
            <div className="flex-1 text-sm leading-relaxed pr-4">
              {response.split('**').map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
