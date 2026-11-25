import { Suspense } from 'react';
import { Writable } from 'node:stream';
import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToPipeableStream } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from './I18nProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * The regression this pins (docs §138): the provider used to learn the stored
 * locale in a mount effect. A Greek reader's `locale` therefore flipped while
 * Next was still streaming the page, so when a deferred Suspense subtree —
 * `/settings`, `/messages`, `/search`, the auth shell — finally hydrated, its
 * hydration render ran `t()` in Greek over server HTML written in English and
 * React reported a mismatch. The locale now comes from `useSyncExternalStore`,
 * whose server snapshot React consults for *every* hydration pass, however late.
 *
 * To reproduce faithfully the test streams real SSR output with a pending
 * Suspense boundary, hydrates the shell (the moment the old code flipped), and
 * only then replays React's own `$RC` reveal script — the exact mechanism a
 * browser uses to swap streamed boundary content in — and lets React hydrate
 * the boundary against a provider whose stored locale is already Greek.
 */
function LanguageLabel() {
  const { t } = useI18n();
  return (
    <button type="button" aria-label={t('Language')}>
      {t('Language')}
    </button>
  );
}

type Gate = { open: boolean; promise: Promise<void>; resolve: () => void };
function makeGate(): Gate {
  let resolve: () => void = () => {};
  const gate: Gate = {
    open: false,
    promise: new Promise<void>((r) => {
      resolve = () => {
        gate.open = true;
        r();
      };
    }),
    resolve: () => resolve(),
  };
  return gate;
}

function renderSsrWithPendingBoundary(gate: Gate): Promise<string> {
  const tree = (
    <I18nProvider>
      <Suspense fallback={<p>pending</p>}>
        <Late gate={gate} />
      </Suspense>
    </I18nProvider>
  );
  return new Promise<string>((resolvePromise, reject) => {
    const chunks: string[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    });
    sink.on('finish', () => resolvePromise(chunks.join('')));
    sink.on('error', reject);
    const { pipe } = renderToPipeableStream(tree, {
      onShellReady() {
        pipe(sink);
        // The shell is already emitted; releasing the gate now lets React
        // stream the boundary's content segment after it, as Next does.
        gate.resolve();
      },
      onError: reject,
    });
  });
}

function Late({ gate }: { gate: Gate }) {
  if (!gate.open) throw gate.promise;
  return <LanguageLabel />;
}

function runStreamedScripts(container: HTMLElement) {
  // innerHTML leaves streamed <script> tags inert; a real browser executes
  // them. Eval each in order — the preamble defines $RC, later scripts call it
  // to splice the boundary content in and schedule its hydration retry.
  for (const script of Array.from(container.querySelectorAll('script'))) {
    const text = script.textContent ?? '';
    if (text.trim()) (0, eval)(text);
    script.remove();
  }
}

describe('I18nProvider late-boundary hydration', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders the stored locale only after hydration, so a Greek reader never mismatches', async () => {
    localStorage.setItem('cfb_locale', 'el');
    const gate = makeGate();
    const html = await renderSsrWithPendingBoundary(gate);
    expect(html).toContain('Language');

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    // innerHTML left the streamed <script> tags inert, so the boundary stays
    // pending until we replay them — after the shell has mounted.

    const errors: Error[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    const tree = (
      <I18nProvider>
        <Suspense fallback={<p>pending</p>}>
          <Late gate={gate} />
        </Suspense>
      </I18nProvider>
    );
    await act(async () => {
      root = hydrateRoot(container, tree, {
        onRecoverableError: (error) => errors.push(error instanceof Error ? error : new Error(String(error))),
      });
    });
    // The shell is hydrated; the stored locale has been read by every mounted
    // component by now (the old useState+effect provider had already flipped).
    expect(localStorage.getItem('cfb_locale')).toBe('el');

    // The streamed boundary arrives late — replay its reveal script, then let
    // React hydrate the boundary.
    runStreamedScripts(container);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(errors.map((e) => String(e.message ?? e)).join('\n---\n')).toBe('');
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    // After hydration the reader's stored Greek applies.
    expect(button!.textContent).toBe('Γλώσσα');
    await act(async () => {
      root.unmount();
    });
  });
});
