'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { useI18n } from '@/components/common/I18nProvider';
import { translateDom } from '@/lib/i18n/dom';

export function DomI18n({ children }: { children: ReactNode }) {
  const { locale, t } = useI18n();

  useLayoutEffect(() => {
    const root = document.body;
    const apply = () => translateDom(root, t, locale === 'en');
    apply();

    let frame = 0;
    const obs = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    });
    obs.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'alt', 'label'],
    });
    return () => {
      obs.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [locale, t]);

  return children;
}
