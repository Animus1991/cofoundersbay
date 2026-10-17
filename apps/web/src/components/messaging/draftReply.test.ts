import { describe, expect, it } from 'vitest';
import { planCopilotTools } from '@/lib/copilot-planner';
import { draftReplyPrompt } from './ChatWindow';

describe('a reply draft asks for wording only', () => {
  it('names the person and never asks the assistant to send', () => {
    const named = draftReplyPrompt('Elena Papadopoulos');
    expect(named).toContain('Elena Papadopoulos');
    expect(named).toContain('Do not send it.');
    expect(planCopilotTools(named).map((tool) => tool.name)).not.toContain('start_or_send_message');

    const unnamed = draftReplyPrompt('  ');
    expect(unnamed).not.toContain('to  ');
    expect(planCopilotTools(unnamed).map((tool) => tool.name)).not.toContain('start_or_send_message');
  });
});
