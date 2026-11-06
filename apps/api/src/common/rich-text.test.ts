import { describe, expect, it } from 'vitest';
import { cleanRichText } from './rich-text';

/** The second layer behind the web's DOMPurify: nothing that can run is stored or relayed (docs §111). */

describe('rich text on its way in', () => {
  it.each([
    ['a script', '<p>ok</p><script>alert(1)</script>', '<p>ok</p>'],
    ['an event handler', '<img src="https://x.test/a.png" onerror="alert(1)" />', '<img src="https://x.test/a.png" />'],
    ['a script link', '<a href="javascript:alert(1)">x</a>', '<a>x</a>'],
    ['a data link', '<a href="data:text/html,<script>alert(1)</script>">x</a>', '<a>x</a>'],
    ['an obfuscated script link', '<a href="java&#10;script:alert(1)">x</a>', '<a>x</a>'],
    ['a data image', '<img src="data:image/svg+xml,<svg onload=alert(1)>" />', '<img />'],
    ['a frame', '<iframe src="https://evil.test"></iframe><p>ok</p>', '<p>ok</p>'],
    ['a form', '<form action="https://evil.test"><input name="p" /></form>ok', 'ok'],
    ['svg', '<svg><script>alert(1)</script></svg>ok', 'ok'],
    ['a style block', '<style>body{display:none}</style>ok', 'ok'],
    ['a style url', '<p style="background:url(https://evil.test/x)">ok</p>', '<p>ok</p>'],
    ['protocol-relative', '<a href="//evil.test">x</a>', '<a>x</a>'],
  ])('removes %s', (_name, dirty, clean) => {
    expect(cleanRichText(dirty)).toBe(clean);
  });

  it('keeps what the toolbar produces, so saving does not restyle a note', () => {
    const notes = [
      '<h2>Title</h2><p><b>bold</b> <i>italic</i> <u>under</u> <strike>gone</strike> x<sup>2</sup></p>',
      '<ul><li>☐ one</li></ul><ol><li>two</li></ol><blockquote>quote</blockquote><pre>code</pre><hr />',
      '<div style="text-align:center">centred</div>',
      '<span style="background-color:rgb(254, 240, 138)">marked</span>',
      '<span style="color:#b91c1c">red</span>',
      '<blockquote style="margin:0 0 0 40px;border:none;padding:0px">indented</blockquote>',
      '<a href="https://cofounderbay.com/help" target="_blank" rel="noopener">link</a>',
      '<a href="/matches">inside</a> <a href="mailto:a@b.test">mail</a>',
      '<table><tbody><tr><td colspan="2">cell</td></tr></tbody></table>',
    ];
    for (const note of notes) expect(cleanRichText(note)).toBe(note);
  });

  it('leaves plain text as written, comparisons and ampersands included', () => {
    for (const text of ['Margin 3 < 5 and R&D > 10%', 'Τιμή & όγκος: 5 > 3', 'plain']) expect(cleanRichText(text)).toBe(text);
  });

  it('passes an absent value through', () => {
    expect(cleanRichText(undefined)).toBeUndefined();
    expect(cleanRichText(null)).toBeNull();
    expect(cleanRichText('')).toBe('');
  });
});
