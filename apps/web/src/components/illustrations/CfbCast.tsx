import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CfbFigureId = 'founder' | 'mentor' | 'investor' | 'builder';

/* The platform's own cast, in the CfbGlyph idiom: a round head, a simple
   torso, two dot eyes, and one thing that says who they are — a spark for
   the founder, a compass for the mentor, a seedling for the investor, a
   bridge piece for the builder. Exactly one `data-accent` element each;
   decorative only. */
const HEAD_AND_BODY: ReactNode = (
  <>
    <circle cx="48" cy="30" r="15" />
    <path d="M30 108V76c0-12 8-19 18-19s18 7 18 19v32" />
    <circle cx="43" cy="28" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="53" cy="28" r="1.3" fill="currentColor" stroke="none" />
  </>
);

const FIGURES: Record<CfbFigureId, ReactNode> = {
  founder: (
    <>
      {HEAD_AND_BODY}
      {/* A small eight-ray spark held at the side. */}
      <path
        d="M74 46v12M68 52h12M69.8 47.8l8.4 8.4M78.2 47.8l-8.4 8.4"
        data-accent=""
      />
    </>
  ),
  mentor: (
    <>
      {HEAD_AND_BODY}
      <circle cx="72" cy="52" r="9" />
      {/* The compass needle — one stroke pointing the way. */}
      <path d="M69 55l5-9 1.5 5.5z" data-accent="" />
    </>
  ),
  investor: (
    <>
      {HEAD_AND_BODY}
      {/* A seedling: two leaves on one stem. */}
      <path
        d="M72 62V46m0 6c0-5-4-8-9-8 0 5 4 8 9 8zm0-2c0-5 4-8 9-8 0 5-4 8-9 8z"
        data-accent=""
      />
    </>
  ),
  builder: (
    <>
      {HEAD_AND_BODY}
      {/* A bridge piece: deck and one arch. */}
      <path
        d="M60 60h26M64 60v-5a8 8 0 0 1 16 0v5"
        data-accent=""
      />
    </>
  ),
};

export function CfbFigure({
  id,
  className,
}: {
  id: CfbFigureId;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-cfb-figure={id}
      className={cn('cfb-glyph h-24 w-20 sm:h-32 sm:w-28', className)}
    >
      {FIGURES[id]}
    </svg>
  );
}

export function CfbCast({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex flex-wrap items-end justify-center gap-1 text-muted-foreground', className)}
    >
      {/* One soft ground under the four — the same 6% tint the empty-state
          marks stand on. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-2 bottom-0 h-8 rounded-[100%] bg-current opacity-[0.06]"
      />
      {(['founder', 'mentor', 'investor', 'builder'] as const).map((id) => (
        <CfbFigure key={id} id={id} className="relative h-32 w-auto sm:h-44" />
      ))}
    </span>
  );
}
