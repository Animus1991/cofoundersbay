import {
  type LucideIcon,
  Compass,
  User,
  Sparkle,
  Settings,
  MessageCircle,
  Calendar,
  Briefcase,
  GraduationCap,
  Users,
  UserCheck,
  Handshake,
  ShoppingBag,
  BookOpen,
  Activity,
  TrendingUp,
  Award,
  LayoutGrid,
} from 'lucide-react';

export type NavSection = {
  section: string;
  links: { href: string; label: string; icon: LucideIcon }[];
};

export const navSections: NavSection[] = [
  {
    section: 'Main',
    links: [
      { href: '/', label: 'Dashboard', icon: Sparkle },
      { href: '/activity', label: 'Activity', icon: Activity },
      { href: '/analytics', label: 'Analytics', icon: TrendingUp },
      { href: '/achievements', label: 'Achievements', icon: Award },
    ],
  },
  {
    section: 'Community',
    links: [
      { href: '/discover', label: 'Discover', icon: Compass },
      { href: '/members', label: 'Members', icon: Users },
      { href: '/connections', label: 'Connections', icon: UserCheck },
      { href: '/groups', label: 'Groups', icon: LayoutGrid },
      { href: '/events', label: 'Events', icon: Calendar },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
    ],
  },
  {
    section: 'Ecosystem',
    links: [
      { href: '/mentoring', label: 'Mentoring', icon: GraduationCap },
      { href: '/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/opportunities', label: 'Opportunities', icon: Handshake },
      { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { href: '/learning', label: 'Learning', icon: BookOpen },
    ],
  },
  {
    section: 'Account',
    links: [
      { href: '/profile', label: 'My Profile', icon: User },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** Flat nav links — deduplicated by href */
export const navLinks = Array.from(
  new Map(navSections.flatMap((s) => s.links).map((l) => [l.href, l])).values()
);
