import { describe, expect, it } from 'vitest';
import { planCopilotTools } from '@/lib/copilot-planner';
import { draftReplyPrompt } from './ChatWindow';

describe('a reply draft asks for wording only', () => {
  it('names the person and never asks the assistant to send, in either language', () => {
    const named = draftReplyPrompt('Elena Papadopoulos');
    expect(named.en).toContain('Elena Papadopoulos');
    expect(named.el).toContain('Elena Papadopoulos');
    expect(named.en).toContain('Do not send it.');
    expect(named.el).toContain('μην τη στείλεις');
    for (const text of [named.en, named.el]) {
      expect(planCopilotTools(text).map((tool) => tool.name)).not.toContain('start_or_send_message');
    }

    const unnamed = draftReplyPrompt('  ');
    expect(unnamed.en).not.toContain('to  ');
    for (const text of [unnamed.en, unnamed.el]) {
      expect(planCopilotTools(text).map((tool) => tool.name)).not.toContain('start_or_send_message');
    }
  });
});
