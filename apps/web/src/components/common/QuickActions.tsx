'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  X,
  Search,
  MessageCircle,
  Edit,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QuickAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  color: string;
};

const defaultActions: QuickAction[] = [
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    href: '/discover',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'post',
    label: 'New Post',
    icon: Edit,
    href: '/feed/new',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'message',
    label: 'Messages',
    icon: MessageCircle,
    href: '/messages',
    color: 'bg-emerald-500 hover:bg-emerald-600',
  },
  {
    id: 'matches',
    label: 'Matches',
    icon: Users,
    href: '/matches',
    color: 'bg-pink-500 hover:bg-pink-600',
  },
  {
    id: 'events',
    label: 'Events',
    icon: Calendar,
    href: '/events',
    color: 'bg-amber-500 hover:bg-amber-600',
  },
];

type QuickActionsProps = {
  actions?: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
};

export function QuickActions({
  actions = defaultActions,
  position = 'bottom-right',
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6',
    'bottom-left': 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 lg:bottom-6 lg:left-6',
    'bottom-center': 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 lg:bottom-6',
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Action buttons */}
      <div
        className={cn(
          'absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          const delay = index * 50;

          const buttonContent = (
            <div
              className="flex items-center gap-2 animate-scale-in"
              style={{ animationDelay: isOpen ? `${delay}ms` : '0ms' }}
            >
              {/* Label */}
              <span className="px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg text-sm font-medium text-foreground whitespace-nowrap">
                {action.label}
              </span>
              {/* Icon button */}
              <button
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110',
                  action.color
                )}
              >
                <Icon className="icon-md" />
              </button>
            </div>
          );

          if (action.href) {
            return (
              <Link key={action.id} href={action.href} onClick={() => setIsOpen(false)}>
                {buttonContent}
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              onClick={() => {
                action.onClick?.();
                setIsOpen(false);
              }}
            >
              {buttonContent}
            </button>
          );
        })}
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          isOpen && 'rotate-45 bg-destructive hover:bg-destructive/90'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="icon-lg" /> : <Plus className="icon-lg" />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Simple floating action button
export function FloatingActionButton({
  icon: Icon = Plus,
  href,
  onClick,
  label,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}) {
  const button = (
    <Button
      size="icon"
      className={cn(
        'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6 h-14 w-14 rounded-full shadow-lg z-50 animate-bounce-subtle',
        className
      )}
      onClick={onClick}
    >
      <Icon className="icon-lg" />
      {label && <span className="sr-only">{label}</span>}
    </Button>
  );

  if (href) {
    return <Link href={href}>{button}</Link>;
  }

  return button;
}
