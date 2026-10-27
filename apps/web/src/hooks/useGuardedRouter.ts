'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { confirmLeave, hasUnsavedChanges } from '@/lib/unsaved-changes';

type Router = ReturnType<typeof useRouter>;
type NavigateOptions = Parameters<Router['push']>[1];

/**
 * Next's router, asking first when a form on the page holds unsaved work
 * (`confirmLeave`). For navigations no link click carries: keyboard
 * shortcuts, the command palette, the assistant opening a page. With nothing
 * to lose it navigates at once, with exactly the call it was given.
 */
export function useGuardedRouter(): Router {
  const router = useRouter();
  return useMemo<Router>(() => {
    const go = (method: 'push' | 'replace', href: string, options: NavigateOptions) => {
      if (options === undefined) router[method](href);
      else router[method](href, options);
    };
    const guarded = (method: 'push' | 'replace') => (href: string, options?: NavigateOptions) => {
      if (!hasUnsavedChanges()) return go(method, href, options);
      void confirmLeave(href).then((ok) => {
        if (ok) go(method, href, options);
      });
    };
    return { ...router, push: guarded('push'), replace: guarded('replace') };
  }, [router]);
}
