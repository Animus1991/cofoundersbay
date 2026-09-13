import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toToolCatalog } from '@cofounderbay/shared';
import { OllamaService } from './ollama.service';

/**
 * Covers the transport half of tool calling: whether the catalogue reaches the
 * model, and whether what it asks for survives a stream.
 *
 * Streaming is the interesting case. Ollama sends tool calls inside a streamed
 * message rather than as character deltas, and may send more than one such
 * message, so they are collected across the whole stream instead of the last
 * one winning. They are read back through `takeLastToolCalls`, which clears
 * them, because `chatStream` yields strings and every existing caller depends
 * on that signature.
 *
 * What this does not cover: a real Ollama server, or whether any particular
 * model honours a catalogue at all.
 */

function service(models: string[] = ['test-model']): OllamaService {
  const config = { get: (key: string) => (key === 'OLLAMA_MODEL' ? 'test-model' : undefined) };
  const instance = new OllamaService(config as never, { register: vi.fn() } as never);
  // Both guarded by `isAvailable`, which normally comes from a health check.
  Object.assign(instance, { isAvailable: true, availableModels: models });
  return instance;
}

/** One Ollama NDJSON stream, delivered in arbitrarily-chopped byte slices. */
function streamResponse(lines: unknown[], chunkSize = 7): Response {
  const payload = lines.map((line) => `${JSON.stringify(line)}\n`).join('');
  const bytes = new TextEncoder().encode(payload);
  let offset = 0;

  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => {
          if (offset >= bytes.length) return { done: true, value: undefined };
          const slice = bytes.slice(offset, offset + chunkSize);
          offset += chunkSize;
          return { done: false, value: slice };
        },
      }),
    },
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

function bodyOf(call: number = 0): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[call][1].body);
}

describe('offering the catalogue to the model', () => {
  it('omits tools entirely when none are supplied', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'hello' } }),
    } as unknown as Response);

    await service().chat([{ role: 'user', content: 'hi' }]);

    // The request has to stay byte-identical to before tools existed.
    expect(bodyOf()).not.toHaveProperty('tools');
  });

  it('omits tools when the catalogue is empty rather than sending []', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'hello' } }),
    } as unknown as Response);

    await service().chat([{ role: 'user', content: 'hi' }], { tools: [] });
    expect(bodyOf()).not.toHaveProperty('tools');
  });

  it('sends the catalogue on both the single-shot and streaming paths', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'hello' } }),
    } as unknown as Response);
    await service().chat([{ role: 'user', content: 'hi' }], { tools: toToolCatalog() });
    expect((bodyOf().tools as unknown[]).length).toBe(toToolCatalog().length);

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(streamResponse([{ message: { content: 'hi' } }, { done: true }]));
    for await (const _ of service().chatStream([{ role: 'user', content: 'hi' }], {
      tools: toToolCatalog(),
    })) {
      /* drain */
    }
    // chatStream used to build its body without ever looking at options.tools.
    expect((bodyOf().tools as unknown[]).length).toBe(toToolCatalog().length);
  });
});

describe('reading tool calls back off a stream', () => {
  it('collects calls from every message, not just the last', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        { message: { content: 'looking' } },
        { message: { tool_calls: [{ function: { name: 'get_graph', arguments: {} } }] } },
        { message: { content: ' and searching' } },
        {
          message: {
            tool_calls: [{ function: { name: 'search_people', arguments: { q: 'x' } } }],
          },
        },
        { done: true },
      ]),
    );

    const instance = service();
    const chunks: string[] = [];
    for await (const chunk of instance.chatStream([{ role: 'user', content: 'hi' }])) {
      chunks.push(chunk);
    }

    // Text still streams exactly as before.
    expect(chunks.join('')).toBe('looking and searching');

    const calls = instance.takeLastToolCalls() as Array<{ function: { name: string } }>;
    expect(calls.map((c) => c.function.name)).toEqual(['get_graph', 'search_people']);
  });

  it('survives the JSON being split across byte reads', async () => {
    // chunkSize 3 cuts through the middle of tokens and of the NDJSON newline.
    fetchMock.mockResolvedValue(
      streamResponse(
        [
          { message: { tool_calls: [{ function: { name: 'navigate', arguments: { href: '/matches' } } }] } },
          { done: true },
        ],
        3,
      ),
    );

    const instance = service();
    for await (const _ of instance.chatStream([{ role: 'user', content: 'hi' }])) {
      /* drain */
    }

    expect(instance.takeLastToolCalls()).toEqual([
      { function: { name: 'navigate', arguments: { href: '/matches' } } },
    ]);
  });

  it('clears the calls once read, so a later turn cannot inherit them', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        { message: { tool_calls: [{ function: { name: 'get_graph', arguments: {} } }] } },
        { done: true },
      ]),
    );

    const instance = service();
    for await (const _ of instance.chatStream([{ role: 'user', content: 'hi' }])) {
      /* drain */
    }

    expect(instance.takeLastToolCalls()).not.toBeNull();
    expect(instance.takeLastToolCalls()).toBeNull();
  });

  it('reports null when the model asked for nothing', async () => {
    fetchMock.mockResolvedValue(streamResponse([{ message: { content: 'just text' } }, { done: true }]));

    const instance = service();
    for await (const _ of instance.chatStream([{ role: 'user', content: 'hi' }])) {
      /* drain */
    }

    expect(instance.takeLastToolCalls()).toBeNull();
  });

  it('starts each stream clean even when the consumer stops early', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        { message: { tool_calls: [{ function: { name: 'get_graph', arguments: {} } }] } },
        { message: { content: 'more' } },
        { done: true },
      ]),
    );

    const instance = service();
    // Abandoning the generator runs its `finally`, which is where the calls are
    // published — and where the next stream's reset has to happen, since an
    // aborted stream never reaches the end of the loop.
    for await (const _ of instance.chatStream([{ role: 'user', content: 'hi' }])) {
      break;
    }
    expect(instance.takeLastToolCalls()).not.toBeNull();

    fetchMock.mockResolvedValue(streamResponse([{ message: { content: 'text only' } }, { done: true }]));
    for await (const _ of instance.chatStream([{ role: 'user', content: 'again' }])) {
      /* drain */
    }
    expect(instance.takeLastToolCalls()).toBeNull();
  });

  it('ignores a malformed tool_calls field instead of throwing', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        { message: { tool_calls: 'get_graph' } },
        { message: { tool_calls: null } },
        { message: { content: 'ok' } },
        { done: true },
      ]),
    );

    const instance = service();
    const chunks: string[] = [];
    for await (const chunk of instance.chatStream([{ role: 'user', content: 'hi' }])) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('ok');
    expect(instance.takeLastToolCalls()).toBeNull();
  });
});

describe('sending a tool result back', () => {
  /**
   * The other half of the loop. A turn that proposed is finished; the result of
   * the confirmed action arrives inside the history of the *next* turn, as a
   * `tool` message. These cover the wire shape, because Ollama names the field
   * `tool_name` and rejects unknown keys on a message.
   */

  it('maps a tool result onto the Ollama wire shape', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'done' } }),
    } as unknown as Response);

    await service().chat([
      { role: 'user', content: 'tick it' },
      { role: 'assistant', content: 'I can do that.' },
      { role: 'tool', content: '{"ok":true}', toolName: 'readiness.tickCriterion' },
    ]);

    const sent = bodyOf().messages as Array<Record<string, unknown>>;
    expect(sent.at(-1)).toEqual({
      role: 'tool',
      content: '{"ok":true}',
      tool_name: 'readiness.tickCriterion',
    });
  });

  it('omits tool_name when the caller did not name one', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'done' } }),
    } as unknown as Response);

    await service().chat([{ role: 'tool', content: '{}' }]);

    const sent = bodyOf().messages as Array<Record<string, unknown>>;
    expect(sent.at(-1)).toEqual({ role: 'tool', content: '{}' });
    expect(sent.at(-1)).not.toHaveProperty('tool_name');
  });

  it('leaves a conversation without tool results byte-identical to before the role existed', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'hi' } }),
    } as unknown as Response);

    await service().chat([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'hello' },
    ]);

    const sent = bodyOf().messages as Array<Record<string, unknown>>;
    expect(sent).toEqual([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'hello' },
    ]);
    expect(sent.every((m) => Object.keys(m).length === 2)).toBe(true);
  });

  it('carries a tool result through the streaming path too', async () => {
    fetchMock.mockResolvedValue(streamResponse([
      { message: { content: 'ok' }, done: false },
      { done: true },
    ]));

    const out: string[] = [];
    for await (const chunk of service().chatStream([
      { role: 'tool', content: '{"score":55}', toolName: 'readiness.tickCriterion' },
    ])) {
      out.push(chunk);
    }

    const sent = bodyOf().messages as Array<Record<string, unknown>>;
    expect(sent.at(-1)).toEqual({
      role: 'tool',
      content: '{"score":55}',
      tool_name: 'readiness.tickCriterion',
    });
    expect(out.join('')).toBe('ok');
  });
});
