import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import {
  currentPageControls,
  resetPageControlsForTests,
  usePageControls,
  type PageControl,
} from './page-controls';
import { executeAction, getActionSpec } from './action-registry';
import { pageControlFor } from './copilot-planner';
import { runCopilotTurn } from './copilot-engine';

/**
 * A page's own controls, offered to the assistant.
 *
 * What is asserted: a mounted page's controls are listed without their
 * handlers; the two capabilities run only their own kind, so `writes` on the
 * confirm card is never wrong; a choice is checked against the control's
 * options; the handler that runs is the page's current one; and the engine
 * matches a request to the control and choice it names, in either language,
 * without pressing anything on a passing mention.
 */

const STATUS = [
  { value: 'all', labelEn: 'Any status', labelEl: 'Οποιαδήποτε κατάσταση' },
  { value: 'active', labelEn: 'Active', labelEl: 'Ενεργός' },
  { value: 'suspended', labelEn: 'Suspended', labelEl: 'Σε αναστολή' },
];

function Page({ onSuspend }: { onSuspend: (id?: string) => void }) {
  const [status, setStatus] = useState('all');
  usePageControls([
    { id: 'status_filter', labelEn: 'Status filter', labelEl: 'Φίλτρο κατάστασης', writes: false, options: STATUS, current: status, run: (v) => setStatus(v ?? 'all') },
    { id: 'export_csv', labelEn: 'Export users as CSV', labelEl: 'Εξαγωγή χρηστών σε CSV', writes: false, run: () => undefined },
    {
      id: 'suspend_user',
      labelEn: 'Suspend user',
      labelEl: 'Αναστολή χρήστη',
      writes: true,
      options: [
        { value: 'u1', labelEn: 'Mike Johnson', labelEl: 'Mike Johnson' },
        { value: 'u2', labelEn: 'Mike Chen', labelEl: 'Mike Chen' },
      ],
      run: onSuspend,
    },
  ]);
  return <p data-testid="status">{status}</p>;
}

afterEach(() => {
  cleanup();
  resetPageControlsForTests();
});

describe('the page-control registry', () => {
  it('lists a mounted page’s controls without their handlers, and forgets them on unmount', () => {
    const view = render(<Page onSuspend={() => undefined} />);
    const listed = currentPageControls();
    expect(listed.map((c) => c.id)).toEqual(['status_filter', 'export_csv', 'suspend_user']);
    expect(listed.every((c) => !('run' in c))).toBe(true);
    expect(listed[0].current).toBe('all');
    view.unmount();
    expect(currentPageControls()).toEqual([]);
  });

  it('runs a view control through use_page_control and updates what it reports', async () => {
    const view = render(<Page onSuspend={() => undefined} />);
    await act(async () => {
      await expect(executeAction('use_page_control', { control: 'status_filter', value: 'suspended' })).resolves.toEqual({ ok: true });
    });
    expect(view.getByTestId('status').textContent).toBe('suspended');
    expect(currentPageControls()[0].current).toBe('suspended');
  });

  it('accepts an option by its label, as a model may name it', async () => {
    const view = render(<Page onSuspend={() => undefined} />);
    await act(async () => {
      await executeAction('use_page_control', { control: 'status_filter', value: 'Suspended' });
    });
    expect(view.getByTestId('status').textContent).toBe('suspended');
  });

  it('keeps the two kinds apart, so the confirm card’s warning is never wrong', async () => {
    const onSuspend = vi.fn();
    render(<Page onSuspend={onSuspend} />);
    expect(getActionSpec('use_page_control')?.writes).toBe(false);
    expect(getActionSpec('run_page_command')?.writes).toBe(true);

    const asView = await executeAction('use_page_control', { control: 'suspend_user', value: 'u1' });
    expect(asView.ok).toBe(false);
    expect(onSuspend).not.toHaveBeenCalled();

    const asCommand = await executeAction('run_page_command', { control: 'status_filter', value: 'active' });
    expect(asCommand.ok).toBe(false);

    await executeAction('run_page_command', { control: 'suspend_user', value: 'u1' });
    expect(onSuspend).toHaveBeenCalledWith('u1');
  });

  it('refuses a choice the control does not offer, and a control the page does not have', async () => {
    render(<Page onSuspend={() => undefined} />);
    await expect(executeAction('use_page_control', { control: 'status_filter', value: 'banned' })).resolves.toMatchObject({ ok: false });
    await expect(executeAction('use_page_control', { control: 'status_filter' })).resolves.toMatchObject({ ok: false });
    const missing = await executeAction('use_page_control', { control: 'nope' });
    expect(missing).toEqual({
      ok: false,
      error: 'This page has no "nope" control. It offers: Status filter, Export users as CSV.',
    });
  });

  it('runs the page’s current handler, not the one it registered with', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<Page onSuspend={first} />);
    view.rerender(<Page onSuspend={second} />);
    await executeAction('run_page_command', { control: 'suspend_user', value: 'u2' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('u2');
  });

  it('says why a control cannot run instead of running it', async () => {
    const run = vi.fn();
    const controls: PageControl[] = [
      { id: 'export_csv', labelEn: 'Export as CSV', labelEl: 'Εξαγωγή σε CSV', writes: false, unavailableEn: 'There is nothing to export.', run },
    ];
    function Empty() { usePageControls(controls); return null; }
    render(<Empty />);
    await expect(executeAction('use_page_control', { control: 'export_csv' })).resolves.toEqual({ ok: false, error: 'There is nothing to export.' });
    expect(run).not.toHaveBeenCalled();
  });
});

const LISTED = [
  { id: 'status_filter', label: 'Status filter', writes: false, options: [{ value: 'all', label: 'Any status' }, { value: 'suspended', label: 'Suspended' }] },
  { id: 'export_csv', label: 'Export users as CSV', writes: false },
  { id: 'suspend_user', label: 'Suspend user', writes: true, options: [{ value: 'u1', label: 'Mike Johnson' }, { value: 'u2', label: 'Mike Chen' }] },
];

describe('matching a request to a page control', () => {
  it('picks the control and the choice a request names', () => {
    expect(pageControlFor('show only suspended users', LISTED)).toMatchObject({ control: { id: 'status_filter' }, option: { value: 'suspended' } });
    expect(pageControlFor('suspend Mike Johnson', LISTED)).toMatchObject({ control: { id: 'suspend_user' }, option: { value: 'u1' } });
    expect(pageControlFor('export the users as csv', LISTED)).toMatchObject({ control: { id: 'export_csv' } });
  });

  it('needs every word of a row’s name, so "Mike" alone picks nobody', () => {
    expect(pageControlFor('suspend Mike', LISTED)).toBeUndefined();
  });

  it('understands Greek without accents getting in the way', () => {
    const greek = [{ id: 'status_filter', label: 'Φίλτρο κατάστασης', writes: false, options: [{ value: 'suspended', label: 'Σε αναστολή' }] }];
    expect(pageControlFor('δείξε μόνο όσους είναι σε αναστολη', greek)).toMatchObject({ option: { value: 'suspended' } });
  });

  it('does not press anything on a passing mention', () => {
    expect(pageControlFor('what does suspended mean?', LISTED)).toBeUndefined();
    expect(pageControlFor('users', LISTED)).toBeUndefined();
  });
});

describe('an assistant turn on a page with controls', () => {
  const context = { route: '/admin/users', locale: 'en', controls: LISTED };

  it('proposes a view control as use_page_control, with the choice', async () => {
    const turn = await runCopilotTurn('show only suspended users', context, { tools: [] });
    const card = turn.actions.find((a) => a.tool === 'use_page_control');
    expect(card?.payload).toEqual({ control: 'status_filter', value: 'suspended', label: 'Status filter: Suspended' });
    expect(card?.confirmLabel).toBe('Apply');
  });

  it('proposes a command that writes as run_page_command', async () => {
    const turn = await runCopilotTurn('suspend Mike Chen', context, { tools: [] });
    const card = turn.actions.find((a) => a.tool === 'run_page_command');
    expect(card?.payload).toMatchObject({ control: 'suspend_user', value: 'u2' });
    expect(card?.confirmLabel).toBe('Run');
  });

  it('says a filter is already set rather than proposing it again', async () => {
    const turn = await runCopilotTurn('show only suspended users', { ...context, controls: [{ ...LISTED[0], current: 'suspended' }] }, { tools: [] });
    expect(turn.actions).toEqual([]);
    expect(turn.message).toContain('Status filter is already set to Suspended.');
  });

  it('names what it can use when asked about the page', async () => {
    const turn = await runCopilotTurn('what can I do on this page?', context, { tools: [] });
    expect(turn.message).toContain('You can ask me to use: Status filter, Export users as CSV, Suspend user.');
  });
});
