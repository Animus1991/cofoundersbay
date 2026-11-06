import { describe, expect, it } from 'vitest';
import type { CopilotAction } from '@/lib/copilot-types';
import { bulkConfirmable } from './CopilotWorkspace';

const action = (tool: string, status: CopilotAction['status'] = 'pending') => ({ id: tool, tool, status }) as unknown as CopilotAction;

describe('Confirm all', () => {
  it('takes the cards that can be taken back', () => {
    const cards = [action('update_milestone_status'), action('set_theme')];
    expect(bulkConfirmable(cards)).toHaveLength(2);
  });

  it('leaves an irreversible card to be confirmed on its own', () => {
    // A scout run cannot be taken back.
    const ready = bulkConfirmable([action('set_theme'), action('run_scout')]).map((a) => a.tool);
    expect(ready).toEqual(['set_theme']);
  });

  it('skips what has already been decided', () => {
    expect(bulkConfirmable([action('set_theme', 'done'), action('set_language', 'dismissed')])).toEqual([]);
  });
});
