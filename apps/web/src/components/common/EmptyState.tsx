'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IllustrationType = 'search' | 'connection' | 'message' | 'rocket' | 'profile' | 'calendar' | 'default';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  illustration?: IllustrationType;
  size?: 'sm' | 'md' | 'lg';
  /** Secondary Ask AI action — never replaces the primary `action`. */
  askAiPrompt?: string;
};

// SVG Illustrations for different empty states
function EmptyIllustration({ type, className }: { type: IllustrationType; className?: string }) {
  const baseClass = cn('mx-auto text-primary/60', className);

  switch (type) {
    case 'search':
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="4" className="opacity-40" />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-spin-slow opacity-30" />
          <line x1="72" y1="72" x2="95" y2="95" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-60" />
          <circle cx="50" cy="50" r="6" fill="currentColor" className="animate-pulse-glow opacity-50" />
          <circle cx="85" cy="25" r="4" fill="currentColor" className="animate-float opacity-30" />
          <circle cx="25" cy="80" r="3" fill="currentColor" className="animate-float opacity-20" style={{ animationDelay: '1s' }} />
        </svg>
      );

    case 'connection':
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="30" cy="60" r="18" stroke="currentColor" strokeWidth="3" className="opacity-50" />
          <circle cx="90" cy="60" r="18" stroke="currentColor" strokeWidth="3" className="opacity-50" />
          <path d="M48 60 L72 60" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" className="animate-pulse opacity-40" />
          <circle cx="30" cy="60" r="8" fill="currentColor" className="opacity-30" />
          <circle cx="90" cy="60" r="8" fill="currentColor" className="opacity-30" />
          <circle cx="60" cy="30" r="12" stroke="currentColor" strokeWidth="2" className="opacity-30 animate-float" />
          <circle cx="60" cy="90" r="10" stroke="currentColor" strokeWidth="2" className="opacity-20 animate-float" style={{ animationDelay: '0.5s' }} />
          <path d="M36 48 L54 36" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="opacity-20" />
          <path d="M84 48 L66 36" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="opacity-20" />
        </svg>
      );

    case 'message':
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="20" y="30" width="80" height="50" rx="8" stroke="currentColor" strokeWidth="3" className="opacity-50" />
          <path d="M20 42 L60 65 L100 42" stroke="currentColor" strokeWidth="3" className="opacity-30" />
          <circle cx="45" cy="55" r="4" fill="currentColor" className="animate-bounce-subtle opacity-40" />
          <circle cx="60" cy="55" r="4" fill="currentColor" className="animate-bounce-subtle opacity-40" style={{ animationDelay: '0.2s' }} />
          <circle cx="75" cy="55" r="4" fill="currentColor" className="animate-bounce-subtle opacity-40" style={{ animationDelay: '0.4s' }} />
          <path d="M50 80 L60 95 L70 80" stroke="currentColor" strokeWidth="2" className="opacity-30" />
        </svg>
      );

    case 'rocket':
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <g className="animate-float">
            <path d="M60 20 L75 50 L60 45 L45 50 Z" fill="currentColor" className="opacity-40" />
            <rect x="52" y="45" width="16" height="30" rx="4" fill="currentColor" className="opacity-50" />
            <path d="M48 75 L52 75 L52 90 L48 85 Z" fill="currentColor" className="opacity-30" />
            <path d="M72 75 L68 75 L68 90 L72 85 Z" fill="currentColor" className="opacity-30" />
            <ellipse cx="60" cy="55" rx="4" ry="5" fill="currentColor" className="opacity-70" />
          </g>
          <circle cx="30" cy="80" r="6" fill="currentColor" className="opacity-20 animate-pulse-glow" />
          <circle cx="90" cy="70" r="4" fill="currentColor" className="opacity-15 animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
          <circle cx="85" cy="40" r="3" fill="currentColor" className="opacity-10 animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <path d="M55 95 L60 105 L65 95" stroke="currentColor" strokeWidth="2" className="opacity-20 animate-pulse" />
        </svg>
      );

    case 'profile':
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="45" r="20" stroke="currentColor" strokeWidth="3" className="opacity-50" />
          <circle cx="60" cy="45" r="12" fill="currentColor" className="opacity-20" />
          <path d="M30 95 C30 75 45 65 60 65 C75 65 90 75 90 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-40" />
          <circle cx="85" cy="35" r="8" stroke="currentColor" strokeWidth="2" className="opacity-30 animate-pulse-glow" />
          <circle cx="35" cy="75" r="6" stroke="currentColor" strokeWidth="2" className="opacity-20 animate-float" />
          <path d="M78 35 L92 35" stroke="currentColor" strokeWidth="2" className="opacity-30" />
          <path d="M85 28 L85 42" stroke="currentColor" strokeWidth="2" className="opacity-30" />
        </svg>
      );

    case 'calendar':
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="20" y="30" width="80" height="70" rx="8" stroke="currentColor" strokeWidth="3" className="opacity-50" />
          <line x1="20" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="3" className="opacity-40" />
          <line x1="40" y1="30" x2="40" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-40" />
          <line x1="80" y1="30" x2="80" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-40" />
          <circle cx="45" cy="68" r="6" fill="currentColor" className="opacity-30" />
          <circle cx="60" cy="68" r="6" fill="currentColor" className="opacity-30" />
          <circle cx="75" cy="68" r="6" fill="currentColor" className="opacity-30" />
          <circle cx="45" cy="85" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" className="opacity-20 animate-pulse" />
          <circle cx="60" cy="85" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" className="opacity-20 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </svg>
      );

    default:
      return (
        <svg className={baseClass} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="35" stroke="currentColor" strokeWidth="3" strokeDasharray="8 4" className="opacity-40 animate-spin-slow" />
          <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="2" className="opacity-30" />
          <circle cx="60" cy="60" r="8" fill="currentColor" className="opacity-40 animate-pulse-glow" />
          <circle cx="30" cy="30" r="5" fill="currentColor" className="opacity-20 animate-float" />
          <circle cx="90" cy="40" r="4" fill="currentColor" className="opacity-15 animate-float" style={{ animationDelay: '0.5s' }} />
          <circle cx="85" cy="85" r="6" fill="currentColor" className="opacity-20 animate-float" style={{ animationDelay: '1s' }} />
        </svg>
      );
  }
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  className,
  illustration = 'default',
  size = 'md',
  askAiPrompt,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const illustrationSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-center shadow-sm animate-fade-in',
        sizeClasses[size],
        className,
      )}
    >
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-12 left-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-accent/30 blur-2xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative space-y-4">
        {/* SVG Illustration */}
        <div className={cn('animate-fade-in-up', illustrationSizes[size])}>
          <EmptyIllustration type={illustration} className={illustrationSizes[size]} />
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <p className="text-base font-semibold animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {title}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {description}
            </p>
          )}
        </div>

        {(action || askAiPrompt) && (
          <div
            className="flex flex-wrap items-center justify-center gap-2 pt-2 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            {action}
            {askAiPrompt && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/ai?q=${encodeURIComponent(askAiPrompt)}`}>
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  Ask AI
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
