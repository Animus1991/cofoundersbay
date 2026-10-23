import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { ToastProvider } from '@/components/ui/toast';
import { RoleName } from '@/components/common/RoleName';
import { ProfileCard, type ProfileCardData } from './ProfileCard';

vi.mock('@/components/common/PersonHovercard', () => ({ PersonHovercard: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/ai/AIInsightButton', () => ({ AIInsightButton: () => null }));

afterEach(cleanup);

const elena: ProfileCardData = {
  id: 'p-elena',
  userId: 'user-elena',
  displayName: 'Elena Papadopoulos',
  role: 'founder',
  skills: ['Product'],
};

function renderCard(props: Partial<React.ComponentProps<typeof ProfileCard>>) {
  return render(
    <LanguagePreferenceProvider>
      <ToastProvider>
        <ProfileCard profile={elena} onConnect={vi.fn()} onMessage={vi.fn()} {...props} />
      </ToastProvider>
    </LanguagePreferenceProvider>,
  );
}

// docs §86: Explore offered a second Connect to someone whose request was
// waiting; the card's one action now follows where the connection stands.
describe('a person card and the connection', () => {
  it('offers Accept when their request waits', () => {
    const onAccept = vi.fn();
    renderCard({ connection: 'received', onAccept });
    fireEvent.click(screen.getByRole('button', { name: /Accept Elena Papadopoulos/ }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /^Connect/ })).toBeNull();
  });

  it('says a sent request rather than offering it again', () => {
    renderCard({ connection: 'sent' });
    expect((screen.getByRole('button', { name: /Request sent/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('leads with Message once connected', () => {
    renderCard({ connection: 'connected' });
    expect(screen.queryByRole('button', { name: /^Connect/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Message/ })).toBeTruthy();
  });

  it('keeps Connect without a state, as before', () => {
    renderCard({});
    expect(screen.getByRole('button', { name: /^Connect/ })).toBeTruthy();
  });
});

describe('a role written as text', () => {
  it('names the badge’s family, so a cofounder is a Founder everywhere', () => {
    render(<LanguagePreferenceProvider><RoleName role="cofounder" /></LanguagePreferenceProvider>);
    expect(screen.getByText('Founder')).toBeTruthy();
    expect(screen.queryByText('Cofounder')).toBeNull();
  });
});
