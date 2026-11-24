import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type IllustrationType =
  | 'search'
  | 'connection'
  | 'message'
  | 'rocket'
  | 'profile'
  | 'calendar'
  | 'default';

/* One quiet mark per empty state, in the CfbGlyph idiom: a soft backdrop
   disc, a 3–6 stroke scene, and exactly one `data-accent` element drawn in
   the brand colour by globals.css. Decorative only — the sentence next to
   it carries the meaning. */
const SCENES: Record<IllustrationType, ReactNode> = {
  search: (
    <>
      <circle cx="44" cy="44" r="18" />
      <path d="M57.5 57.5 68 68" />
      <path d="M68 26v9M63.5 30.5h9" data-accent="" />
    </>
  ),
  connection: (
    <>
      <circle cx="36" cy="48" r="15" />
      <circle cx="60" cy="48" r="15" />
      <path d="M44 48h8" data-accent="" />
    </>
  ),
  message: (
    <>
      <path d="M24 34a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H44l-12 10v-10h-0a8 8 0 0 1-8-8z" />
      <path d="M34 36h24M34 44h14" />
      <path d="M60 20h14v10h-9v6l-5-6z" data-accent="" />
    </>
  ),
  rocket: (
    <>
      <path d="M48 20c9 7 9 26 0 33-9-7-9-26 0-33z" />
      <circle cx="48" cy="36" r="4" />
      <path d="M42.5 46l-7 8M53.5 46l7 8" />
      <path d="M48 56c2.5 3.5 2.5 7.5 0 11-2.5-3.5-2.5-7.5 0-11z" data-accent="" />
    </>
  ),
  profile: (
    <>
      <circle cx="46" cy="38" r="11" />
      <path d="M26 68c3-10 10-15 20-15s17 5 20 15" />
      <circle cx="64" cy="58" r="7" data-accent="" />
      <path d="M60.5 58l2.5 2.5 4.5-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="24" y="28" width="48" height="42" rx="8" />
      <path d="M24 40h48M36 22v10M60 22v10" />
      <circle cx="57" cy="57" r="4.5" fill="currentColor" stroke="none" data-accent="" />
    </>
  ),
  default: (
    <>
      <path d="M22 42h52v20a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z" />
      <path d="M22 42l8-13h16l7 13" />
      <circle cx="48" cy="55" r="4" fill="currentColor" stroke="none" data-accent="" />
    </>
  ),
};

export function EmptyIllustration({
  type,
  className,
}: {
  type: IllustrationType;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-empty-illustration={type}
      className={cn('cfb-glyph h-full w-full', className)}
    >
      <circle cx="48" cy="48" r="40" fill="currentColor" opacity="0.06" stroke="none" />
      {SCENES[type]}
    </svg>
  );
}
