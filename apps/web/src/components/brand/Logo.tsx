'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  /** Use white text/icon (for dark/colored backgrounds) */
  inverted?: boolean;
}

const SIZE_MAP = {
  xs: { icon: 22,  text: 'text-sm',  gap: 'gap-1.5', tracking: 'tracking-tight' },
  sm: { icon: 28,  text: 'text-base', gap: 'gap-2',   tracking: 'tracking-tight' },
  md: { icon: 34,  text: 'text-xl',  gap: 'gap-2.5', tracking: 'tracking-tight' },
  lg: { icon: 42,  text: 'text-2xl', gap: 'gap-3',   tracking: 'tracking-tight' },
  xl: { icon: 54,  text: 'text-3xl', gap: 'gap-3.5', tracking: 'tracking-tighter' },
};

/**
 * CoFounderBay brand icon.
 *
 * Concept: Two overlapping circles (Venn diagram) — the moment two co-founders
 * unite. Their intersection glows, symbolising the shared vision and the
 * platform's role as the meeting point. Housed in a softly-rounded badge with
 * a deep indigo → violet gradient.
 */
export function LogoIcon({ size = 34, className }: { size?: number; className?: string }) {
  // All values derived from `size` so the icon is pixel-perfect at any scale.
  const s      = size;
  const cx     = s / 2;          // horizontal centre
  const cy     = s / 2;          // vertical centre
  const rx     = s * 0.225;      // Venn circle radius
  const offset = s * 0.115;      // half-distance between the two circle centres
  const lCx    = cx - offset;    // left circle centre x
  const rCx    = cx + offset;    // right circle centre x
  const vCy    = cy + s * 0.03;  // slightly below centre for optical balance

  // The intersection lens path (two circular arcs forming the overlap region)
  // Using the formula for circle–circle intersection arc endpoints.
  const d = offset * 2;          // distance between centres
  const r = rx;
  // Intersection y-offset from the line joining the two centres
  const h = Math.sqrt(r * r - (d / 2) * (d / 2));
  const iy1 = vCy - h;           // top intersection point y
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main bay/harbor shape - curved base representing the 'Bay' */}
      <path
        d="M4 16 Q12 20 20 16 L20 18 Q12 22 4 18 Z"
        className="fill-primary opacity-90"
      />
      
      {/* Two co-founder figures - simplified human shapes */}
      <circle cx="9" cy="11" r="2.5" className="fill-primary opacity-80" />
      <path d="M9 14 Q9 16 7 17 L11 17 Q9 16 9 14" className="fill-primary opacity-80" />
      
      <circle cx="15" cy="11" r="2.5" className="fill-primary opacity-70" />
      <path d="M15 14 Q15 16 13 17 L17 17 Q15 16 15 14" className="fill-primary opacity-70" />
      
      {/* Connection bridge between them */}
      <rect x="11" y="13" width="2" height="3" className="fill-background" rx="0.5" />
      
      {/* Growth arrow pointing upward */}
      <path d="M12 6 L12 10 M10 8 L12 6 L14 8" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-60" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
  const textColor = inverted ? 'text-white' : 'text-foreground';
  const iconColor = inverted ? 'text-white' : 'text-primary';

  if (variant === 'icon') {
    return <LogoIcon size={config.icon} className={cn(iconColor, iconClassName, className)} />;
  }

  const wordmark = (
    <div className={cn('font-display font-semibold', config.tracking, config.text, textColor, textClassName)}>
      <span className={cn('bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent', inverted && 'text-white')}>
        Co
      </span>
      <span className={cn('mx-0.5', inverted && 'text-white')}>Founder</span>
      <span className={cn('bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent', inverted && 'text-white')}>
        Bay
      </span>
    </div>
  );

  if (variant === 'wordmark') {
    return wordmark;
  }

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <LogoIcon size={config.icon} className={cn(iconColor, iconClassName)} />
      {wordmark}
    </div>
  );
}
