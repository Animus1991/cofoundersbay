import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

afterEach(cleanup);

// docs §73: Radix leaves an inactive panel in the document with the `hidden`
// attribute, and a display utility on the panel outranks the attribute. The
// empty Chats panel on /messages stayed in the column as a flex-1 block and
// pushed the Intros list down to its middle.
describe('an inactive tab panel', () => {
  it('is hidden in its own classes, whatever display the page gives it', () => {
    const { container } = render(
      <Tabs value="intros">
        <TabsList>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="intros">Intros</TabsTrigger>
        </TabsList>
        <TabsContent value="chats" className="mt-0 flex min-h-0 flex-1 flex-col">chats</TabsContent>
        <TabsContent value="intros" className="mt-0 flex-1">intros</TabsContent>
      </Tabs>,
    );
    const chats = container.querySelector('[role="tabpanel"][data-state="inactive"]') as HTMLElement;
    expect(chats).not.toBeNull();
    expect(chats.className.split(/\s+/)).toEqual(expect.arrayContaining(['flex', 'data-[state=inactive]:hidden']));
    const intros = container.querySelector('[role="tabpanel"][data-state="active"]') as HTMLElement;
    expect(intros.textContent).toBe('intros');
  });
});
