import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { onRadioGroupKeyDown, radioTabIndex } from './radio-keys';

function Group({ select = true, onPick = vi.fn() }: { select?: boolean; onPick?: (v: string) => void }) {
  const [value, setValue] = useState('b');
  const options = ['a', 'b', 'c'];
  return (
    <div role="radiogroup" aria-label="Pick" onKeyDown={(e) => onRadioGroupKeyDown(e, { select })}>
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          tabIndex={radioTabIndex(value === o, i, true)}
          onClick={() => { setValue(o); onPick(o); }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

afterEach(cleanup);

describe('a radio group built from buttons', () => {
  it('has one tab stop, the chosen option', () => {
    render(<Group />);
    expect(screen.getByRole('radio', { name: 'b' }).tabIndex).toBe(0);
    expect(screen.getByRole('radio', { name: 'a' }).tabIndex).toBe(-1);
    expect(radioTabIndex(false, 0, false)).toBe(0);
  });

  it('moves and chooses with the arrows, wrapping, and Home/End', () => {
    render(<Group />);
    const b = screen.getByRole('radio', { name: 'b' });
    b.focus();
    fireEvent.keyDown(b, { key: 'ArrowRight' });
    expect(document.activeElement?.textContent).toBe('c');
    expect(screen.getByRole('radio', { name: 'c' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('a');
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement?.textContent).toBe('c');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement?.textContent).toBe('b');
  });

  it('only moves, without choosing, where a choice is sent at once', () => {
    const onPick = vi.fn();
    render(<Group select={false} onPick={onPick} />);
    const b = screen.getByRole('radio', { name: 'b' });
    b.focus();
    fireEvent.keyDown(b, { key: 'ArrowRight' });
    expect(document.activeElement?.textContent).toBe('c');
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'b' }).getAttribute('aria-checked')).toBe('true');
  });
});
