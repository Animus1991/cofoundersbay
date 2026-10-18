import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

afterEach(cleanup);

const editorOf = (container: HTMLElement) => container.querySelector('[contenteditable]') as HTMLDivElement;

/**
 * A note's HTML is stored as written and, for another reader, shown through
 * SanitizedHtml. The editor used to load it with `innerHTML = content`, so a
 * collaborator with write access could store `<img onerror=...>` and have it run
 * in the owner's browser the moment they opened the note to edit it.
 */
const HOSTILE = [
  '<p>Pricing notes</p>',
  '<img src="x" onerror="window.__pwned = 1">',
  '<script>window.__pwned = 2</script>',
  '<a href="javascript:window.__pwned = 3">link</a>',
  '<svg onload="window.__pwned = 4"></svg>',
  '<iframe src="https://elsewhere.example"></iframe>',
  '<form action="https://elsewhere.example"><input name="password"></form>',
].join('');

describe('loading a note into the editor', () => {
  it('keeps the text and drops everything that can run script', () => {
    const { container } = render(<RichTextEditor content={HOSTILE} onChange={vi.fn()} />);
    const editor = editorOf(container);
    expect(editor.textContent).toContain('Pricing notes');
    expect(editor.textContent).toContain('link');
    expect(editor.querySelector('[onerror], [onload]')).toBeNull();
    expect(editor.querySelector('script, iframe, svg, form, input')).toBeNull();
    for (const a of Array.from(editor.querySelectorAll('a'))) expect(a.getAttribute('href') ?? '').not.toMatch(/^\s*javascript:/i);
    expect(editor.innerHTML).not.toMatch(/onerror|onload|javascript:/i);
  });

  it('leaves what the toolbar itself produces exactly as it was', () => {
    const note =
      '<h2>Plan</h2><p style="text-align: center;">Centred</p>' +
      '<p><span style="background-color: rgb(254, 240, 138);">highlighted</span> and <b>bold</b> <i>italic</i></p>' +
      '<ul><li>☐ task</li></ul><blockquote style="margin: 0px 0px 0px 40px;">indented</blockquote>' +
      '<p><a href="https://example.com/x" target="_blank" rel="noopener noreferrer">a link</a></p>';
    const { container } = render(<RichTextEditor content={note} onChange={vi.fn()} />);
    expect(editorOf(container).innerHTML).toBe(note);
  });

  it('is not rebuilt while the person types: the caret stays where it is', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<RichTextEditor content="<p>Hello</p>" onChange={onChange} />);
    const editor = editorOf(container);
    const paragraph = editor.firstChild;
    // What typing does: the browser changes the DOM, then fires input.
    editor.innerHTML = '<p>Hello world</p>';
    const typed = editor.firstChild;
    fireEvent.input(editor);
    expect(onChange).toHaveBeenCalledWith('<p>Hello world</p>');
    // The parent hands the same HTML back as `content`; the editor must not replace its nodes.
    rerender(<RichTextEditor content="<p>Hello world</p>" onChange={onChange} />);
    expect(editor.firstChild).toBe(typed);
    expect(editor.firstChild).not.toBe(paragraph);
  });

  it('shows a note that arrives from somewhere else, sanitised', () => {
    const { container, rerender } = render(<RichTextEditor content="<p>First</p>" onChange={vi.fn()} />);
    rerender(<RichTextEditor content={'<p>Second</p><img src="x" onerror="window.__pwned = 1">'} onChange={vi.fn()} />);
    const editor = editorOf(container);
    expect(editor.textContent).toContain('Second');
    expect(editor.querySelector('[onerror]')).toBeNull();
  });

  it('shows a read-only note through the same sanitiser as before', () => {
    const { container } = render(<RichTextEditor content={HOSTILE} onChange={vi.fn()} readOnly />);
    expect(container.querySelector('[onerror], script, iframe, svg, form')).toBeNull();
    expect(container.textContent).toContain('Pricing notes');
  });
});
