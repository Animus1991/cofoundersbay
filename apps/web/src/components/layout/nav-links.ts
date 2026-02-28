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
  Handshake,
  ShoppingBag,
  BookOpen,
  Activity,
  TrendingUp,
  Award,
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
      { href: '/connections', label: 'Connections', icon: Users },
      { href: '/groups', label: 'Groups', icon: Users },
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
    section: 'Settings',
    links: [
      { href: '/profile', label: 'My Profile', icon: User },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** @deprecated Use navSections for Alliance-style grouped nav */
export const navLinks = navSections.flatMap((s) => s.links);
