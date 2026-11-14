import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AbuseMonitorPanel } from './AbuseMonitorPanel';
import { adminGetAbuseStats, adminListAbuseFlags, adminResolveAbuseFlag, adminRunRingDetection } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  adminListAbuseFlags: vi.fn(),
  adminGetAbuseStats: vi.fn(),
  adminResolveAbuseFlag: vi.fn(),
  adminRunRingDetection: vi.fn(),
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));
const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('@/components/ui/toast', () => ({ useToast: () => toast }));

const flag = {
  id: 'flag-1', userId: 'user-spyros', email: 'spyros@example.com', displayName: 'Spyros', type: 'burst_spam',
  severity: 0.7, status: 'pending', description: 'Twelve posts in a minute', actionTaken: null, createdAt: '2026-11-01T10:00:00Z',
};
const stats = { totalFlags: 1, pendingFlags: 1, actionedFlags: 0, dismissedFlags: 0, byType: {}, topOffenders: [] };

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('abuse console', () => {
  it('says a failed read failed instead of "nothing flagged", and retries', async () => {
    vi.mocked(adminListAbuseFlags).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ flags: [], total: 0 } as never);
    vi.mocked(adminGetAbuseStats).mockResolvedValue(stats as never);
    render(<AbuseMonitorPanel />);
    expect((await screen.findByRole('alert')).textContent).toContain('could not be read');
    expect(screen.queryByText('Nothing is waiting for review.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Nothing is waiting for review.')).toBeTruthy();
  });

  it('names what closing records and sends one request per choice', async () => {
    vi.mocked(adminListAbuseFlags).mockResolvedValue({ flags: [flag], total: 1 } as never);
    vi.mocked(adminGetAbuseStats).mockResolvedValue(stats as never);
    vi.mocked(adminResolveAbuseFlag).mockResolvedValue(undefined as never);
    render(<AbuseMonitorPanel />);
    const trigger = await screen.findByRole('button', { name: /Close the flag on Spyros/ });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const safe = await screen.findByRole('menuitem', { name: /Dismiss as safe/ });
    expect(screen.queryByRole('menuitem', { name: /Send Warning/ })).toBeNull();
    fireEvent.click(safe);
    await waitFor(() => expect(adminResolveAbuseFlag).toHaveBeenCalledWith('flag-1', 'safe', 'dismissed'));
  });

  it('runs the endorsement ring scan and reloads', async () => {
    vi.mocked(adminListAbuseFlags).mockResolvedValue({ flags: [], total: 0 } as never);
    vi.mocked(adminGetAbuseStats).mockResolvedValue(stats as never);
    vi.mocked(adminRunRingDetection).mockResolvedValue({ flagsCreated: 0, detections: [] });
    render(<AbuseMonitorPanel />);
    await screen.findByText('Nothing is waiting for review.');
    fireEvent.click(screen.getByRole('button', { name: /Scan for endorsement rings/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Endorsement scan finished', 'No new endorsement rings were found.'));
    expect(adminListAbuseFlags).toHaveBeenCalledTimes(2);
  });
});
