'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { BilingualText } from '@/components/common/BilingualText';
import { confirmLeave, hasUnsavedChanges, isGuardedLinkClick, LEAVE_COPY, setLeaveAsker } from '@/lib/unsaved-changes';

/**
 * Asks before a link leaves a page whose form holds unsaved work.
 *
 * Mounted once, inside the confirm provider. A click on an in-app link is
 * held in the capture phase, before Next's Link sees it (`preventDefault`,
 * which Link respects; the link's own handlers still run), and the reader
 * chooses: stay (the default, focused) or leave without saving, after which
 * the page is opened. Reloads and other sites get the browser's own
 * question (`useUnsavedForm`); Back cannot be stopped, so the draft kept in
 * the tab is offered when the form opens again.
 *
 * Code that navigates by itself (shortcuts, the assistant) asks through
 * `confirmLeave`, or `useGuardedRouter`.
 */
export function UnsavedChangesGuard() {
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    setLeaveAsker(() =>
      confirm({
        title: <BilingualText en={LEAVE_COPY.title.en} el={LEAVE_COPY.title.el} />,
        description: <BilingualText en={LEAVE_COPY.body.en} el={LEAVE_COPY.body.el} wrap />,
        cancelLabel: <BilingualText en={LEAVE_COPY.stay.en} el={LEAVE_COPY.stay.el} compact />,
        confirmLabel: <BilingualText en={LEAVE_COPY.leave.en} el={LEAVE_COPY.leave.el} compact />,
        variant: 'destructive',
      }),
    );

    const onClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges()) return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = isGuardedLinkClick(
        event,
        {
          href: anchor.getAttribute('href') ?? '',
          target: anchor.target,
          hasDownload: anchor.hasAttribute('download'),
          optOut: anchor.closest('[data-unsaved-ok]') !== null,
        },
        window.location,
      );
      if (!href) return;
      event.preventDefault();
      void confirmLeave(href).then((ok) => {
        if (ok) router.push(href);
      });
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      setLeaveAsker(null);
    };
  }, [router, confirm]);

  return null;
}
