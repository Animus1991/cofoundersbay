import { AppShellFrame } from '@/components/layout/AppShell';

/** One chrome for Perks: partner offers and the ones you claimed. */
export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <AppShellFrame>{children}</AppShellFrame>;
}
