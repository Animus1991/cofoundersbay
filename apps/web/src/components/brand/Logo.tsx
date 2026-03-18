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
  const iy2 = vCy + h;           // bottom intersection point y
  const ix  = cx;                // intersection points share the same x (midpoint)

  const lensPath = [
    `M ${ix} ${iy1}`,
    `A ${r} ${r} 0 0 1 ${ix} ${iy2}`,   // arc on the right circle (going clockwise)
    `A ${r} ${r} 0 0 1 ${ix} ${iy1}`,   // arc on the left circle  (going clockwise)
    'Z',
  ].join(' ');

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-label="CoFounderBay"
      role="img"
    >
      <defs>
        {/* Badge gradient — indigo to violet */}
        <linearGradient id={`cfb-badge-${s}`} x1="0" y1="0" x2={s} y2={s} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4338CA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        {/* Lens (intersection) highlight gradient */}
        <linearGradient id={`cfb-lens-${s}`} x1={lCx} y1={iy1} x2={rCx} y2={iy2} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#E0E7FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1"   />
        </linearGradient>
        <clipPath id={`cfb-clip-${s}`}>
          <rect x="0" y="0" width={s} height={s} rx={s * 0.24} />
        </clipPath>
      </defs>

      {/* Badge background */}
      <rect x="0" y="0" width={s} height={s} rx={s * 0.24} fill={`url(#cfb-badge-${s})`} />

      {/* Subtle inner highlight at top — depth */}
      <ellipse cx={s * 0.5} cy={s * 0.18} rx={s * 0.32} ry={s * 0.1} fill="white" opacity="0.08" />

      {/* Left circle (co-founder A) */}
      <circle cx={lCx} cy={vCy} r={rx} fill="white" opacity="0.22" />
      <circle cx={lCx} cy={vCy} r={rx} stroke="white" strokeWidth={s * 0.04} strokeOpacity="0.55" />

      {/* Right circle (co-founder B) */}
      <circle cx={rCx} cy={vCy} r={rx} fill="white" opacity="0.22" />
      <circle cx={rCx} cy={vCy} r={rx} stroke="white" strokeWidth={s * 0.04} strokeOpacity="0.55" />

      {/* Intersection lens — glows brightest */}
      <path d={lensPath} fill={`url(#cfb-lens-${s})`} opacity="0.92" />

      {/* Tiny sparkle dot at top of lens */}
      <circle cx={ix} cy={iy1 - s * 0.025} r={s * 0.038} fill="white" opacity="0.9" />
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
  const { icon, text, gap, tracking } = SIZE_MAP[size];

  if (variant === 'icon') {
    return <LogoIcon size={icon} className={cn(iconClassName, className)} />;
  }

  const wordmark = (
    <span
      className={cn(
        'font-display font-bold select-none leading-none',
        text,
        tracking,
        inverted ? 'text-white' : 'text-foreground',
        textClassName,
      )}
    >
      Co<span className={inverted ? 'text-white/80' : 'text-muted-foreground'}>Founder</span>
      <span className="text-primary font-extrabold">Bay</span>
    </span>
  );

  if (variant === 'wordmark') {
    return <span className={className}>{wordmark}</span>;
  }

  return (
    <div className={cn('flex items-center', gap, className)}>
      <LogoIcon size={icon} className={iconClassName} />
      {wordmark}
    </div>
  );
}
