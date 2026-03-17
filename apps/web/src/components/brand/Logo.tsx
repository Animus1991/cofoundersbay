'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  /** Use white text (for dark backgrounds) */
  inverted?: boolean;
}

const SIZE_MAP = {
  xs: { icon: 20, text: 'text-sm', gap: 'gap-1.5' },
  sm: { icon: 26, text: 'text-base', gap: 'gap-2' },
  md: { icon: 32, text: 'text-xl', gap: 'gap-2.5' },
  lg: { icon: 40, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 52, text: 'text-3xl', gap: 'gap-3.5' },
};

/** CoFounderBay brand icon — two nodes joined by a bridge arc, inside a rounded square */
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  const r = size / 2;
  // Proportional values based on size
  const pad = size * 0.175;
  const nodeR = size * 0.1;
  const bridgeY = r;
  const leftX = pad + nodeR;
  const rightX = size - pad - nodeR;
  const arcRx = (rightX - leftX) / 2;
  const arcRy = size * 0.18;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="CoFounderBay logo icon"
      role="img"
    >
      {/* Background rounded square */}
      <rect
        x="0"
        y="0"
        width={size}
        height={size}
        rx={size * 0.22}
        fill="url(#cfb-bg)"
      />

      {/* Left node */}
      <circle cx={leftX} cy={bridgeY} r={nodeR} fill="white" opacity="0.95" />

      {/* Right node */}
      <circle cx={rightX} cy={bridgeY} r={nodeR} fill="white" opacity="0.95" />

      {/* Bridge line */}
      <line
        x1={leftX + nodeR}
        y1={bridgeY}
        x2={rightX - nodeR}
        y2={bridgeY}
        stroke="white"
        strokeWidth={size * 0.055}
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Arc above — the "bay" arc */}
      <path
        d={`M ${leftX} ${bridgeY} A ${arcRx} ${arcRy} 0 0 1 ${rightX} ${bridgeY}`}
        stroke="white"
        strokeWidth={size * 0.07}
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Center sparkle dot */}
      <circle
        cx={r}
        cy={bridgeY - arcRy * 0.85}
        r={nodeR * 0.6}
        fill="white"
        opacity="0.8"
      />

      {/* Gradient def */}
      <defs>
        <linearGradient id="cfb-bg" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(235, 76%, 50%)" />
          <stop offset="100%" stopColor="hsl(256, 74%, 60%)" />
        </linearGradient>
      </defs>
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
  const { icon, text, gap } = SIZE_MAP[size];

  if (variant === 'icon') {
    return <LogoIcon size={icon} className={cn(iconClassName, className)} />;
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={cn(
          'font-display font-bold tracking-tight select-none',
          text,
          inverted ? 'text-white' : 'text-foreground',
          className,
        )}
      >
        CoFounder<span className="text-primary">Bay</span>
      </span>
    );
  }

  return (
    <div className={cn('flex items-center', gap, className)}>
      <LogoIcon size={icon} className={iconClassName} />
      <span
        className={cn(
          'font-display font-bold tracking-tight select-none leading-none',
          text,
          inverted ? 'text-white' : 'text-foreground',
          textClassName,
        )}
      >
        CoFounder<span className="text-primary">Bay</span>
      </span>
    </div>
  );
}
