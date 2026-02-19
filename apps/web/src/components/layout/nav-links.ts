import {
  type LucideIcon,
  Compass,
  User,
  Sparkle,
  Settings,
  Wand2,
  MessageCircle,
  Calendar,
  Briefcase,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export type NavSection = {
  section: string;
  links: { href: string; label: string; icon: LucideIcon }[];
};

export const navSections: NavSection[] = [
  {
    section: 'Main',
    links: [
      { href: '/', label: 'Dashboard', icon: Sparkle },
    ],
  },
  {
    section: 'Community',
    links: [
      { href: '/discover', label: 'Discover', icon: Compass },
      { href: '/events', label: 'Events', icon: Calendar },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
    ],
  },
  {
    section: 'Jobs',
    links: [
      { href: '/discover', label: 'Job offers', icon: Briefcase },
    ],
  },
  {
    section: 'Learning',
    links: [
      { href: '/onboarding', label: 'Onboarding', icon: Wand2 },
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
