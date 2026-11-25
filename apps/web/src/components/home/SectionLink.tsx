import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';

/**
 * The way from a home section to its page ("All", "See everyone"), with an
 * arrow (docs §143). In the Studio theme a link is ink like the text around
 * it, so the bare word read as a label, not something to press.
 */
export function SectionLink({ href, en, el, className, ...rest }: {
  href: string;
  en: string;
  el: string;
  className?: string;
} & Record<`data-${string}`, string>) {
  return (
    <Link
      href={href}
      className={`tap-extend-y group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-accessible hover:underline ${className ?? ''}`}
      {...rest}
    >
      <BilingualText en={en} el={el} compact />
      <span data-keep-icon="" className="inline-flex" aria-hidden="true">
        <ArrowRight className="icon-sm transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
