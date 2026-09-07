import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CoFounderBay glyph family — the same geometry as the brand mark
 * ("two founders, one bay"): paired nodes, a single meeting stroke, quiet
 * rounded squares. Distinct from Lucide so the product is recognisable at a
 * glance, without decorative kitsch.
 */
export const CFB_GLYPH_NAMES = [
  'home',
  'builder',
  'research',
  'flag',
  'calendar',
  'messages',
  'matches',
  'discover',
  'people',
  'mentor',
  'chart',
  'target',
  'community',
  'award',
  'bookmark',
  'briefcase',
  'book',
  'shield',
  'bell',
  'sliders',
  'spark',
  'wallet',
  'building',
  'profile',
  'compare',
  'applications',
  'more',
  'default',
] as const;

export type CfbGlyphName = (typeof CFB_GLYPH_NAMES)[number];

const PATH_GLYPH: Record<string, CfbGlyphName> = {
  '/settings/ai': 'spark',
  '/matches/compare': 'compare',
  '/builder/applications': 'applications',
  '/builder/pitch-deck': 'builder',
};

const SEGMENT_GLYPH: Record<string, CfbGlyphName> = {
  dashboard: 'home',
  readiness: 'chart',
  analytics: 'chart',
  builder: 'builder',
  research: 'research',
  milestones: 'flag',
  projects: 'briefcase',
  fundraising: 'wallet',
  calendar: 'calendar',
  messages: 'messages',
  matches: 'matches',
  recommendations: 'spark',
  discover: 'discover',
  search: 'discover',
  members: 'people',
  mentoring: 'mentor',
  investors: 'chart',
  opportunities: 'target',
  groups: 'community',
  events: 'calendar',
  programs: 'award',
  invite: 'people',
  connections: 'people',
  shortlist: 'bookmark',
  endorsements: 'award',
  compare: 'compare',
  learning: 'book',
  marketplace: 'briefcase',
  jobs: 'briefcase',
  coaching: 'mentor',
  'expert-reviews': 'award',
  help: 'book',
  activity: 'spark',
  achievements: 'award',
  feed: 'spark',
  profile: 'profile',
  notifications: 'bell',
  settings: 'sliders',
  referrals: 'people',
  reputation: 'shield',
  mentor: 'mentor',
  investor: 'chart',
  provider: 'briefcase',
  org: 'building',
  admin: 'shield',
  tenant: 'building',
  billing: 'wallet',
  onboarding: 'spark',
  login: 'profile',
  register: 'people',
};

export function glyphForHref(href: string): CfbGlyphName {
  const path = (href.split('?')[0] || '/').replace(/\/+$/, '') || '/';
  if (PATH_GLYPH[path]) return PATH_GLYPH[path];
  const prefixes = Object.keys(PATH_GLYPH).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (path.startsWith(`${prefix}/`)) return PATH_GLYPH[prefix];
  }
  const segment = path.split('/').filter(Boolean)[0];
  if (segment && SEGMENT_GLYPH[segment]) return SEGMENT_GLYPH[segment];
  return 'default';
}

export function glyphForMode(mode: string): CfbGlyphName {
  if (mode === 'work') return 'builder';
  if (mode === 'explore') return 'discover';
  if (mode === 'account') return 'sliders';
  return 'default';
}

function GlyphFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const GLYPHS: Record<CfbGlyphName, ReactNode> = {
  home: (
    <>
      <rect x="3.5" y="3.5" width="7.25" height="7.25" rx="2" />
      <rect x="13.25" y="3.5" width="7.25" height="7.25" rx="2" />
      <rect x="3.5" y="13.25" width="7.25" height="7.25" rx="2" />
      <path d="M14.2 16.2c0 2.6 1.9 4.1 2.9 4.5 1-.4 2.9-1.9 2.9-4.5" />
      <circle cx="14.6" cy="15.5" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="19.4" cy="15.5" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  builder: (
    <>
      <path d="M5 18.5V11.5h4V18.5M10.5 18.5V8h4v10.5M16 18.5V5.5h3.5V18.5" />
      <path d="M4.5 18.5h15" />
      <circle cx="7" cy="9.5" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="6" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  research: (
    <>
      <rect x="4" y="5.5" width="11" height="13" rx="2.2" />
      <rect x="9" y="4" width="11" height="13" rx="2.2" />
      <path d="M12 9.5h5M12 13h3.5" />
    </>
  ),
  flag: (
    <>
      <path d="M7 20V5.5" />
      <path d="M7 6.2h8.5c.9 0 1.4.9.9 1.6L15 10.4c-.3.4-.3 1 0 1.4l1.4 2.4c.5.8 0 1.7-.9 1.7H7" />
      <circle cx="7" cy="5.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
      <path d="M4 10h16M8.5 4v3M15.5 4v3" />
      <circle cx="9" cy="14" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  messages: (
    <>
      <path d="M5.5 6.2h13A2.3 2.3 0 0 1 20.8 8.5v6.2A2.3 2.3 0 0 1 18.5 17H12l-4.2 3v-3H5.5A2.3 2.3 0 0 1 3.2 14.7V8.5A2.3 2.3 0 0 1 5.5 6.2Z" />
      <circle cx="9" cy="11.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11.4" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  matches: (
    <>
      <path d="M6.4 9c0 6 3.8 8.4 5.6 9.1 1.8-.7 5.6-3.1 5.6-9.1" />
      <circle cx="6.4" cy="8.1" r="2.15" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="8.1" r="2.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.2" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  discover: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 6.5c-2.6 1.6-4 3.7-4 5.5s1.4 3.9 4 5.5c2.6-1.6 4-3.7 4-5.5S14.6 8.1 12 6.5Z" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  people: (
    <>
      <circle cx="8" cy="8.2" r="2.4" />
      <circle cx="16" cy="8.2" r="2.4" />
      <path d="M4.4 18c.4-3.2 2.4-5 3.6-5.4M19.6 18c-.4-3.2-2.4-5-3.6-5.4" />
      <path d="M8 12.6c1.8.4 6.2.4 8 0" />
    </>
  ),
  mentor: (
    <>
      <circle cx="12" cy="6.8" r="2.3" />
      <circle cx="6.6" cy="10.2" r="1.9" />
      <circle cx="17.4" cy="10.2" r="1.9" />
      <path d="M12 10.2c-2.8 1-5.2 4.2-5.4 8M12 10.2c2.8 1 5.2 4.2 5.4 8" />
    </>
  ),
  chart: (
    <>
      <path d="M4.5 18.5h15" />
      <path d="M7 18.5V12.5M12 18.5V8.5M17 18.5V5.5" />
      <circle cx="7" cy="11.4" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="17" cy="4.5" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  community: (
    <>
      <circle cx="12" cy="6.6" r="2.15" />
      <circle cx="6.6" cy="15.4" r="2.15" />
      <circle cx="17.4" cy="15.4" r="2.15" />
      <path d="M10.4 8.3 7.8 13.3M13.6 8.3l2.6 5M8.8 15.4h6.4" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9.2 13.4 8 20l4-2.2L16 20l-1.2-6.6" />
      <circle cx="12" cy="9" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  bookmark: (
    <>
      <path d="M7 4.8h10A1.6 1.6 0 0 1 18.6 6.4v13.2L12 16.2l-6.6 3.4V6.4A1.6 1.6 0 0 1 7 4.8Z" />
      <circle cx="12" cy="9.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.2" />
      <path d="M9 8V6.2A1.7 1.7 0 0 1 10.7 4.5h2.6A1.7 1.7 0 0 1 15 6.2V8M3.5 13h17" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.2c-2.4-1.4-6.5-1-8 .6v11.4c1.6-1.4 5.6-1.8 8-.4 2.4-1.4 6.4-1 8 .4V6.8c-1.5-1.6-5.6-2-8-.6Z" />
      <path d="M12 6.4v11.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.6 19.2 6.4v5.8c0 4.4-3 6.9-7.2 8.2C7.8 19.1 4.8 16.6 4.8 12.2V6.4Z" />
      <path d="M9.2 12.1 11.2 14l3.8-4.2" />
    </>
  ),
  bell: (
    <>
      <path d="M7.2 10.2a4.8 4.8 0 0 1 9.6 0c0 4.2 1.4 5.4 1.4 5.4H5.8s1.4-1.2 1.4-5.4" />
      <path d="M10.4 17.8a1.6 1.6 0 0 0 3.2 0" />
      <circle cx="12" cy="5.4" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  sliders: (
    <>
      <path d="M5 8h14M5 16h14" />
      <circle cx="9.5" cy="8" r="2.05" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="16" r="2.05" fill="currentColor" stroke="none" />
    </>
  ),
  spark: (
    <>
      <path d="M6.4 10.2c0 5.4 3.6 7.6 5.6 8.3 2-.7 5.6-2.9 5.6-8.3" />
      <circle cx="6.4" cy="9.3" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="9.3" r="1.7" fill="currentColor" stroke="none" />
      <path d="M12 3.4v3.2M10.2 4.6 12 3.2l1.8 1.4" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.8" y="7" width="16.4" height="11.6" rx="2.2" />
      <path d="M3.8 10.6h16.4" />
      <circle cx="16.2" cy="14.6" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="5.2" width="14" height="14.3" rx="2" />
      <path d="M9 19.5v-4h6v4" />
      <path d="M8.2 9.2h1.6M14.2 9.2h1.6M8.2 13h1.6M14.2 13h1.6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M5.4 19.2c.6-4.2 3.2-6.4 6.6-6.4s6 2.2 6.6 6.4" />
    </>
  ),
  compare: (
    <>
      <rect x="3.5" y="5" width="7.2" height="14" rx="2" />
      <rect x="13.3" y="5" width="7.2" height="14" rx="2" />
      <path d="M6.2 9.2h1.8M16 9.2h1.8M6.2 12.6h1.8M16 12.6h1.8" />
    </>
  ),
  applications: (
    <>
      <rect x="5" y="3.8" width="14" height="16.4" rx="2.2" />
      <path d="M8.2 8.2h7.6M8.2 12h7.6M8.2 15.8h4.6" />
    </>
  ),
  more: (
    <>
      <circle cx="6.2" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="17.8" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </>
  ),
  default: (
    <>
      <path d="M6.4 9c0 6 3.8 8.4 5.6 9.1 1.8-.7 5.6-3.1 5.6-9.1" />
      <circle cx="6.4" cy="8.1" r="2.15" />
      <circle cx="17.6" cy="8.1" r="2.15" />
      <circle cx="12" cy="18.2" r="1.25" />
    </>
  ),
};

export function CfbGlyph({
  name,
  className,
}: {
  name: CfbGlyphName;
  className?: string;
}) {
  return <GlyphFrame className={className}>{GLYPHS[name] ?? GLYPHS.default}</GlyphFrame>;
}

export function NavIcon({
  href,
  name,
  fallback: Fallback,
  className,
}: {
  href?: string;
  name?: CfbGlyphName;
  fallback?: LucideIcon;
  className?: string;
}) {
  const resolved = name ?? (href ? glyphForHref(href) : undefined);
  if (resolved) return <CfbGlyph name={resolved} className={className} />;
  if (Fallback) return <Fallback className={className} aria-hidden="true" />;
  return <CfbGlyph name="default" className={className} />;
}

export function CfbGlyphWell({
  href,
  name,
  size = 'md',
  className,
}: {
  href?: string;
  name?: CfbGlyphName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const resolved = name ?? (href ? glyphForHref(href) : 'default');
  const box = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-xl',
  }[size];
  const icon = { sm: 'icon-sm', md: 'icon-md', lg: 'icon-lg' }[size];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-primary/10 text-primary-accessible',
        box,
        className,
      )}
    >
      <CfbGlyph name={resolved} className={icon} />
    </span>
  );
}
