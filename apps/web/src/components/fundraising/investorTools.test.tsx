import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { capTableShares, readCapTable, type CapTableHolder } from '@cofounderbay/shared';
import { investorEmailDraft, mailtoHref } from '@/lib/investor-email';
import { CapTableView } from './CapTableView';
import { InvestorEmailDialog } from './InvestorEmailDialog';

vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/lib/i18n/LanguagePreferenceContext', () => ({ useLanguagePreference: () => ({ primary: 'en' }) }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

afterEach(cleanup);

const holders: CapTableHolder[] = [
  { id: 'a', name: 'Alex Demo', kind: 'founder', shares: 750 },
  { id: 'b', name: 'Option pool', kind: 'pool', shares: 250 },
];

describe('a note to an investor', () => {
  it('starts from the step the founder wrote, in the reader\'s language', () => {
    const el = investorEmailDraft({ name: 'Irini Kosta', nextStep: 'Στείλτε το deck' }, 'Alex Demo', 'el');
    expect(el.subject).toBe('Επόμενο βήμα: Στείλτε το deck');
    expect(el.body).toContain('Καλησπέρα Irini Kosta,');
    expect(el.body).toContain('Alex Demo');
    expect(investorEmailDraft({ name: 'Irini' }, null, 'en').subject).toBe('A short update');
  });

  it('claims no meeting, figure or promise', () => {
    const { body } = investorEmailDraft({ name: 'Irini' }, 'Alex', 'en');
    expect(body).not.toMatch(/\d|committed|agreed|meeting/i);
  });

  it('survives what a mail link cannot hold raw', () => {
    const href = mailtoHref({ to: ' a@b.co ', subject: 'Next & last?', body: 'one\n\ntwo' });
    expect(href).toBe('mailto:a%40b.co?subject=Next%20%26%20last%3F&body=one%0A%0Atwo');
  });

  it('says it sends nothing, and keeps what the assistant wrote', () => {
    render(<InvestorEmailDialog target={{ name: 'Irini', subject: 'Written', body: 'By the assistant' }} sender="Alex" onClose={vi.fn()} />);
    expect(screen.getByText('It opens in your own mail app. Nothing is sent from here.')).toBeTruthy();
    expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('Written');
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('By the assistant');
  });

  it('opens nothing without a target', () => {
    render(<InvestorEmailDialog target={null} sender={null} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('Subject')).toBeNull();
  });
});

describe('the cap table', () => {
  it('works the percentages out of the shares', () => {
    expect(capTableShares(holders).map((holder) => holder.share)).toEqual([0.75, 0.25]);
    expect(capTableShares([])).toEqual([]);
  });

  it('keeps only a real list of holders', () => {
    expect(readCapTable(holders)).toEqual(holders);
    expect(readCapTable('nope')).toBeNull();
    expect(readCapTable([{ ...holders[0], shares: 0 }])).toBeNull();
    expect(readCapTable([{ ...holders[0], kind: 'wizard' }])).toBeNull();
    expect(readCapTable([{ ...holders[0], name: '  ' }])).toBeNull();
  });

  it('adds a holder and removes one, keeping the rest', async () => {
    const onSave = vi.fn(async () => undefined);
    render(<CapTableView holders={holders} onSave={onSave} />);
    expect(screen.getByText(/75\s*%/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Holder'), { target: { value: ' Athens Angels ' } });
    fireEvent.change(screen.getByLabelText('Shares'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const added = (onSave.mock.calls as unknown as CapTableHolder[][][])[0][0];
    expect(added).toHaveLength(3);
    expect(added[2]).toMatchObject({ name: 'Athens Angels', kind: 'founder', shares: 100 });

    fireEvent.click(screen.getByRole('button', { name: /Option pool/ }));
    await waitFor(() => expect(onSave).toHaveBeenLastCalledWith([holders[0]]));
  });

  it('keeps the typed row when the save fails', async () => {
    const onSave = vi.fn(async () => { throw new Error('down'); });
    render(<CapTableView holders={[]} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Holder'), { target: { value: 'Alex' } });
    fireEvent.change(screen.getByLabelText('Shares'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect((screen.getByLabelText('Holder') as HTMLInputElement).value).toBe('Alex');
  });
});
