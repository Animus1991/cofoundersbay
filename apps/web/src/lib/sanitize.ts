/**
 * HTML sanitisation for the four `dangerouslySetInnerHTML` sinks in the app.
 *
 * All four render content that ultimately comes from a user or from the API:
 *  - rich-text notes written in a contentEditable (research boards, canvas)
 *  - search-result highlight fragments returned by the search service
 *
 * DOMPurify needs a DOM, and these components are still server-rendered even
 * though they are client components. On the server we therefore fall back to
 * escaping everything, and the client replaces it with the sanitised markup on
 * hydration. Containers that use this must carry `suppressHydrationWarning`
 * (see `SanitizedHtml`), because server text and client markup differ by design.
 */

const RICH_TEXT_TAGS = [
  'p', 'br', 'span', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup', 'code', 'pre',
  'blockquote', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const RICH_TEXT_ATTRS = ['href', 'title', 'target', 'rel', 'class', 'colspan', 'rowspan'];

/** Escapes every HTML-significant character. Safe in any context. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type SanitizeProfile = 'rich-text' | 'highlight';

/**
 * `highlight` allows nothing but <mark>/<em>/<strong>: the search service only
 * ever wraps matched terms, so anything else in that payload is an injection.
 */
export function sanitizeHtml(dirty: string, profile: SanitizeProfile = 'rich-text'): string {
  if (!dirty) return '';

  if (typeof window === 'undefined') {
    // Server render: no DOM to parse with, so emit inert text.
    return escapeHtml(stripTags(dirty));
  }

  // Required lazily so DOMPurify is only pulled in on the client path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = (require('dompurify') as { default: typeof import('dompurify').default }).default;

  if (profile === 'highlight') {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['mark', 'em', 'strong', 'b', 'i'],
      ALLOWED_ATTR: [],
    });
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: RICH_TEXT_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ATTRS,
    // javascript:, data: and vbscript: URIs never survive.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'srcset', 'formaction'],
  });
}

/** Crude tag removal used only for the server-side inert fallback. */
function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}
