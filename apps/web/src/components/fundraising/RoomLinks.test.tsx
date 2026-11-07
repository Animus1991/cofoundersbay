import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoomLink, listRoomLinks, revokeRoomLink } from '@/lib/fundraising-api';
import { RoomLinks, roomLinkState } from './RoomLinks';

vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/lib/i18n/LanguagePreferenceContext', () => ({ useLanguagePreference: () => ({ primary: 'en' }) }));
vi.mock('@/lib/fundraising-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/fundraising-api')>()),
  createRoomLink: vi.fn(),
  listRoomLinks: vi.fn(),
  revokeRoomLink: vi.fn(),
}));

afterEach(cleanup);

const link = (over = {}) => ({ id: 'k1', label: 'For Irini', expiresAt: '2099-01-01T00:00:00Z', revokedAt: null, openCount: 3, lastOpenedAt: null, createdAt: '2026-11-07T00:00:00Z', ...over });
const mount = (sharedCount = 2) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RoomLinks sharedCount={sharedCount} /></QueryClientProvider>,
);

describe('a link without an account', () => {
  it('tells a revoked link from an ended one', () => {
    expect(roomLinkState(link())).toBe('open');
    expect(roomLinkState(link({ expiresAt: '2020-01-01T00:00:00Z' }))).toBe('ended');
    expect(roomLinkState(link({ revokedAt: '2026-11-07T00:00:00Z', expiresAt: '2020-01-01T00:00:00Z' }))).toBe('revoked');
  });

  it('shows the address once, after it is made', async () => {
    vi.mocked(listRoomLinks).mockResolvedValue([]);
    vi.mocked(createRoomLink).mockResolvedValue({ token: 'tok123', link: link() });
    mount();
    expect(screen.queryByLabelText('Data room link')).toBeNull();
    fireEvent.change(screen.getByLabelText('Who is it for'), { target: { value: ' Irini ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create link' }));
    await waitFor(() => expect(createRoomLink).toHaveBeenCalledWith({ label: 'Irini', days: 7 }));
    const field = await screen.findByLabelText('Data room link') as HTMLInputElement;
    expect(field.value).toMatch(/\/dd\/tok123$/);
    expect(screen.getByText('Copy it now. It is shown only this once.')).toBeTruthy();
  });

  it('will not make a link with nothing to show', () => {
    vi.mocked(listRoomLinks).mockResolvedValue([]);
    mount(0);
    expect((screen.getByRole('button', { name: 'Create link' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Share at least one file first.')).toBeTruthy();
  });

  it('revokes a live link, and offers nothing on one that is over', async () => {
    vi.mocked(listRoomLinks).mockResolvedValue([link(), link({ id: 'k2', label: 'Old', revokedAt: '2026-11-07T00:00:00Z' })]);
    vi.mocked(revokeRoomLink).mockResolvedValue([]);
    mount();
    const buttons = await screen.findAllByRole('button', { name: 'Revoke' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(vi.mocked(revokeRoomLink).mock.calls[0][0]).toBe('k1'));
    expect(screen.getByText('Revoked')).toBeTruthy();
  });
});
