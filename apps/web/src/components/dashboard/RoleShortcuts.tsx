'use client';

import { HomeActionShelf } from '@/components/dashboard/HomeActionShelf';
import { useHomeAskRun } from '@/components/dashboard/HomeAskHero';
import { YourPagesRow } from '@/components/dashboard/YourPages';
import type { PageRailSection } from '@/components/layout/PageRail';
import { HOME_ASK, type HomeRole } from '@/lib/home-ask';

/**
 * A role's quick actions and "Your pages", in the page's tools.
 *
 * The founder's Overview and /home open on the question box and their own
 * content, with these in the tools column (docs §116). The other roles'
 * overviews stacked three layers before anything of theirs: the box, a row
 * of quick-action chips and "Your pages". They now open the same way as the
 * founder's (docs §123). Nothing is lost: the same chips are here, one press
 * away, and "/" in the question box still lists them as commands.
 */
export function RoleShortcuts({ role }: { role: HomeRole }) {
  const { run } = useHomeAskRun();
  return (
    <div className="space-y-4" data-testid={`role-shortcuts-${role}`}>
      <HomeActionShelf actions={HOME_ASK[role].actions} now={[]} run={run} label={false} />
      <YourPagesRow />
    </div>
  );
}

/** The tools section an overview passes to its AppShell `rail`. */
export function roleShortcutsSection(role: HomeRole): PageRailSection {
  return {
    id: 'shortcuts',
    glyph: 'spark',
    labelEn: 'Quick actions',
    labelEl: 'Γρήγορες ενέργειες',
    content: <RoleShortcuts role={role} />,
  };
}
