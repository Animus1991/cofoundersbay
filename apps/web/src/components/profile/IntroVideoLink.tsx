import { BilingualText } from '@/components/common/BilingualText';
import { safeWebUrl } from '@/lib/web-url';

/** A profile's introduction video, as a link. The address is never framed. */
export function IntroVideoLink({ raw }: { raw: unknown }) {
  const href = typeof raw === 'string' ? safeWebUrl(raw) : null;
  if (!href) return null;
  return (
    <p className="text-sm">
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-accessible">
        <BilingualText en="Introduction video" el="Βίντεο παρουσίασης" compact />
      </a>
    </p>
  );
}
