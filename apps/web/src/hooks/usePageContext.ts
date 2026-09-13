'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useI18n } from '@/components/common/I18nProvider';
import type { PageContextPacket } from '@/lib/copilot-engine';

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
  // Was hardcoded to 'en', so the assistant was told every reader was English
  // no matter what they had chosen — which made translating its replies
  // pointless until this line changed. `useI18n` carries a working default, so
  // this is safe outside the provider too.
  const { locale } = useI18n();

  return useMemo(
    () => ({
      route: pathname ?? '/',
      entity: entityFromPath(pathname),
      role: role?.primaryRole ?? null,
      locale,
    }),
    [pathname, role?.primaryRole, locale],
  );
}
