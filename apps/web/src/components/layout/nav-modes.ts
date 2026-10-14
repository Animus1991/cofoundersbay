import {
  type LucideIcon,
  Compass,
  User,
  Settings,
  MessageCircle,
  Calendar,
  GraduationCap,
  Users,
  UserCheck,
  Bell,
  Flag,
  Bookmark,
  Grid3X3,
  LayoutDashboard,
  Rocket,
  Briefcase,
  TrendingUp,
  BookOpen,
  Building2,
  Megaphone,
  Waypoints,
  Radar,
  Target,
  Handshake,
  Award,
  PieChart,
  Shield,
  Sparkles,
  DollarSign,
  Store,
  UserPlus,
  ClipboardList,
  BarChart3,
  FolderKanban,
  Trophy,
  Activity,
  Telescope,
  GitMerge,
  Globe,
  HelpCircle,
  Star,
  Lock,
  LineChart,
  Webhook,
  KeyRound,
  BadgeCheck,
  Wallet,
  ClipboardCheck,
  GanttChart,
  BrainCircuit,
  Presentation,
  CalendarClock,
  SlidersHorizontal,
  Workflow,
  ClipboardSignature,
  FlaskConical,
  Boxes,
  Eye,
  Gauge,
  Layers,
  Lightbulb,
  Home,
  Wrench,
  Search,
  Gift,
  Rss,
  ArrowLeftRight,
  Save,
  Clock,
  Inbox,
  UserPen,
  BellRing,
  Download,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: 'messages' | 'connections' | 'notifications';
};

export type NavSection = {
  section: string;
  links: NavLink[];
  collapsed?: boolean;
};

export type SidebarMode = 'work' | 'explore' | 'account';

export type ModeConfig = {
  id: SidebarMode;
  label: string;
  icon: LucideIcon;
  shortLabel: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Mode Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const sidebarModes: ModeConfig[] = [
  { id: 'work', label: 'Work', icon: Wrench, shortLabel: 'Work' },
  { id: 'explore', label: 'Explore', icon: Compass, shortLabel: 'Explore' },
  { id: 'account', label: 'Account', icon: Settings, shortLabel: 'Account' },
];

// ─────────────────────────────────────────────────────────────────────────────
// WORK MODE — Role-specific tools (no duplicates with Explore)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Founder Work Mode ───────────────────────────────────────────────────────

export const founderWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/dashboard/founder', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Build',
    links: [
      { href: '/commitments', label: 'Commitments', icon: Handshake },
      { href: '/builder', label: 'Startup Builder', icon: Rocket },
      { href: '/fundraising', label: 'Fundraising', icon: DollarSign },
      { href: '/updates', label: 'Updates', icon: Megaphone },
      { href: '/scout', label: 'Co-founder scout', icon: Radar },
    ],
  },
  {
    section: 'Communicate',
    links: [
      { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
    ],
  },
];

// ─── Mentor Work Mode ────────────────────────────────────────────────────────

export const mentorWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/dashboard/mentor', label: 'Overview', icon: LayoutDashboard },
      { href: '/mentor/earnings', label: 'Earnings', icon: Wallet },
    ],
  },
  {
    section: 'Sessions',
    links: [
      { href: '/mentor/sessions', label: 'My Sessions', icon: CalendarClock },
      { href: '/mentor/requests', label: 'Requests', icon: UserPlus },
      { href: '/mentor/mentees', label: 'Mentees', icon: Users },
    ],
  },
  {
    section: 'Communicate',
    links: [
      { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
      { href: '/mentor/availability', label: 'Availability', icon: Clock },
    ],
  },
];

// ─── Investor Work Mode ──────────────────────────────────────────────────────

export const investorWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/dashboard/investor', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Deal Flow',
    links: [
      { href: '/investor/scouting', label: 'Scout Startups', icon: Telescope },
      { href: '/investor/pipeline', label: 'Pipeline', icon: GanttChart },
      { href: '/investor/watchlist', label: 'Watchlist', icon: Eye },
    ],
  },
  {
    section: 'Portfolio',
    links: [
      { href: '/investor/portfolio', label: 'Portfolio', icon: Briefcase },
      { href: '/updates', label: 'Updates', icon: Megaphone },
    ],
  },
  {
    section: 'Communicate',
    links: [
      { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
    ],
  },
];

// ─── Service Provider Work Mode ──────────────────────────────────────────────

export const providerWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/dashboard/provider', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Services',
    links: [
      { href: '/provider/services', label: 'My Services', icon: Store },
      { href: '/provider/inquiries', label: 'Inquiries', icon: Inbox },
      { href: '/provider/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    section: 'Reputation',
    links: [
      { href: '/provider/reviews', label: 'Reviews', icon: Star },
      { href: '/provider/profile', label: 'Provider Profile', icon: BadgeCheck },
    ],
  },
  {
    section: 'Communicate',
    links: [
      { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
    ],
  },
];

// ─── Organization (Incubator/Accelerator) Work Mode ──────────────────────────

export const orgWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/dashboard/incubator', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Programs',
    links: [
      { href: '/org/programs', label: 'Programs', icon: Layers },
      { href: '/org/applications', label: 'Applications', icon: ClipboardList },
      { href: '/org/cohorts', label: 'Cohorts', icon: Users },
    ],
  },
  {
    section: 'Portfolio',
    links: [
      { href: '/org/startups', label: 'Startups', icon: Rocket },
    ],
  },
  {
    section: 'Manage',
    links: [
      { href: '/org/events', label: 'Events', icon: Calendar },
      { href: '/org/members', label: 'Team', icon: UserCheck },
    ],
  },
];

// ─── Platform Admin Work Mode ────────────────────────────────────────────────

export const adminWorkSections: NavSection[] = [
  {
    section: 'Overview',
    links: [
      { href: '/admin/dashboard', label: 'Platform overview', icon: LayoutDashboard },
      { href: '/admin', label: 'Admin console', icon: Shield },
    ],
  },
  {
    section: 'Users & Content',
    links: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/reports', label: 'Reports', icon: Flag },
    ],
  },
  {
    section: 'Platform',
    links: [
      { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
      { href: '/admin/billing', label: 'Billing', icon: DollarSign },
      { href: '/admin/audit-log', label: 'Audit Log', icon: ClipboardSignature },
    ],
  },
];

// ─── Tenant Admin Work Mode ──────────────────────────────────────────────────

export const tenantWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/tenant/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/tenant/analytics', label: 'Analytics', icon: PieChart },
    ],
  },
  {
    section: 'Manage',
    links: [
      { href: '/tenant/members', label: 'Members', icon: Users },
      { href: '/tenant/programs', label: 'Programs', icon: Award },
    ],
  },
  {
    section: 'Config',
    links: [
      { href: '/tenant/branding', label: 'Branding', icon: Lightbulb },
      { href: '/tenant/billing', label: 'Billing', icon: DollarSign },
      { href: '/tenant/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// ─── Default Work Mode (no specific role) ────────────────────────────────────

export const defaultWorkSections: NavSection[] = [
  {
    section: 'Dashboard',
    links: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Workspace',
    links: [
      { href: '/builder', label: 'Startup Builder', icon: Rocket },
      { href: '/milestones', label: 'Milestones', icon: Flag },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    section: 'Communicate',
    links: [
      { href: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPLORE MODE — Discovery, Community, Network (shared across all roles)
// ─────────────────────────────────────────────────────────────────────────────

export const exploreSections: NavSection[] = [
  {
    section: 'Discover',
    links: [
      { href: '/discover', label: 'Explore', icon: Compass },
    ],
  },
  {
    section: 'People',
    links: [
      { href: '/mentoring', label: 'Mentors', icon: GraduationCap },
      { href: '/investors', label: 'Investors', icon: TrendingUp },
    ],
  },
  {
    section: 'Opportunities',
    links: [
      { href: '/opportunities', label: 'Opportunities', icon: Target },
    ],
  },
  {
    section: 'Network',
    links: [
      { href: '/connections', label: 'Connections', icon: UserCheck, badge: 'connections' },
    ],
  },
  {
    section: 'Community',
    links: [
      { href: '/groups', label: 'Communities', icon: Users },
    ],
  },
  {
    section: 'Learn',
    links: [
      { href: '/learning', label: 'Learning Hub', icon: BookOpen },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT MODE — Profile, Settings, Activity
// ─────────────────────────────────────────────────────────────────────────────

export const accountSections: NavSection[] = [
  {
    section: 'Profile',
    links: [
      { href: '/profile', label: 'My Profile', icon: User },
    ],
  },
  {
    section: 'Activity',
    links: [
      { href: '/feed', label: 'Feed', icon: Rss },
      { href: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
    ],
  },
  {
    section: 'Settings',
    links: [
      { href: '/settings', label: 'General', icon: Settings },
      { href: '/settings/billing', label: 'Billing', icon: DollarSign },
    ],
  },
  {
    section: 'Grow',
    links: [
      { href: '/referrals', label: 'Referrals', icon: Gift },
      { href: '/invite', label: 'Invite Friends', icon: UserPlus },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get Work sections based on user role
// ─────────────────────────────────────────────────────────────────────────────

export function getWorkSectionsForRole(role: string | undefined): NavSection[] {
  if (!role) return defaultWorkSections;

  switch (role) {
    // Founders
    case 'founder':
    case 'aspiring_founder':
    case 'existing_founder':
    case 'cofounder_candidate':
    case 'technical_talent':
    case 'business_operator':
      return founderWorkSections;

    // Mentors & Coaches
    case 'mentor':
    case 'advisor':
    case 'coach':
    case 'course_creator':
      return mentorWorkSections;

    // Investors
    case 'investor':
    case 'angel':
    case 'vc':
    case 'angel_investor':
    case 'vc_scout':
    case 'vc_analyst':
    case 'syndicate_manager':
      return investorWorkSections;

    // Service Providers
    case 'service_provider':
    case 'legal_partner':
    case 'finance_advisor':
    case 'recruiter':
      return providerWorkSections;

    // Organizations
    case 'org':
    case 'incubator_admin':
    case 'accelerator_admin':
    case 'university_admin':
    case 'venture_studio_admin':
    case 'program_manager':
      return orgWorkSections;

    // Platform Admin
    case 'admin':
    case 'platform_admin':
    case 'super_admin':
      return adminWorkSections;

    // Tenant Admin
    case 'tenant_admin':
      return tenantWorkSections;

    default:
      return defaultWorkSections;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get sections for a specific mode
// ─────────────────────────────────────────────────────────────────────────────

export function getActiveNavHref(pathname: string | null, sections: NavSection[]): string | undefined {
  if (!pathname) return undefined;
  return sections.flatMap((section) => section.links).reduce<string | undefined>((active, { href }) => {
    const matches = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
    return matches && href.length > (active?.length ?? 0) ? href : active;
  }, undefined);
}

/**
 * The mode whose list holds this page, preferring the one already showing.
 * A page in no list (a profile, a deal, a board) keeps the reader's mode.
 */
/**
 * Pages reached from a mode's content but not listed in its sidebar (the
 * full Matches and For You views open from Discover's tab headers) still
 * belong to that mode's story.
 */
const ORPHAN_MODE: Record<string, SidebarMode> = {
  '/matches': 'explore',
  '/recommendations': 'explore',
  // Off the open list, still that mode's page. Search and the command
  // palette open them; the sidebar does not catalogue them.
  '/readiness': 'work',
  '/analytics': 'work',
  '/research': 'work',
  '/milestones': 'work',
  '/projects': 'work',
  '/calendar': 'work',
  '/mentor/reviews': 'work',
  '/mentor/profile': 'work',
  '/investor/analytics': 'work',
  '/provider/analytics': 'work',
  '/org/analytics': 'work',
  '/org/mentors': 'work',
  '/org/settings': 'work',
  '/tenant/domains': 'work',
  '/tenant/sso': 'work',
  '/tenant/webhooks': 'work',
  '/tenant/api-keys': 'work',
  '/tenant/automation': 'work',
  '/search': 'explore',
  '/members': 'explore',
  '/events': 'explore',
  '/programs': 'explore',
  '/jobs': 'explore',
  '/marketplace': 'explore',
  '/intros': 'explore',
  '/shortlist': 'explore',
  '/endorsements': 'explore',
  '/compare': 'explore',
  '/saved-searches': 'explore',
  '/expert-reviews': 'explore',
  '/coaching': 'explore',
  '/help': 'explore',
  '/reputation': 'account',
  '/achievements': 'account',
  '/activity': 'account',
};

export function modeForPath(pathname: string | null, current: SidebarMode, role?: string): SidebarMode {
  if (!pathname || getActiveNavHref(pathname, getSectionsForMode(current, role))) return current;
  for (const candidate of ['work', 'explore', 'account'] as const) {
    if (candidate !== current && getActiveNavHref(pathname, getSectionsForMode(candidate, role))) return candidate;
  }
  for (const [prefix, mode] of Object.entries(ORPHAN_MODE)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return mode;
  }
  return current;
}

export function getSectionsForMode(mode: SidebarMode, role?: string): NavSection[] {
  switch (mode) {
    case 'work':
      return getWorkSectionsForRole(role);
    case 'explore':
      return exploreSections;
    case 'account':
      return accountSections;
    default:
      return defaultWorkSections;
  }
}
