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
  Heart,
  Bell,
  Flag,
  Bookmark,
  Grid3X3,
  LayoutDashboard,
} from 'lucide-react';

export type NavSection = {
  section: string;
  links: { href: string; label: string; icon: LucideIcon }[];
};

export const navSections: NavSection[] = [
  {
    section: 'Workspace',
    links: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/research', label: 'Research', icon: Grid3X3 },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
      { href: '/milestones', label: 'Milestones', icon: Flag },
    ],
  },
  {
    section: 'Discovery',
    links: [
      { href: '/matches', label: 'Matches', icon: Heart },
      { href: '/discover', label: 'Explore', icon: Compass },
      { href: '/mentoring', label: 'Mentors', icon: GraduationCap },
      { href: '/groups', label: 'Communities', icon: Users },
    ],
  },
  {
    section: 'Network',
    links: [
      { href: '/connections', label: 'Connections', icon: UserCheck },
      { href: '/events', label: 'Events', icon: Calendar },
      { href: '/shortlist', label: 'Saved', icon: Bookmark },
    ],
  },
  {
    section: 'Account',
    links: [
      { href: '/profile', label: 'Profile', icon: User },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** Flat nav links — deduplicated by href */
export const navLinks = Array.from(
  new Map(navSections.flatMap((s) => s.links).map((l) => [l.href, l])).values()
);
