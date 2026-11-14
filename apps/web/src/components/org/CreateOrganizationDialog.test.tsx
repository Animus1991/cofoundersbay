import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';
import { createOrganization } from '@/lib/api';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/api', () => ({ createOrganization: vi.fn() }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const renderDialog = () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const onClose = vi.fn();
  render(<QueryClientProvider client={client}><CreateOrganizationDialog open onClose={onClose} /></QueryClientProvider>);
  return { onClose };
};

describe('create organisation dialog', () => {
  it('derives the address from the name and refuses with the shared reader before sending', async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Θεσσαλονίκη Lab' } });
    expect((screen.getByLabelText(/Address on CoFounderBay/) as HTMLInputElement).value).toBe('thessaloniki-lab');
    fireEvent.click(screen.getByRole('button', { name: 'Create organisation' }));
    // No kind chosen: the reader refuses, nothing is sent.
    expect(await screen.findByText('Choose what kind of organisation this is.')).toBeTruthy();
    expect(createOrganization).not.toHaveBeenCalled();
  });

  it('keeps a typed address, and shows the server refusal under that field', async () => {
    vi.mocked(createOrganization).mockRejectedValue(Object.assign(new Error('Another organisation already uses this address. Choose another.'), {
      details: { field: 'slug', messageEl: 'Άλλος οργανισμός χρησιμοποιεί ήδη αυτή τη διεύθυνση.' },
    }));
    renderDialog();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Harbor Lab' } });
    fireEvent.change(screen.getByLabelText(/Address on CoFounderBay/), { target: { value: 'harbor' } });
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Harbor Lab Athens' } });
    expect((screen.getByLabelText(/Address on CoFounderBay/) as HTMLInputElement).value).toBe('harbor');
    fireEvent.change(document.querySelector('select')!, { target: { value: 'accelerator' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create organisation' }));
    await waitFor(() => expect(createOrganization).toHaveBeenCalledWith(expect.objectContaining({ slug: 'harbor', type: 'accelerator' })));
    const field = screen.getByLabelText(/Address on CoFounderBay/);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(await screen.findByText(/already uses this address/)).toBeTruthy();
  });

  it('creates and opens the new organisation’s admin page', async () => {
    vi.mocked(createOrganization).mockResolvedValue({ id: 'o1', slug: 'harbor-lab', name: 'Harbor Lab' });
    const { onClose } = renderDialog();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Harbor Lab' } });
    // Radix Select does not open in jsdom; the form reads the hidden native select.
    const native = document.querySelector('select') as HTMLSelectElement | null;
    expect(native).not.toBeNull();
    fireEvent.change(native!, { target: { value: 'incubator' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create organisation' }));
    await waitFor(() => expect(createOrganization).toHaveBeenCalledWith(expect.objectContaining({ name: 'Harbor Lab', slug: 'harbor-lab', type: 'incubator' })));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/org/harbor-lab/admin'));
    expect(onClose).toHaveBeenCalled();
  });
});
