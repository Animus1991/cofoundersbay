'use client';

/**
 * A day-by-day series in the space of one caption line (docs §107).
 *
 * The stat-tile anatomy: the figure, its change, and beside the change the
 * shape that produced it. The line is in the quiet ink and its area a faint
 * wash; only the last day carries the brand, because "now" is the point a
 * reader looks for. It sits on the change's own line, so a tile with one is
 * exactly as tall as a tile without.
 *
 * Baseline at zero, so a quiet week does not look like a cliff. Each day is a
 * hover band with its value (the full chart is one click away, on the page
 * the tile opens). Decorative to assistive tech: the tile's words already
 * say the number and its change.
 */
export type SparkPoint = { label: string; value: number };

export function Sparkline({
  points,
  width = 56,
  height = 16,
  className,
}: {
  points: readonly SparkPoint[];
  /** CSS pixels; the drawing stretches to it. */
  width?: number;
  height?: number;
  className?: string;
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => (Number.isFinite(p.value) ? Math.max(0, p.value) : 0));
  const max = Math.max(...values, 1);
  const pad = 1.5;
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L100 ${height} L0 ${height} Z`;
  const last = values[values.length - 1];
  const band = 100 / values.length;

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ position: 'relative', display: 'inline-block', width, height, verticalAlign: 'middle', flexShrink: 0 }}
      data-sparkline=""
    >
      <svg width={width} height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <path d={area} style={{ fill: 'hsl(var(--muted-foreground) / 0.12)' }} />
        <path
          d={line}
          vectorEffect="non-scaling-stroke"
          style={{ fill: 'none', stroke: 'hsl(var(--muted-foreground) / 0.65)', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' }}
        />
        {points.map((point, i) => (
          <rect key={point.label} x={Math.max(0, x(i) - band / 2)} y={0} width={band} height={height} style={{ fill: 'transparent' }}>
            <title>{`${point.label}: ${values[i]}`}</title>
          </rect>
        ))}
      </svg>
      {/* The last day, round whatever the stretch: an HTML dot on the line's end. */}
      <span
        style={{
          position: 'absolute',
          right: -3,
          top: y(last) - 3,
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: 'hsl(var(--primary))',
          boxShadow: '0 0 0 2px hsl(var(--card))',
        }}
      />
    </span>
  );
}
