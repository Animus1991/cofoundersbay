'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useRoleOptional } from '@/contexts/RoleContext';
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

  return useMemo(
    () => ({
      route: pathname ?? '/',
      entity: entityFromPath(pathname),
      role: role?.primaryRole ?? null,
      locale: 'en',
    }),
    [pathname, role?.primaryRole],
  );
}
