import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Users } from 'lucide-react';
import { MetricTile } from './MetricTile';

/**
 * The metric tile's family well (docs §134): the icon sits in a tint that
 * matches what the figure counts, and the figure itself is the visual key.
 */
afterEach(cleanup);

const wellOf = (container: HTMLElement) =>
  container.querySelector('span.rounded-2xl');

describe('MetricTile family wells', () => {
  it('maps each family to its tinted well', () => {
    const cases: Array<[Parameters<typeof MetricTile>[0]['family'], string]> = [
      ['people', 'bg-status-accent-bg'],
      ['money', 'bg-status-success-bg'],
      ['time', 'bg-status-warning-bg'],
      ['risk', 'bg-status-danger-bg'],
      ['neutral', 'bg-muted'],
    ];
    for (const [family, cls] of cases) {
      const { container, unmount } = render(
        <MetricTile label="Members" labelEl="Μέλη" value={12} icon={Users} family={family} />,
      );
      const well = wellOf(container);
      expect(well, `family ${family}`).not.toBeNull();
      expect(well?.className).toContain(cls);
      unmount();
    }
  });

  it('keeps the icon quiet — no well — when no family is given', () => {
    const { container } = render(<MetricTile label="Members" labelEl="Μέλη" value={12} icon={Users} />);
    expect(container.querySelector('span.rounded-2xl')).toBeNull();
    expect(container.querySelector('.text-muted-foreground\\/70')).not.toBeNull();
  });

  it('tints the tile at half strength by family, neutral stays a card', () => {
    const cases: Array<[Parameters<typeof MetricTile>[0]['family'], string]> = [
      ['people', 'bg-status-accent-bg/50'],
      ['money', 'bg-status-success-bg/50'],
      ['time', 'bg-status-warning-bg/50'],
      ['risk', 'bg-status-danger-bg/50'],
      ['neutral', 'bg-card'],
    ];
    for (const [family, cls] of cases) {
      const { container, unmount } = render(
        <MetricTile label="Members" labelEl="Μέλη" value={12} icon={Users} family={family} />,
      );
      expect(container.querySelector('[data-testid^="home-metric-"]')?.className, `family ${family}`).toContain(cls);
      unmount();
    }
  });

  it('renders the figure as the visual key at text-2xl', () => {
    const { container } = render(<MetricTile label="Members" labelEl="Μέλη" value={128} icon={Users} family="people" />);
    const value = container.querySelector('[data-testid$="-value"]');
    expect(value?.textContent).toBe('128');
    expect(value?.className).toContain('text-2xl');
    expect(value?.className).toContain('tabular-nums');
  });
});
