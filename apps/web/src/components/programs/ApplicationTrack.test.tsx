import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ApplicationTrack, applicationTrack } from './ApplicationTrack';

vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));

afterEach(cleanup);

describe('where an application stands', () => {
  it('moves along the four steps with the status the organiser sets', () => {
    expect(['applied', 'accepted', 'active', 'completed'].map((status) => applicationTrack(status)?.reached)).toEqual([0, 1, 2, 3]);
  });

  it('says a no as a stop on the step it came at, not as progress', () => {
    expect(applicationTrack('rejected')).toMatchObject({ reached: 1, stopped: true });
    expect(applicationTrack('dropped')).toMatchObject({ reached: 2, stopped: true });
  });

  it('shows nothing for a status it does not know', () => {
    expect(applicationTrack('someday')).toBeNull();
    expect(applicationTrack(undefined)).toBeNull();
    const { container } = render(<ApplicationTrack status={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('marks the current step for a screen reader', () => {
    render(<ApplicationTrack status="accepted" />);
    expect(screen.getByText('Decision').closest('li')?.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('Accepted. The programme starts next.')).toBeTruthy();
  });
});
