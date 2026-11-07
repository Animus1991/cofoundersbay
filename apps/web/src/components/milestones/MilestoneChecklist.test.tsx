import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MILESTONE_STEP_LIMITS, readMilestoneSteps, stepsProgress, type MilestoneStep } from '@cofounderbay/shared';
import { MilestoneChecklist } from './MilestoneChecklist';

vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/lib/i18n/LanguagePreferenceContext', () => ({ useBilingualString: () => (en: string) => en }));

afterEach(cleanup);

const steps: MilestoneStep[] = [
  { id: 'a', text: 'Name the owner', done: true },
  { id: 'b', text: 'Book the review', done: false },
];

describe('the steps of a milestone', () => {
  it('counts what is done, and rounds', () => {
    expect(stepsProgress([])).toBe(0);
    expect(stepsProgress(steps)).toBe(50);
    expect(stepsProgress([...steps, { id: 'c', text: 'x', done: false }])).toBe(33);
  });

  it('keeps only a real list of steps', () => {
    expect(readMilestoneSteps([{ id: 'a', text: '  Trim me ', done: false }])).toEqual([{ id: 'a', text: 'Trim me', done: false }]);
    expect(readMilestoneSteps('steps')).toBeNull();
    expect(readMilestoneSteps([{ id: 'a', text: '   ', done: false }])).toBeNull();
    expect(readMilestoneSteps([{ id: 'a', text: 'x', done: 'yes' }])).toBeNull();
    expect(readMilestoneSteps([{ id: 'a', text: 'x', done: false }, { id: 'a', text: 'y', done: false }])).toBeNull();
    expect(readMilestoneSteps([{ id: 'a', text: 'x'.repeat(MILESTONE_STEP_LIMITS.text + 1), done: false }])).toBeNull();
    expect(readMilestoneSteps(Array.from({ length: MILESTONE_STEP_LIMITS.steps + 1 }, (_, i) => ({ id: `s${i}`, text: 'x', done: false })))).toBeNull();
  });

  it('stays one line until it is opened', () => {
    render(<MilestoneChecklist steps={steps} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Steps 1 of 2' }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Book the review')).toBeNull();
  });

  it('ticks, adds and removes, keeping the other steps', () => {
    const onChange = vi.fn();
    render(<MilestoneChecklist steps={steps} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Steps 1 of 2' }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Book the review' }));
    expect(onChange).toHaveBeenLastCalledWith([steps[0], { ...steps[1], done: true }]);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Send the deck ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const added = onChange.mock.lastCall?.[0] as MilestoneStep[];
    expect(added).toHaveLength(3);
    expect(added[2]).toMatchObject({ text: 'Send the deck', done: false });

    fireEvent.click(screen.getByRole('button', { name: /Name the owner/ }));
    expect(onChange).toHaveBeenLastCalledWith([steps[1]]);
  });

  it('offers to add the first step on a milestone with none', () => {
    render(<MilestoneChecklist steps={[]} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add steps' })).toBeTruthy();
  });
});
