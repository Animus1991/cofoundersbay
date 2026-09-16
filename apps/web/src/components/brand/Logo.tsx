'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  inverted?: boolean;
}

const SIZE_MAP = {
  xs: { icon: 22, text: 'text-sm',   gap: 'gap-1.5', tracking: 'tracking-tight' },
  sm: { icon: 28, text: 'text-base', gap: 'gap-2',   tracking: 'tracking-tight' },
  md: { icon: 32, text: 'text-lg',   gap: 'gap-2.5', tracking: 'tracking-tight' },
  lg: { icon: 40, text: 'text-2xl',  gap: 'gap-3',   tracking: 'tracking-tight' },
  xl: { icon: 52, text: 'text-3xl',  gap: 'gap-3.5', tracking: 'tracking-tighter' },
};

/**
 * CoFounderBay mark — "two founders, one bay".
 *
 * Two nodes (the co-founders) sit on the rim of a bay; a single continuous
 * stroke sweeps down from each and meets at the anchor point at the bottom.
 * Read literally it is a harbour; read abstractly it is a "C" (co-, connect)
 * and a "U" (unite). The same geometry is used for the favicon / PWA icon in
 * public/icons/icon.svg so the brand is one shape everywhere.
 *
 * Colour comes from the theme (`--primary`), so the mark follows the five
 * built-in themes and any tenant's white-label primary instead of being
 * frozen to an indigo→violet gradient. Depth is a single-hue tint, not a
 * second hue — quieter, and it never clashes with a tenant palette.
 *
 * `mono` renders in currentColor for use on photos / coloured surfaces.
 * Legible from 16 px (stroke = 2/32 of the box → 1 px at 16 px).
 */
export function LogoIcon({
  size = 32,
  className,
  mono = false,
}: { size?: number; className?: string; mono?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `cfb-badge-${uid}`;
  const sheenId = `cfb-sheen-${uid}`;

  if (mono) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <path d="M8.5 11.5 C8.5 20 13.5 23.5 16 24.5 C18.5 23.5 23.5 20 23.5 11.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="8.5" cy="10.5" r="3.1" fill="currentColor" />
        <circle cx="23.5" cy="10.5" r="3.1" fill="currentColor" />
        <circle cx="16" cy="24.5" r="1.9" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Single-hue depth: primary → slightly deeper primary. */}
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.82 }} />
        </linearGradient>
        <radialGradient id={sheenId} cx="50%" cy="22%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Badge: rx 9/32 matches the product radius scale (xl ≈ 14/48). */}
      <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
      <rect width="32" height="32" rx="9" fill={`url(#${sheenId})`} />

      {/* Bay — one continuous stroke from founder to founder via the anchor. */}
      <path
        d="M8.5 11.5 C8.5 20 13.5 23.5 16 24.5 C18.5 23.5 23.5 20 23.5 11.5"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />

      {/* Founder nodes */}
      <circle cx="8.5" cy="10.5" r="3.1" fill="hsl(var(--primary-foreground))" />
      <circle cx="23.5" cy="10.5" r="3.1" fill="hsl(var(--primary-foreground))" />

      {/* Anchor — where they meet */}
      <circle cx="16" cy="24.5" r="1.9" fill="hsl(var(--primary-foreground))" opacity="0.9" />
    </svg>
  );
}

/** Full CoFounderBay brand mark — icon + wordmark */
export function Logo({
  size = 'md',
  variant = 'full',
  className,
  iconClassName,
  textClassName,
  inverted = false,
}: LogoProps) {
  const config = SIZE_MAP[size];

  if (variant === 'icon') {
    return <LogoIcon size={config.icon} mono={inverted} className={cn(iconClassName, className)} />;
  }

  /* Two-tone wordmark: "CoFounder" in the text colour, "Bay" in the brand
     colour. The previous three-way split (Co / Founder / Bay) alternated
     colours mid-word, which read as decoration rather than a name. */
  const wordmark = (
    <span
      className={cn(
        'font-display font-semibold select-none',
        config.text,
        config.tracking,
        inverted ? 'text-white' : 'text-foreground',
        textClassName,
      )}
    >
      CoFounder
      <span className={inverted ? 'text-white/80' : 'text-primary-accessible'}>Bay</span>
    </span>
  );

  if (variant === 'wordmark') return wordmark;

  return (
    <div className={cn('inline-flex items-center', config.gap, className)}>
      <LogoIcon size={config.icon} mono={inverted} className={iconClassName} />
      {wordmark}
    </div>
  );
}
