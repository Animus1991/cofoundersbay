import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { listMarketplaceServices } from '@/lib/api';
import { currentPageControls, currentPageLists, resetPageControlsForTests, resetPageListsForTests } from '@/lib/page-controls';
import MarketplacePage from './page';

vi.mock('@/lib/api', () => ({ listMarketplaceServices: vi.fn() }));
vi.mock('@/contexts/DemoDataContext', () => ({ useDemoData: () => ({ showDemoData: true }) }));
vi.mock('@/components/common/SampleDataNotice', () => ({ SampleDataNotice: () => null }));
// The rail's sections render as the open panel would, so its controls are
// tested where the reader finds them.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children, rail }: { children: React.ReactNode; rail?: { id: string; labelEn: string; content: React.ReactNode }[] }) => (
    <main>
      {children}
      {rail?.map((section) => <section key={section.id} aria-label={section.labelEn}>{section.content}</section>)}
    </main>
  ),
}));
// Greek, the language these wording rules are about.
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en, el }: { en: string; el?: string }) => <>{el ?? en}</> }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/marketplace',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><MarketplacePage /></QueryClientProvider>);
}
async function cardOf(name: string) {
  const person = await screen.findByText(name);
  return person.closest('[data-provider-card]') as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Nothing listed yet: the showcase's sample providers stand in.
  vi.mocked(listMarketplaceServices).mockResolvedValue({ services: [] } as unknown as Awaited<ReturnType<typeof listMarketplaceServices>>);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  resetPageControlsForTests();
  resetPageListsForTests();
});

describe('services page wording (§162)', () => {
  it('says whether a provider takes clients without naming anyone in a gender', async () => {
    const { container } = mount();
    expect(within(await cardOf('Alexandra Kosta')).getByText('Δέχεται νέους πελάτες')).toBeTruthy();
    expect(within(await cardOf('ByteCraft Studio')).getByText('Πλήρες πρόγραμμα')).toBeTruthy();
    expect(container.textContent).not.toMatch(/Διαθέσιμος|Πλήρης(?! )/);
  });

  it('says "featured" once, in the heading, not again on every featured card', async () => {
    mount();
    await cardOf('Alexandra Kosta');
    expect(screen.getAllByText('Προτεινόμενοι πάροχοι')).toHaveLength(1);
    expect(screen.queryByText('Προτεινόμενο')).toBeNull();
  });

  it('names categories and sort orders alike for the reader and the assistant', async () => {
    mount();
    await cardOf('Alexandra Kosta');
    const controls = currentPageControls();
    const category = controls.find((c) => c.id === 'category');
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(category?.options?.map((o) => o.labelEl)).toEqual(tabs);
    expect(tabs).toContain('Ανάπτυξη λογισμικού');

    const sort = controls.find((c) => c.id === 'sort');
    expect(sort?.options?.map((o) => o.labelEl)).toEqual(['Υψηλότερη βαθμολογία', 'Περισσότερες κριτικές', 'Περισσότεροι πελάτες']);
    const rail = screen.getByRole('region', { name: 'Sort & filters' });
    expect(within(rail).getByRole('combobox').textContent).toContain('Υψηλότερη βαθμολογία');

    // The switch, the card and the assistant's option share one phrase.
    expect(within(rail).getByRole('button', { pressed: false }).textContent).toBe('Μόνο όσοι δέχονται νέους πελάτες');
    const availability = controls.find((c) => c.id === 'availability');
    expect(availability?.options?.find((o) => o.value === 'available')?.labelEl).toBe('Μόνο όσοι δέχονται νέους πελάτες');
  });

  it('gives the assistant the card\'s words for category and state', async () => {
    mount();
    await cardOf('ByteCraft Studio');
    const rows = currentPageLists().find((l) => l.id === 'services')?.rowsEl ?? [];
    const bytecraft = rows.find((row) => row.includes('ByteCraft Studio'));
    expect(bytecraft).toContain('Ανάπτυξη λογισμικού');
    // The row is longer than the 110 characters a row may carry: it loses
    // its middle, and the state written last still arrives.
    expect(bytecraft).toMatch(/ · … · πλήρες πρόγραμμα$/);
  });

  it('tells an empty result by the category\'s name, not its key', async () => {
    mount();
    await cardOf('Alexandra Kosta');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Νομικά' }), { button: 0 });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzzz' } });
    const empty = await screen.findByText(/Τίποτα δεν ταιριάζει/);
    expect(empty.textContent).toContain('Νομικά');
    expect(empty.textContent).not.toContain('legal');
  });
});
