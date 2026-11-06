import * as sanitizeModule from 'sanitize-html';

// The compiled build (commonjs, no esModuleInterop) gets the function itself; a
// default import there compiles to `.default`, which the package does not have.
// Vitest's ESM interop gets it under `.default`. Both are checked: the tests, and
// running the compiled file, because the tests alone passed with the broken form.
const sanitizeHtml: typeof sanitizeModule = (sanitizeModule as unknown as { default?: typeof sanitizeModule }).default ?? sanitizeModule;

/**
 * Rich text on its way into the database (docs §§ on the research editor, §111).
 *
 * The web sanitises when it renders and when it loads a note into an editor
 * (`apps/web/src/lib/sanitize.ts`). This is the second layer: what is stored
 * and what is relayed to collaborators is already free of anything that can
 * run. It keeps what the editors' toolbar produces, inline highlight,
 * alignment and indent included, so saving a note does not restyle it.
 */
const COLOUR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i];
const LENGTH = [/^-?[\d.]+(?:px|em|rem|%)?(?:\s+-?[\d.]+(?:px|em|rem|%)?){0,3}$/i];

const OPTIONS: sanitizeModule.IOptions = {
  allowedTags: [
    'p', 'br', 'span', 'div', 'font',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'sub', 'sup', 'small', 'code', 'pre', 'kbd',
    'blockquote', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'hr', 'cite', 'time', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    '*': ['style', 'class', 'title', 'dir', 'lang'],
    a: ['href', 'target', 'rel', 'name'],
    img: ['src', 'alt', 'width', 'height'],
    font: ['color', 'size', 'face'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span'],
    time: ['datetime'],
  },
  // Each property against a pattern, so url(), expression() and the like go.
  allowedStyles: {
    '*': {
      color: COLOUR,
      'background-color': COLOUR,
      background: COLOUR,
      'text-align': [/^(?:left|right|center|justify|start|end)$/i],
      'text-decoration': [/^[a-z\s-]+$/i],
      'font-weight': [/^(?:normal|bold|bolder|lighter|\d{3})$/i],
      'font-style': [/^(?:normal|italic|oblique)$/i],
      'font-size': LENGTH,
      margin: LENGTH,
      'margin-left': LENGTH,
      'margin-right': LENGTH,
      padding: LENGTH,
      'padding-left': LENGTH,
      'padding-right': LENGTH,
      border: [/^none$/i, /^0(?:px)?$/i],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
};

/** Anything that could be markup. Text without it has nothing to remove, and is stored as written. */
const MARKUP = /<[a-z!/?]/i;

export function cleanRichText<T extends string | null | undefined>(value: T): T {
  if (typeof value !== 'string' || !MARKUP.test(value)) return value;
  return sanitizeHtml(value, OPTIONS) as T;
}
