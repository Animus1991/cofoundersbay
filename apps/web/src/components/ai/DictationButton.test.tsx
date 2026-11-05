import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DictationButton } from './DictationButton';

type Handler = ((event: unknown) => void) | null;
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: Handler = null;
  onend: (() => void) | null = null;
  onerror: Handler = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();
  constructor() { FakeRecognition.last = this; }
}

function setPointer(coarse: boolean) {
  window.matchMedia = ((query: string) => ({ matches: coarse && query.includes('coarse'), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = FakeRecognition;
  setPointer(true);
});
afterEach(() => {
  cleanup();
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
});

describe('dictation in the question box (docs §107.7-7, §111)', () => {
  it('puts what was heard into the box after what was typed, and says it is listening', async () => {
    const onChange = vi.fn();
    render(<DictationButton value="Who" onChange={onChange} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Dictate the question/ })); });
    expect(FakeRecognition.last?.start).toHaveBeenCalled();
    expect(screen.getAllByText(/Listening…/).length).toBeGreaterThan(0);
    act(() => {
      FakeRecognition.last?.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: 'replied to me' }], { isFinal: true })] });
    });
    expect(onChange).toHaveBeenLastCalledWith('Who replied to me');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Stop dictation/ })); });
    expect(screen.queryByText(/Listening…/)).toBeNull();
  });

  it('is not offered where the browser cannot listen, or on a mouse-driven screen', () => {
    setPointer(false);
    const { container, unmount } = render(<DictationButton value="" onChange={() => {}} />);
    expect(container.querySelector('button')).toBeNull();
    unmount();
    setPointer(true);
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    const again = render(<DictationButton value="" onChange={() => {}} />);
    expect(again.container.querySelector('button')).toBeNull();
  });
});
