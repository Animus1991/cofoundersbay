import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { builderApi } from '@/lib/builder-api';
import BuilderPage from './page';

vi.mock('@/lib/builder-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/builder-api')>();
  return {
    ...actual,
    builderApi: {
      ...actual.builderApi,
      getWorkspaces: vi.fn(),
      getWorkspace: vi.fn(),
      createWorkspace: vi.fn(),
    },
  };
});
// One object for every render: the provider copies `collaborators` into state
// whenever its identity changes, so a fresh [] each render never settles.
const socket = {
  isConnected: false, collaborators: [],
  joinWorkspace: vi.fn(), leaveWorkspace: vi.fn(), joinDocument: vi.fn(), leaveDocument: vi.fn(),
  startTyping: vi.fn(), stopTyping: vi.fn(), broadcastSectionUpdate: vi.fn(),
};
vi.mock('@/hooks/useBuilderSocket', () => ({ useBuilderSocket: () => socket }));
vi.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/builder/BuilderWorkspace', () => ({ BuilderWorkspace: () => <div>overview</div> }));
vi.mock('@/components/common/FirstRunTour', () => ({ FirstRunTour: () => null }));
vi.mock('@/components/behavioral/BehavioralNudge', () => ({ BehavioralNudge: () => null }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><BuilderPage /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
afterEach(() => { cleanup(); clients.splice(0).forEach((c) => c.clear()); });

// docs §79: the overview said "No documents yet" and offered "Create First
// Document" both when the read failed and when there was no workspace to put a
// document in; neither could work.
describe('/builder before there is a workspace', () => {
  it('says a failed read was not read, and tries again', async () => {
    vi.mocked(builderApi.getWorkspaces).mockRejectedValueOnce(new Error('Unable to reach the API server.'));
    mount();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/could not be read just now/);
    expect(screen.queryByText(/No documents yet/)).toBeNull();
    expect(screen.queryByText('Unable to reach the API server.')).toBeNull();
    vi.mocked(builderApi.getWorkspaces).mockResolvedValueOnce({ data: [] } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('button', { name: 'Create workspace' });
  });

  it('offers to create the workspace when there is none, and opens it', async () => {
    vi.mocked(builderApi.getWorkspaces).mockResolvedValue({ data: [] } as never);
    vi.mocked(builderApi.createWorkspace).mockResolvedValue({ id: 'ws-new', name: 'Helios', documents: [] } as never);
    mount();
    const create = await screen.findByRole('button', { name: 'Create workspace' });
    expect((create as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Startup or workspace name'), { target: { value: '  Helios ' } });
    fireEvent.click(create);
    await waitFor(() => expect(builderApi.createWorkspace).toHaveBeenCalledWith({ name: 'Helios', startupName: 'Helios' }));
    await screen.findByText('overview');
    // The workspace open here is the one /readiness scores.
    expect(localStorage.getItem('cfb_default_workspace')).toBe('ws-new');
  });
});
