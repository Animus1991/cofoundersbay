import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useVoiceRecorder, voiceRecordingSupported } from './useVoiceRecorder';

class FakeRecorder {
  static isTypeSupported = (mime: string) => mime.startsWith('audio/webm');
  static last: FakeRecorder | null = null;
  state = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown, public options: { mimeType: string }) { FakeRecorder.last = this; }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}

const track = { stop: vi.fn() };
const getUserMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  getUserMedia.mockResolvedValue({ getTracks: () => [track] });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('recording a voice note', () => {
  it('knows when the browser can record', () => {
    expect(voiceRecordingSupported()).toBe(true);
    vi.stubGlobal('MediaRecorder', undefined);
    expect(voiceRecordingSupported()).toBe(false);
  });

  it('hands over a file and frees the microphone', async () => {
    const done = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder(done));
    await act(async () => { await result.current.start(); });
    expect(result.current.recording).toBe(true);
    act(() => result.current.stop());
    expect(done).toHaveBeenCalledOnce();
    const file = done.mock.calls[0]?.[0] as File;
    expect(file.name).toBe('voice-note.webm');
    expect(file.type).toBe('audio/webm');
    expect(track.stop).toHaveBeenCalled();
    expect(result.current.recording).toBe(false);
  });

  it('sends nothing when cancelled, and still frees the microphone', async () => {
    const done = vi.fn();
    const { result } = renderHook(() => useVoiceRecorder(done));
    await act(async () => { await result.current.start(); });
    act(() => result.current.cancel());
    expect(done).not.toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
  });

  it('says when the microphone was refused', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    const { result } = renderHook(() => useVoiceRecorder(vi.fn()));
    let failure: unknown;
    await act(async () => { failure = await result.current.start(); });
    expect(failure).toBe('denied');
    expect(result.current.recording).toBe(false);
  });

  it('frees the microphone when the thread closes mid-recording', async () => {
    const done = vi.fn();
    const { result, unmount } = renderHook(() => useVoiceRecorder(done));
    await act(async () => { await result.current.start(); });
    unmount();
    expect(track.stop).toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });
});
