import { BilingualText } from '@/components/common/BilingualText';

/**
 * Bypass-blocks link (WCAG 2.4.1).
 *
 * Every authenticated page renders a persistent sidebar + top bar before the
 * page body, so keyboard and screen-reader users would otherwise tab through
 * ~30 navigation controls on every single navigation. This link is the first
 * focusable node in the document and jumps straight to `<main id="main-content">`,
 * which `AppShellFrame` (and the public shells) already expose.
 *
 * It is visually hidden until focused — see `.skip-to-content` in globals.css.
 * The label follows the same display preference as the rest of the page.
 */
export function SkipToContent() {
  return (
    <a href="#main-content" className="skip-to-content">
      <BilingualText en="Skip to main content" el="Μετάβαση στο κύριο περιεχόμενο" compact />
    </a>
  );
}
