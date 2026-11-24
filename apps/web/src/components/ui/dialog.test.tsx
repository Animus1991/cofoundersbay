import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { ConfirmDialog } from './confirm-dialog';

afterEach(cleanup);

// B1.5: every dialog header can carry a h-11 w-11 rounded-2xl tinted well
// naming the verb, and ConfirmDialog picks its well from the variant.
describe('DialogHeader icon well', () => {
  it('renders the well in the given tone left of the title', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader icon={Info} tone="accent">
            <DialogTitle>About this</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const well = document.querySelector('[data-keep-icon]') as HTMLElement;
    expect(well).not.toBeNull();
    expect(well.className).toContain('h-11');
    expect(well.className).toContain('w-11');
    expect(well.className).toContain('rounded-2xl');
    expect(well.className).toContain('bg-status-accent-bg');
  });

  it('renders no well without an icon', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plain</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(document.querySelector('[data-keep-icon]')).toBeNull();
  });
});

describe('ConfirmDialog well', () => {
  it('uses the danger tone for destructive confirmations', () => {
    render(
      <ConfirmDialog open title="Delete" variant="destructive" onOpenChange={() => {}} onConfirm={() => {}} />,
    );
    expect(document.querySelector('[data-keep-icon]')?.className).toContain('bg-status-danger-bg');
  });

  it('uses the primary tone otherwise', () => {
    render(
      <ConfirmDialog open title="Archive" variant="default" onOpenChange={() => {}} onConfirm={() => {}} />,
    );
    expect(document.querySelector('[data-keep-icon]')?.className).toContain('bg-primary/10');
  });
});
