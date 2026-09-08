const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'KBD',
  'TEXTAREA',
  'SVG',
  'PATH',
  'MATH',
]);

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label'] as const;

const originalText = new WeakMap<Text, string>();
const lastText = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Record<string, string>>();
const lastAttr = new WeakMap<Element, Record<string, string>>();

let applying = false;

function shouldSkipElement(el: Element | null): boolean {
  while (el) {
    const tag = el.tagName;
    if (SKIP_TAGS.has(tag)) return true;
    if ((el as HTMLElement).isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

export function shouldTranslateSource(value: string): boolean {
  const text = value.trim();
  if (text.length < 2) return false;
  if (!/[A-Za-z\u00C0-\u024F]/.test(text)) return false;
  if (/^[A-Z]{1,3}$/.test(text)) return false;
  if (text.includes('@') && text.includes('.') && !text.includes(' ')) return false;
  if (/^https?:\/\//i.test(text) || text.startsWith('mailto:') || (text.startsWith('/') && !text.includes(' ')))
    return false;
  if (/^[\d%$€£.,+\-↑↓/\s]+$/.test(text)) return false;
  if (/^[a-z0-9_-]+$/.test(text) && !text.includes(' ')) return false;
  if (/^(flex|grid|inline-|bg-|text-|border-|h-|w-|p-|m-|gap-|sm:|lg:|md:|hover:|dark:)/.test(text) && /[-:]/.test(text))
    return false;
  if (text.startsWith('data:')) return false;
  return true;
}

function resolveSource(current: string, original: string | undefined, last: string | undefined): string {
  if (original === undefined) return current;
  if (current === last || current === original) return original;
  return current;
}

export function translateDom(
  root: ParentNode,
  t: (source: string) => string,
  passthrough: boolean,
): void {
  if (applying) return;
  applying = true;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const textNode = node as Text;
      node = walker.nextNode();
      const parent = textNode.parentElement;
      if (!parent || shouldSkipElement(parent)) continue;
      const current = textNode.nodeValue ?? '';
      if (!current.trim()) continue;
      const source = resolveSource(current, originalText.get(textNode), lastText.get(textNode));
      originalText.set(textNode, source);
      const next = passthrough || !shouldTranslateSource(source) ? source : t(source.trim()) === source.trim()
        ? source
        : source.replace(source.trim(), t(source.trim()));
      lastText.set(textNode, next);
      if (textNode.nodeValue !== next) textNode.nodeValue = next;
    }

    const attrTargets = root.querySelectorAll(
      '[placeholder],[title],[aria-label],[alt],[label]',
    );
    const extra: Element[] = root instanceof Element ? [root] : [];
    for (const el of [...extra, ...attrTargets]) {
      if (shouldSkipElement(el)) continue;
      const orig = originalAttr.get(el) ?? {};
      const last = lastAttr.get(el) ?? {};
      let changedOrig = false;
      let changedLast = false;
      for (const key of ATTRS) {
        const current = el.getAttribute(key);
        if (current == null || !current.trim()) continue;
        const source = resolveSource(current, orig[key], last[key]);
        if (orig[key] !== source) {
          orig[key] = source;
          changedOrig = true;
        }
        const next =
          passthrough || !shouldTranslateSource(source)
            ? source
            : t(source.trim()) === source.trim()
              ? source
              : source.replace(source.trim(), t(source.trim()));
        if (last[key] !== next) {
          last[key] = next;
          changedLast = true;
        }
        if (current !== next) el.setAttribute(key, next);
      }
      if (changedOrig) originalAttr.set(el, orig);
      if (changedLast) lastAttr.set(el, last);
    }
  } finally {
    applying = false;
  }
}
