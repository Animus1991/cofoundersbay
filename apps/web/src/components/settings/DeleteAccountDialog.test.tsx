import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui/toast';
import { deleteAccount, getAccountDeletion, type AccountDeletionPreview } from '@/lib/api';
import { DeleteAccountDialog } from './DeleteAccountDialog';

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getAccountDeletion: vi.fn(),
  deleteAccount: vi.fn(async () => undefined),
}));

const preview = (over: Partial<AccountDeletionPreview> = {}): AccountDeletionPreview => ({
  confirmWith: 'password',
  needsCode: false,
  blockers: [],
  counts: { dataRoomFiles: 2, uploads: 0, groupsHandedOver: 1, groupsRemoved: 0, sharedWorkspaces: 0, rounds: 1 },
  ...over,
});

function open() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider><DeleteAccountDialog open onOpenChange={() => undefined} /></ToastProvider>
    </QueryClientProvider>,
  );
}

const submit = () => screen.getByRole('button', { name: /Delete my account/ }) as HTMLButtonElement;

beforeEach(() => vi.mocked(deleteAccount).mockClear());
afterEach(cleanup);

describe('deleting an account', () => {
  it('says what will go before asking', async () => {
    vi.mocked(getAccountDeletion).mockResolvedValue(preview());
    open();
    expect(await screen.findByText(/2 data room files are deleted/)).toBeTruthy();
    expect(screen.getByText(/One group passes to its next member/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Export your data/ }).getAttribute('href')).toBe('/settings/data-export');
  });

  it('waits for the password and the acknowledgement', async () => {
    vi.mocked(getAccountDeletion).mockResolvedValue(preview());
    open();
    const password = await screen.findByLabelText(/Your password/);
    expect(submit().disabled).toBe(true);
    fireEvent.change(password, { target: { value: 'secret' } });
    expect(submit().disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit().disabled).toBe(false);
  });

  it('sends what the account confirms with', async () => {
    vi.mocked(getAccountDeletion).mockResolvedValue(preview({ confirmWith: 'email', needsCode: true }));
    open();
    fireEvent.change(await screen.findByLabelText(/Type your email/), { target: { value: 'me@example.com' } });
    fireEvent.change(screen.getByLabelText(/authenticator/), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(submit());
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith({ password: undefined, email: 'me@example.com', code: '123456' }));
  });

  it('explains what stands in the way, and offers no delete', async () => {
    vi.mocked(getAccountDeletion).mockResolvedValue(preview({ blockers: [{ code: 'organization_has_members', organizations: ['Aegean Lab'] }] }));
    open();
    expect((await screen.findByRole('alert')).textContent).toContain('Aegean Lab');
    expect(screen.queryByRole('button', { name: /Delete my account/ })).toBeNull();
  });
});
