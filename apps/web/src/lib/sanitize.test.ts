import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeHtml } from './sanitize';

const HOSTILE =
  '<p>Notes</p><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">go</a>' +
  '<svg onload="alert(4)"></svg><iframe src="https://elsewhere.example"></iframe><form action="https://elsewhere.example"><input name="p"></form>' +
  '<a href="https://example.com/ok" onclick="alert(5)" style="color:red">fine</a>';

describe('escapeHtml', () => {
  it('escapes every character that matters in HTML', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });
});

describe('sanitizeHtml', () => {
  it('returns nothing for nothing', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml('', 'editor')).toBe('');
  });

  it.each(['rich-text', 'highlight', 'editor'] as const)('%s: runs nothing, whatever it keeps', (profile) => {
    const out = sanitizeHtml(HOSTILE, profile);
    expect(out).not.toMatch(/onerror|onload|onclick|javascript:|<script|<iframe|<svg|<form|<input/i);
    expect(out).toContain('Notes');
  });

  it('rich-text: the formatting a reader is shown, without styles or pictures', () => {
    const out = sanitizeHtml('<h2>T</h2><p style="color:red">a <b>b</b> <img src="https://example.com/i.png"></p><a href="https://example.com/x">l</a>');
    expect(out).toContain('<h2>T</h2>');
    expect(out).toContain('<b>b</b>');
    expect(out).toContain('href="https://example.com/x"');
    expect(out).not.toMatch(/style=|<img/);
  });

  it('highlight: only the tags a search result wraps its matches in', () => {
    expect(sanitizeHtml('a <mark>b</mark> <em>c</em> <a href="https://example.com">d</a> <p>e</p>', 'highlight')).toBe('a <mark>b</mark> <em>c</em> d e');
  });

  it('editor: keeps what the editors’ own toolbar writes, styles included', () => {
    const note =
      '<h2>Plan</h2><p style="text-align: center;">Centred</p>' +
      '<p><span style="background-color: rgb(254, 240, 138);">highlighted</span> <b>bold</b></p>' +
      '<ul><li>☐ task</li></ul><blockquote style="margin: 0px 0px 0px 40px;">indented</blockquote>' +
      '<table><tbody><tr><td>cell</td></tr></tbody></table>' +
      '<p><a href="https://example.com/x" target="_blank" rel="noopener noreferrer">a link</a> <a href="/profiles/1">ours</a> <a href="mailto:a@b.example">mail</a></p>' +
      '<p><img src="https://example.com/pasted.png" alt="pasted"></p>';
    expect(sanitizeHtml(note, 'editor')).toBe(note);
  });

  it('editor: keeps the picture a person pasted, but not its script', () => {
    const out = sanitizeHtml('<img src="data:image/png;base64,iVBORw0KGgo=" onerror="alert(1)" alt="x">', 'editor');
    expect(out).toContain('src="data:image/png;base64,iVBORw0KGgo="');
    expect(out).not.toMatch(/onerror/);
  });

  it('editor: drops script URLs from links, in any casing or with hidden characters', () => {
    for (const href of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' java\tscript:alert(1)', 'vbscript:x', 'data:text/html,<script>1</script>']) {
      const out = sanitizeHtml(`<a href="${href}">x</a>`, 'editor');
      expect(out, href).not.toMatch(/javascript:|vbscript:|data:text/i);
    }
  });
});
