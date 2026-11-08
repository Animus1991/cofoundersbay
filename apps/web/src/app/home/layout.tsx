import { AppShellFrame } from '@/components/layout/AppShell';

/** The first pages under comparison (docs §116) share the application chrome. */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <AppShellFrame>{children}</AppShellFrame>;
}
