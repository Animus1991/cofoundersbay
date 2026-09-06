import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { streamAIChat } from './ai-api';

const encoder = new TextEncoder();

function sse(text: string) {
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  }), { headers: { 'Content-Type': 'text/event-stream' } });
}

function controlledStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const sourceCancel = vi.fn();
  const body = new ReadableStream<Uint8Array>({
    start(value) { controller = value; },
    cancel: sourceCancel,
  });
  const response = new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
  const reader = body.getReader();
  const cancel = vi.spyOn(reader, 'cancel');
  const release = vi.spyOn(reader, 'releaseLock');
  vi.spyOn(body, 'getReader').mockReturnValue(reader);
  return {
    response,
    controller,
    cancel,
    release,
    sourceCancel,
  };
}

function httpError(status: number) {
  return new Response(JSON.stringify({ success: false, error: {
    message: `Denied ${status}`, code: `E${status}`, details: { reason: 'test' }, requestId: 'request-1',
  } }), { status, headers: { 'Content-Type': 'application/json' } });
}

async function collect(signal?: AbortSignal) {
  const events = [];
  for await (const event of streamAIChat({ message: 'Hello' }, signal)) events.push(event);
  return events;
}

beforeEach(() => {
  document.cookie = 'cfb_csrf=stream%20token; path=/';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.cookie = 'cfb_csrf=; Max-Age=0; path=/';
});

describe('streamAIChat authenticated transport', () => {
  it('sends the double-submit CSRF cookie and authenticated credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sse('data: {"done":true,"model":"test"}\n\n'));
    vi.stubGlobal('fetch', fetchMock);

    await collect();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/ai\/chat\/stream$/);
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('x-csrf-token')).toBe('stream token');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
    expect(new Headers(init.headers).get('Accept')).toBe('text/event-stream');
  });

  it('refreshes once on 401 and retries with the rotated CSRF cookie', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(httpError(401))
      .mockImplementationOnce(async () => {
        document.cookie = 'cfb_csrf=rotated; path=/';
        return new Response(null, { status: 204 });
      })
      .mockResolvedValueOnce(sse('data: {"done":true,"model":"refreshed"}\n\n'));
    vi.stubGlobal('fetch', fetchMock);

    expect(await collect()).toEqual([{ done: true, model: 'refreshed' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/refresh$/);
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('x-csrf-token')).toBe('rotated');
    expect(fetchMock.mock.calls.every(([, init]) => init.credentials === 'include')).toBe(true);
  });

  it.each([403, 429])('preserves structured HTTP %i without retry', async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(httpError(status));
    vi.stubGlobal('fetch', fetchMock);
    await expect(collect()).rejects.toMatchObject({
      name: 'ApiError', status, message: `Denied ${status}`, code: `E${status}`,
      requestId: 'request-1', details: { reason: 'test' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces expired sessions and does not loop after a second 401', async () => {
    const logout = vi.fn();
    window.addEventListener('cfb:logout', logout);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(httpError(401))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(httpError(401));
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(collect()).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(logout).toHaveBeenCalledOnce();
      expect(document.cookie).not.toContain('cfb_csrf=');
    } finally {
      window.removeEventListener('cfb:logout', logout);
    }
  });

  it('does not send an already-cancelled request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sse('data: {"done":true}\n\n'));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();
    await expect(collect(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels after headers while a read is pending and releases the reader', async () => {
    const source = controlledStream();
    source.controller.enqueue(encoder.encode('data: {"chunk":"partial","done":false}\n\n'));
    const fetchMock = vi.fn().mockResolvedValue(source.response);
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const iterator = streamAIChat({ message: 'Hi' }, controller.signal);
    expect((await iterator.next()).value).toMatchObject({ chunk: 'partial' });
    const pending = iterator.next();
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await rejected;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(source.cancel).toHaveBeenCalledOnce();
    expect(source.release).toHaveBeenCalledOnce();
    expect(source.sourceCancel).toHaveBeenCalledOnce();
  });

  it('distinguishes initial connection timeout from user cancellation', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
    })));
    const rejected = expect(collect()).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(30_001);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out a stalled body and cleans up without confusing it with user cancellation', async () => {
    vi.useFakeTimers();
    const source = controlledStream();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(source.response));
    const rejected = expect(collect()).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(30_001);
    await rejected;
    expect(source.cancel).toHaveBeenCalledOnce();
    expect(source.release).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('streamAIChat SSE framing and cleanup', () => {
  it('decodes byte-fragmented UTF-8, CRLF, multiline data and a terminal EOF frame', async () => {
    const text = ': keepalive\r\nevent: message\r\ndata:{"chunk":"Καλημέρα",\r\ndata: "done":false,"model":"test"}\r\n\r\ndata:{"done":true,"model":"test"}';
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of encoder.encode(text)) controller.enqueue(Uint8Array.of(byte));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
    })));
    expect(await collect()).toEqual([
      { chunk: 'Καλημέρα', done: false, model: 'test' },
      { done: true, model: 'test' },
    ]);
    expect(body.locked).toBe(false);
  });

  it.each([
    '',
    'data: {"chunk":"partial","done":false}\n\n',
    'data: {"chunk":"partial","done":false}',
  ])('rejects EOF without a terminal done event (%s)', async (text) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse(text)));
    await expect(collect()).rejects.toMatchObject({ code: 'AI_STREAM_INCOMPLETE' });
  });

  it.each([
    'data: {bad json}\n\ndata: {"done":true}\n\n',
    'data: {"done":"true"}\n\n',
    'data: {"chunk":3,"done":false}\n\n',
    'data: {"fallback":"yes","done":true}\n\n',
  ])('rejects malformed events rather than claiming successful truncation (%s)', async (text) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse(text)));
    await expect(collect()).rejects.toMatchObject({ code: 'AI_STREAM_INVALID' });
  });

  it('surfaces an SSE error even when followed by done', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse(
      'event: error\ndata: {"error":"Provider failed","done":true}\n\n',
    )));
    await expect(collect()).rejects.toThrow('Provider failed');
  });

  it('does not reinterpret an unexpected success body as permission to resend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"already processed"}', {
      headers: { 'Content-Type': 'application/json' },
    })));
    await expect(collect()).rejects.toMatchObject({ code: 'AI_STREAM_INVALID' });
  });

  it('cancels and releases immediately on done, even when the server keeps the connection open', async () => {
    const source = controlledStream();
    source.controller.enqueue(encoder.encode('data: {"done":true,"fallback":true}\n\n'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(source.response));
    expect(await collect()).toEqual([{ done: true, fallback: true }]);
    expect(source.cancel).toHaveBeenCalledOnce();
    expect(source.release).toHaveBeenCalledOnce();
  });

  it('cancels and releases when the consumer exits before done', async () => {
    const source = controlledStream();
    source.controller.enqueue(encoder.encode('data: {"chunk":"first","done":false}\n\n'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(source.response));
    for await (const event of streamAIChat({ message: 'Hi' })) {
      expect(event.chunk).toBe('first');
      break;
    }
    expect(source.cancel).toHaveBeenCalledOnce();
    expect(source.release).toHaveBeenCalledOnce();
  });

  it('releases the reader after a network failure midstream', async () => {
    const source = controlledStream();
    source.controller.enqueue(encoder.encode('data: {"chunk":"first","done":false}\n\n'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(source.response));
    const iterator = streamAIChat({ message: 'Hi' });
    await iterator.next();
    source.controller.error(new TypeError('Connection reset'));
    await expect(iterator.next()).rejects.toThrow('Connection reset');
    expect(source.cancel).toHaveBeenCalledOnce();
    expect(source.release).toHaveBeenCalledOnce();
  });
});
