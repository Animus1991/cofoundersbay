'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

interface AIInsightButtonProps {
  prompt: string;
  agentId?: string;
  cacheKey?: string;
  context?: Record<string, unknown>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'lg' | 'icon';
  label?: string;
}

export function AIInsightButton({
  prompt,
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Ask AI',
}: AIInsightButtonProps) {
  const router = useSafeRouter();

  const openAssistant = () => {
    const params = new URLSearchParams({ q: prompt });
    const url = `/ai?${params.toString()}`;
    if (router) {
      router.push(url);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openAssistant}
        className={cn(
          'flex items-center justify-center rounded-full p-1.5 transition-colors',
          'text-status-accent hover:bg-status-accent-bg',
          className,
        )}
        title={label}
        aria-label={label}
      >
        <Sparkles className="icon-sm" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={openAssistant}
      className={cn('gap-1.5', className)}
    >
      <Sparkles className="icon-sm text-status-accent" />
      {label}
    </Button>
  );
}
