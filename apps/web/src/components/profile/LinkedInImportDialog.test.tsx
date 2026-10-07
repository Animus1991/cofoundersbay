import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromLinkedInRecords } from '@cofounderbay/shared';
import { LinkedInImportDialog } from './LinkedInImportDialog';

afterEach(cleanup);

const IMPORT = fromLinkedInRecords({
  profile: [{ 'First Name': 'Elena', 'Last Name': 'Papadopoulou', Headline: 'Founder, Harbor', 'Geo Location': 'Athens' }],
  positions: [{ 'Company Name': 'Harbor', Title: 'Co-founder', 'Started On': 'Jan 2024' }],
  skills: [{ Name: 'Sales' }, { Name: 'Underwater basket weaving' }, { Name: 'product management' }],
});

function renderDialog(onApply = vi.fn()) {
  localStorage.setItem('cfb_demo_data', '1');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LinkedInImportDialog
        open
        onOpenChange={() => undefined}
        current={{ displayName: '', headline: '', bio: 'Existing bio', location: '', websiteUrl: '', skills: ['Fundraising'] }}
        skillCatalog={['Sales', 'Product Management', 'Fundraising']}
        initial={IMPORT}
        onApply={onApply}
      />
    </QueryClientProvider>,
  );
  return onApply;
}

describe('LinkedInImportDialog', () => {
  it('previews only what it would fill, says which skills it leaves out, and fills only what is ticked', () => {
    const onApply = renderDialog();
    expect(screen.getByText('Elena Papadopoulou')).toBeTruthy();
    expect(screen.getByText('Sales, Product Management')).toBeTruthy();
    expect(screen.getByText(/1 LinkedIn skill is not in CoFounderBay’s list/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/^Headline/));
    fireEvent.click(screen.getByRole('button', { name: /Fill the form/ }));
    expect(onApply).toHaveBeenCalledWith({ displayName: 'Elena Papadopoulou', location: 'Athens', skills: ['Fundraising', 'Sales', 'Product Management'] });
  });

  it('adds positions to About only when asked', () => {
    const onApply = renderDialog();
    fireEvent.click(screen.getByLabelText(/Add my last 1 positions to About/));
    fireEvent.click(screen.getByRole('button', { name: /Fill the form/ }));
    expect(onApply.mock.calls[0][0].bio).toBe('Co-founder · Harbor (Jan 2024–)');
  });
});
