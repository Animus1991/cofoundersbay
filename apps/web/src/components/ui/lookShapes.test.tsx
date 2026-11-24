import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './button';
import { Badge } from './badge';
import { Tabs, TabsList, TabsTrigger } from './tabs';

afterEach(cleanup);

// B1.3 shapes: pill buttons, a muted pill strip with a solid active tab,
// and the status badge variants.
describe('button shape', () => {
  it('is a pill on every variant except link', () => {
    for (const variant of ['default', 'secondary', 'ghost', 'outline', 'destructive'] as const) {
      const { container, unmount } = render(<Button variant={variant}>go</Button>);
      expect(container.firstElementChild?.className).toContain('rounded-full');
      unmount();
    }
    const { container } = render(<Button variant="link">go</Button>);
    expect(container.firstElementChild?.className).not.toContain('rounded-full');
  });

  it('keeps the icon size a circle', () => {
    const { container } = render(<Button size="icon" aria-label="x">i</Button>);
    expect(container.firstElementChild?.className).toContain('rounded-full');
  });
});

describe('tabs', () => {
  it('draws the strip as a muted pill and the active trigger as solid primary', () => {
    const { container } = render(
      <Tabs value="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    expect(list.className).toContain('rounded-full');
    expect(list.className).toContain('bg-muted/70');
    const active = container.querySelector('[data-state="active"]') as HTMLElement;
    expect(active.className).toContain('rounded-full');
    expect(active.className).toContain('data-[state=active]:bg-primary');
  });
});

describe('badge variants', () => {
  it('exposes the status-token variants', () => {
    const cases: Array<[Parameters<typeof Badge>[0]['variant'], string]> = [
      ['default', 'bg-primary/15'],
      ['secondary', 'bg-muted'],
      ['success', 'bg-status-success-bg'],
      ['warning', 'bg-status-warning-bg'],
      ['info', 'bg-status-info-bg'],
      ['accent', 'bg-status-accent-bg'],
      ['danger', 'bg-status-danger-bg'],
    ];
    for (const [variant, cls] of cases) {
      const { container, unmount } = render(<Badge variant={variant}>x</Badge>);
      expect(container.firstElementChild?.className).toContain(cls);
      unmount();
    }
  });
});
