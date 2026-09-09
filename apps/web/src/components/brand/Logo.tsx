'use client';

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
 * CoFounderBay icon mark.
 *
 * Concept: A rounded-square badge. Inside: two founder nodes (circles) at
 * the top-left and top-right, connected by a sweeping bay arc that meets at
 * the bottom centre — like two ships entering a harbor together. The shape
 * reads as "C" (connect/collaborate) and the arc echoes a harbor bay.
 * Clean, scalable from 16 px to 512 px.
 */
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  const gId = `cfb-g-${size}`;
  const gId2 = `cfb-g2-${size}`;
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
        {/* Badge gradient — indigo → violet */}
        <linearGradient id={gId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        {/* Inner glow for nodes */}
        <radialGradient id={gId2} cx="50%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Badge background */}
      <rect width="32" height="32" rx="8" fill={`url(#${gId})`} />

      {/* Subtle inner highlight */}
      <rect width="32" height="32" rx="8" fill={`url(#${gId2})`} />

      {/* Bay arc — founders meeting at the harbour */}
      <path
        d="M8.5 11 C8.5 20.5 16 24 16 24 C16 24 23.5 20.5 23.5 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Left founder node */}
      <circle cx="8.5" cy="10.5" r="3" fill="white" opacity="0.95" />

      {/* Right founder node */}
      <circle cx="23.5" cy="10.5" r="3" fill="white" opacity="0.95" />

      {/* Centre anchor dot — the Bay meeting point */}
      <circle cx="16" cy="24" r="1.8" fill="white" opacity="0.85" />
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
    return <LogoIcon size={config.icon} className={cn(iconClassName, className)} />;
  }

  const wordmark = (
    <span
      className={cn(
        'font-semibold select-none',
        config.text,
        config.tracking,
        inverted ? 'text-white' : 'text-foreground',
        textClassName,
      )}
    >
      <span className={inverted ? 'text-white/90' : 'text-primary-emphasis'}>Co</span>
      <span className={inverted ? 'text-white' : 'text-foreground'}>Founder</span>
      <span className={inverted ? 'text-white/90' : 'text-primary-emphasis'}>Bay</span>
    </span>
  );

  if (variant === 'wordmark') return wordmark;

  return (
    <div className={cn('inline-flex items-center', config.gap, className)}>
      <LogoIcon size={config.icon} className={iconClassName} />
      {wordmark}
    </div>
  );
}
