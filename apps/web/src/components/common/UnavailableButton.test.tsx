import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { UnavailableButton, WithDisabledReason } from './UnavailableButton';

afterEach(cleanup);

describe('unavailable controls retain their explanation and semantics', () => {
  it('adds the unavailable reason without losing existing descriptions', () => {
    const onClick = vi.fn();
    render(
      <>
        <p id="scope">Only this organisation is affected.</p>
        <p id="policy">An owner must approve this change.</p>
        <WithDisabledReason reasonEn="Already on your board." reasonEl="Είναι ήδη στον πίνακα.">
          <Button aria-describedby="scope policy" onClick={onClick}>On board</Button>
        </WithDisabledReason>
      </>,
    );
    const button = screen.getByRole('button', { name: 'On board' });
    const ids = button.getAttribute('aria-describedby')!.split(/\s+/);
    expect(ids.slice(0, 2)).toEqual(['scope', 'policy']);
    expect(ids).toHaveLength(3);
    expect(document.getElementById(ids[2])?.textContent).toContain('Already on your board.');
    expect(button.hasAttribute('disabled')).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('updates its reason while retaining the original description and control', () => {
    const control = <Button aria-describedby="help">Save</Button>;
    const { rerender } = render(
      <WithDisabledReason reasonEn="Still loading." reasonEl="Φόρτωση.">{control}</WithDisabledReason>,
    );
    const first = screen.getByRole('button', { name: 'Save' });
    const describedBy = first.getAttribute('aria-describedby');
    rerender(
      <WithDisabledReason reasonEn="This record could not be read." reasonEl="Δεν ήταν δυνατή η ανάγνωση.">{control}</WithDisabledReason>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBe(first);
    expect(button.getAttribute('aria-describedby')).toBe(describedBy);
    const reasonId = describedBy!.split(/\s+/).at(-1)!;
    expect(document.getElementById(reasonId)?.textContent).toContain('This record could not be read.');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('keeps standalone unavailable actions visible and explicitly disabled', () => {
    render(<UnavailableButton en="Invite member" el="Πρόσκληση μέλους" reasonEn="Choose an organisation first." reasonEl="Επιλέξτε πρώτα οργανισμό." />);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    const reasonId = button.getAttribute('aria-describedby')!;
    expect(document.getElementById(reasonId)?.textContent).toContain('Choose an organisation first.');
  });
});
