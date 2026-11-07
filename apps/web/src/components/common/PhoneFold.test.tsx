import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PhoneFold } from './PhoneFold';

vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));

afterEach(() => { cleanup(); window.location.hash = ''; });

describe('a long section on a phone', () => {
  it('keeps what is inside mounted while closed', () => {
    render(<PhoneFold title={{ en: 'Privacy', el: 'Απόρρητο' }}><input aria-label="Field" defaultValue="typed" /></PhoneFold>);
    expect(screen.getByRole('button', { name: 'Privacy' }).getAttribute('aria-expanded')).toBe('false');
    expect((screen.getByLabelText('Field') as HTMLInputElement).value).toBe('typed');
  });

  it('opens and closes with a press', () => {
    const { container } = render(<PhoneFold title={{ en: 'Privacy', el: 'Απόρρητο' }}>x</PhoneFold>);
    fireEvent.click(screen.getByRole('button', { name: 'Privacy' }));
    expect(container.querySelector('[data-phone-fold="open"]')).not.toBeNull();
  });

  it('opens by itself when a link points inside it', () => {
    window.location.hash = '#privacy';
    const { container } = render(<PhoneFold title={{ en: 'Privacy', el: 'Απόρρητο' }} anchor="privacy">x</PhoneFold>);
    expect(container.querySelector('[data-phone-fold="open"]')).not.toBeNull();
  });

  it('opens when the link is followed later', () => {
    const { container } = render(<PhoneFold title={{ en: 'Privacy', el: 'Απόρρητο' }} anchor="privacy">x</PhoneFold>);
    expect(container.querySelector('[data-phone-fold="closed"]')).not.toBeNull();
    act(() => {
      window.location.hash = '#privacy';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(container.querySelector('[data-phone-fold="open"]')).not.toBeNull();
  });
});
