import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME_ASK } from '@/lib/home-ask';
import { HomeAskHero } from './HomeAskHero';

const state = vi.hoisted(() => ({
  pathname: '/dashboard',
  push: vi.fn(),
  ask: vi.fn(),
  popup: true,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: state.push }),
}));
vi.mock('@/contexts/PopupChatContext', () => ({
  usePopupChatOptional: () => (state.popup ? { ask: state.ask } : null),
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/icons/CfbGlyph', () => ({ CfbGlyph: () => <span aria-hidden="true" /> }));

/** Radix menus go through Popper and pointer capture, which jsdom lacks (see UserMenu.test). */
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

beforeEach(() => {
  state.pathname = '/dashboard';
  state.popup = true;
  state.push.mockReset();
  state.ask.mockReset();
  localStorage.clear();
});
afterEach(() => cleanup());

const box = () => screen.getByRole('textbox');
const openMenu = (name: RegExp) => {
  const trigger = screen.getByRole('button', { name });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return screen.getByRole('menu');
};

describe('HomeAskHero', () => {
  it('greets by name over one question box', () => {
    render(<HomeAskHero role="founder" name="Alex" lead={{ en: 'Here is your week.', el: 'Η εβδομάδα σας.' }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/, Alex$/);
    expect(screen.getByText('Here is your week.')).toBeTruthy();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('keeps Send off until there is a question, then Enter sends it to the assistant', () => {
    render(<HomeAskHero role="founder" name="Alex" />);
    const send = screen.getByRole('button', { name: /^Send/ }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(box(), { target: { value: '  Who should I talk to first?  ' } });
    expect(send.disabled).toBe(false);
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(state.ask).toHaveBeenCalledWith('Who should I talk to first?');
    expect((box() as HTMLTextAreaElement).value).toBe('');
  });

  it('starts a new line on Shift+Enter and waits while an input method is composing', () => {
    render(<HomeAskHero role="founder" name="Alex" />);
    fireEvent.change(box(), { target: { value: 'Two lines' } });
    fireEvent.keyDown(box(), { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    expect(state.ask).not.toHaveBeenCalled();
  });

  it('says the chosen scope in the question', () => {
    render(<HomeAskHero role="founder" name="Alex" />);
    const menu = openMenu(/^About: Everything/);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Matches' }));
    fireEvent.change(box(), { target: { value: 'Who replied?' } });
    fireEvent.submit(box().closest('form')!);
    expect(state.ask).toHaveBeenCalledWith('About my matches: Who replied?');
  });

  it('sends a chip’s question, and a chip menu’s item', () => {
    render(<HomeAskHero role="founder" name="Alex" />);
    const mentor = HOME_ASK.founder.actions.find((a) => a.id === 'mentor')!;
    fireEvent.click(screen.getByRole('button', { name: mentor.en }));
    expect(state.ask).toHaveBeenLastCalledWith(mentor.prompt!.en);

    const cofounder = HOME_ASK.founder.actions.find((a) => a.id === 'cofounder')!;
    const menu = openMenu(new RegExp(cofounder.en));
    const item = cofounder.items![1];
    fireEvent.click(within(menu).getByRole('menuitem', { name: item.en }));
    expect(state.ask).toHaveBeenLastCalledWith(item.prompt!.en);
  });

  it('opens the assistant page when there is no chat window to ask', () => {
    state.popup = false;
    render(<HomeAskHero role="investor" name="Irini" />);
    fireEvent.change(box(), { target: { value: 'Which founders replied?' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(state.push).toHaveBeenCalledWith(`/ai?q=${encodeURIComponent('Which founders replied?')}`);
  });

  it('gives every role a box, scopes and at least three starting points', () => {
    for (const role of Object.keys(HOME_ASK) as Array<keyof typeof HOME_ASK>) {
      const { scopes, actions } = HOME_ASK[role];
      expect(scopes[0]?.id).toBe('all');
      expect(actions.length).toBeGreaterThanOrEqual(3);
      for (const action of actions) {
        // Every chip either asks, opens a page, or opens a menu of those.
        expect(Boolean(action.prompt || action.href || action.items?.length)).toBe(true);
        for (const item of action.items ?? []) expect(Boolean(item.prompt || item.href)).toBe(true);
      }
    }
  });
});
