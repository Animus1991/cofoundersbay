'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/common/I18nProvider';

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
  const router = useRouter();
  const { t } = useI18n();
  const displayLabel = t(label);

  const openAssistant = () => {
    router.push(`/ai?q=${encodeURIComponent(prompt)}`);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openAssistant}
        className={cn(
          'flex items-center justify-center rounded-full p-1.5 transition-colors',
          'text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30',
          className,
        )}
        title={displayLabel}
      >
        <Sparkles className="h-4 w-4" />
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
      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
      {displayLabel}
    </Button>
  );
}
