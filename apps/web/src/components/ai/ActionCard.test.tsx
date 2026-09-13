import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { getActionSpec } from '@/lib/action-registry';
import type { CopilotAction, CopilotActionStatus, CopilotActionTool } from '@/lib/copilot-types';
import { ActionCard } from './ActionCard';

/**
 * The registry knows which writes can be taken back. This asserts the user is
 * told before committing, rather than discovering it afterwards -- the case
 * that matters being `send_connection`, which notifies the recipient
 * immediately and has no sender-side withdraw route.
 */

function action(
  tool: CopilotActionTool,
  status: CopilotActionStatus = 'pending',
  payload: Record<string, unknown> = {},
): CopilotAction {
  return {
    id: `a-${tool}`,
    tool,
    title: `Title for ${tool}`,
    description: '',
    confirmLabel: 'Confirm',
    payload,
    status,
    href: '/somewhere',
  };
}

function renderCard(a: CopilotAction, onUndo?: (x: CopilotAction) => void) {
  return render(
    <LanguagePreferenceProvider>
      <ActionCard action={a} onConfirm={vi.fn()} onDismiss={vi.fn()} onUndo={onUndo} />
    </LanguagePreferenceProvider>,
  );
}

afterEach(cleanup);

describe('ActionCard reversibility', () => {
  it('warns, before confirming, that an intro cannot be taken back', () => {
    renderCard(action('send_connection', 'pending', { receiverId: 'u1' }));

    const expected = getActionSpec('send_connection')?.reversal?.explanation;
    expect(expected?.en).toBeTruthy();
    expect(screen.getByText(expected!.en)).toBeTruthy();

    // Still offers the action: this is a warning, not a removal of capability.
    expect(screen.getByRole('button', { name: /Confirm/ })).toBeTruthy();
  });

  it('states the reversible case without dressing it as a warning', () => {
    renderCard(action('shortlist_add', 'pending', { userId: 'u1' }));

    const expected = getActionSpec('shortlist_add')?.reversal?.explanation;
    expect(screen.getByText(expected!.en)).toBeTruthy();
  });

  it('says nothing about reversal for an action that writes nothing', () => {
    renderCard(action('navigate', 'pending', { href: '/matches' }));

    const navReversal = getActionSpec('navigate')?.reversal?.explanation;
    expect(navReversal?.en).toBeTruthy();
    // Declared in the registry, deliberately not rendered: `navigate` does not
    // write, so the line would appear on every card carrying no information.
    expect(screen.queryByText(navReversal!.en)).toBeNull();
  });

  it('offers Undo once an undoable action has run', () => {
    const onUndo = vi.fn();
    renderCard(action('shortlist_add', 'done', { userId: 'u1' }), onUndo);

    const undo = screen.getByRole('button', { name: /Undo|Αναίρεση/ });
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('offers no Undo for a write that cannot be reversed', () => {
    renderCard(action('send_connection', 'done', { receiverId: 'u1' }), vi.fn());

    expect(screen.queryByRole('button', { name: /Undo|Αναίρεση/ })).toBeNull();
    // The completed state is still reported.
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('offers no Undo when the caller supplies no handler', () => {
    renderCard(action('shortlist_add', 'done', { userId: 'u1' }));
    expect(screen.queryByRole('button', { name: /Undo|Αναίρεση/ })).toBeNull();
  });

  it('reports an undone action distinctly from a dismissed one', () => {
    renderCard(action('shortlist_add', 'undone', { userId: 'u1' }), vi.fn());
    expect(screen.getByText('Undone')).toBeTruthy();
    expect(screen.queryByText('Dismissed')).toBeNull();

    cleanup();

    renderCard(action('shortlist_add', 'dismissed', { userId: 'u1' }), vi.fn());
    expect(screen.getByText('Dismissed')).toBeTruthy();
    expect(screen.queryByText('Undone')).toBeNull();
  });

  it('keeps the intro note visible so the user confirms what is actually sent', () => {
    renderCard(action('send_connection', 'pending', { receiverId: 'u1', message: 'Hi there' }));
    expect(screen.getByText('“Hi there”')).toBeTruthy();
  });
});
