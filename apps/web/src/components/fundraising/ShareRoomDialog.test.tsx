import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui/toast';
import { ShareRoomDialog, type ShareDoc, type ShareLead, type ShareRoomActions } from './ShareRoomDialog';

afterEach(cleanup);

const lead: ShareLead = { id: 'l1', name: 'Ada', firm: 'Aegean', account: null };
const doc: ShareDoc = { id: 'd1', name: 'Deck', shared: false, canShare: true, openedBy: [] };

function open(over: { leads?: ShareLead[]; docs?: ShareDoc[]; actions?: Partial<ShareRoomActions> } = {}) {
  const actions: ShareRoomActions = {
    search: vi.fn(async () => [{ id: 'm1', displayName: 'Nikos Andreou' }]),
    link: vi.fn(async () => undefined),
    share: vi.fn(async () => undefined),
    ...over.actions,
  };
  render(
    <ToastProvider>
      <ShareRoomDialog open onOpenChange={() => undefined} leads={over.leads ?? [lead]} docs={over.docs ?? [doc]} actions={actions} />
    </ToastProvider>,
  );
  return actions;
}

describe('sharing the data room', () => {
  it('finds a member and links the lead to them', async () => {
    const actions = open();
    fireEvent.click(screen.getByRole('button', { name: /Link account/ }));
    fireEvent.change(screen.getByRole('textbox', { name: /Search members/ }), { target: { value: 'ni' } });
    fireEvent.click(await screen.findByRole('button', { name: /Nikos Andreou/ }));
    await waitFor(() => expect(actions.link).toHaveBeenCalledWith('l1', expect.objectContaining({ id: 'm1' })));
  });

  it('removes a link', async () => {
    const actions = open({ leads: [{ ...lead, account: { id: 'm1', displayName: 'Nikos' } }] });
    expect(screen.getByText(/Linked to Nikos/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Remove link/ }));
    await waitFor(() => expect(actions.link).toHaveBeenCalledWith('l1', null));
  });

  it('shares and stops sharing a document', async () => {
    const actions = open();
    fireEvent.click(screen.getByRole('checkbox', { name: /Deck/ }));
    await waitFor(() => expect(actions.share).toHaveBeenCalledWith(['d1'], true));
  });

  it('says why a document without a file cannot be shared', () => {
    open({ docs: [{ ...doc, canShare: false }] });
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Upload a file for this document first/)).toBeTruthy();
  });

  it('names who opened a file', () => {
    open({ docs: [{ ...doc, shared: true, openedBy: ['Nikos', 'Maria'] }] });
    expect(screen.getByText(/Opened by Nikos, Maria/)).toBeTruthy();
  });

  it('points to the next step when there is nothing to work with', () => {
    open({ leads: [], docs: [] });
    expect(screen.getByText(/Add an investor to your pipeline first/)).toBeTruthy();
    expect(screen.getByText(/Upload a document first/)).toBeTruthy();
  });
});
