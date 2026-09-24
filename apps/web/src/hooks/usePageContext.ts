'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useI18n } from '@/components/common/I18nProvider';
import type { PageContextPacket } from '@/lib/copilot-engine';
import { usePageSnapshot, type PageSnapshot } from '@/contexts/PageSnapshotContext';
import { getPageMeta } from '@/lib/page-registry';

/**
 * The floor every page stands on when it publishes nothing itself.
 *
 * Snapshot publishing is opt-in per page and three pages had opted in, so on
 * the other 152 the assistant was back to a bare path string. The registry
 * already knows every route's title and one-line description in both
 * languages — that is a description of the screen too, just a static one.
 * A page that publishes its own snapshot still wins below; this only fills
 * the silence.
 *
 * `state` is deliberately absent: the registry cannot know whether the page
 * is loaded, empty or erroring, and a floor that said `ready` would be lying
 * exactly when it matters most.
 */
function registryFloor(
  pathname: string | null,
  locale: string,
): (PageSnapshot & { route: string }) | null {
  if (!pathname) return null;
  const meta = getPageMeta(pathname);
  if (!meta) return null;
  const el = locale === 'el';
  return {
    route: pathname,
    title: el ? (meta.titleEl ?? meta.title) : meta.title,
    summary: el ? (meta.descriptionEl ?? meta.description) : meta.description,
  };
}

function entityFromPath(pathname: string | null): PageContextPacket['entity'] {
  if (!pathname) return undefined;
  const match = pathname.match(/^\/(profiles|matches|messages|research|p)\/([^/]+)/);
  if (!match) return undefined;
  const typeMap: Record<string, string> = {
    profiles: 'profile',
    matches: 'match',
    messages: 'conversation',
    research: 'board',
    p: 'profile',
  };
  return { type: typeMap[match[1]] ?? match[1], id: match[2] };
}

export function usePageContext(): PageContextPacket {
  const pathname = usePathname();
  const role = useRoleOptional();
  // What the page currently shows, when it says. Absent on pages that publish
  // nothing, which is every page this hook served before — those still hand
  // the assistant a route and nothing more.
  const snapshot = usePageSnapshot();
  // Was hardcoded to 'en', so the assistant was told every reader was English
  // no matter what they had chosen — which made translating its replies
  // pointless until this line changed. `useI18n` carries a working default, so
  // this is safe outside the provider too.
  const { locale } = useI18n();

  // Serialised for the dependency list: the snapshot is rebuilt by its page on
  // every render, so comparing by identity would make this memo useless and
  // hand a new packet to every consumer each time.
  const snapshotKey = snapshot ? JSON.stringify(snapshot) : '';

  return useMemo(
    () => {
      const published =
        snapshotKey && snapshot?.route === (pathname ?? '/') ? snapshot : null;
      const screen = published ?? registryFloor(pathname, locale);
      return {
        route: pathname ?? '/',
        entity: entityFromPath(pathname),
        role: role?.primaryRole ?? null,
        locale,
        ...(screen ? { screen } : {}),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshotKey stands in for snapshot by value
    [pathname, role?.primaryRole, locale, snapshotKey],
  );
}
