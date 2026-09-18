'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ResearchNode } from '@/lib/api';

const DESKTOP_W = 180;
const DESKTOP_H = 120;
const COMPACT_W = 112;
const COMPACT_H = 76;
const PADDING = 20;

function getNodeColor(type: string, color: string | null): string {
  if (color) return color;
  const MAP: Record<string, string> = {
    note: '#FDE68A',
    document: '#93C5FD',
    image: '#86EFAC',
    pdf: '#FCA5A5',
    link: '#C4B5FD',
    reference: '#6EE7B7',
  };
  return MAP[type] ?? '#94A3B8';
}

interface BoardMiniMapProps {
  nodes: ResearchNode[];
  pan: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate: (pan: { x: number; y: number }) => void;
  compact?: boolean;
}

export function BoardMiniMap({
  nodes,
  pan,
  zoom,
  viewportWidth,
  viewportHeight,
  onNavigate,
  compact = false,
}: BoardMiniMapProps) {
  const miniW = compact ? COMPACT_W : DESKTOP_W;
  const miniH = compact ? COMPACT_H : DESKTOP_H;

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 2000, maxY: 1500 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.posX);
      minY = Math.min(minY, n.posY);
      maxX = Math.max(maxX, n.posX + n.width);
      maxY = Math.max(maxY, n.posY + n.height);
    }
    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      maxX: maxX + PADDING,
      maxY: maxY + PADDING,
    };
  }, [nodes]);

  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scaleX = miniW / worldW;
  const scaleY = miniH / worldH;
  const scale = Math.min(scaleX, scaleY, 1);

  const toMini = useCallback((wx: number, wy: number) => ({
    x: (wx - bounds.minX) * scale,
    y: (wy - bounds.minY) * scale,
  }), [bounds, scale]);

  const vpWorldX = -pan.x / zoom;
  const vpWorldY = -pan.y / zoom;
  const vpWorldW = viewportWidth / zoom;
  const vpWorldH = viewportHeight / zoom;

  const vpMini = toMini(vpWorldX, vpWorldY);
  const vpMiniW = Math.max(vpWorldW * scale, 8);
  const vpMiniH = Math.max(vpWorldH * scale, 8);

  const navigateFromClient = useCallback((clientX: number, clientY: number, currentTarget: Element) => {
    const rect = currentTarget.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const worldX = mx / scale + bounds.minX;
    const worldY = my / scale + bounds.minY;
    const newPanX = -(worldX * zoom) + viewportWidth / 2;
    const newPanY = -(worldY * zoom) + viewportHeight / 2;
    onNavigate({ x: newPanX, y: newPanY });
  }, [scale, bounds, zoom, viewportWidth, viewportHeight, onNavigate]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    navigateFromClient(e.clientX, e.clientY, e.currentTarget);
  }, [navigateFromClient]);

  return (
    <div
      data-compact={compact ? 'true' : 'false'}
      className={cn(
        'pointer-events-auto rounded-xl border border-border/70 bg-muted/80 backdrop-blur-sm shadow-lg overflow-hidden',
      )}
      style={{ width: miniW + 2, height: miniH + 2 }}
    >
      <svg
        width={miniW}
        height={miniH}
        className="cursor-crosshair touch-manipulation"
        onClick={handleClick}
        role="img"
        aria-label="Canvas mini-map"
      >
        <rect x={0} y={0} width={miniW} height={miniH} fill="hsl(var(--muted))" />

        {nodes.map((node) => {
          const pos = toMini(node.posX, node.posY);
          const w = Math.max(node.width * scale, 3);
          const h = Math.max(node.height * scale, 3);
          return (
            <rect
              key={node.id}
              x={pos.x}
              y={pos.y}
              width={w}
              height={h}
              rx={1}
              fill={getNodeColor(node.type, node.color)}
              opacity={0.75}
            />
          );
        })}

        <rect
          x={Math.max(0, vpMini.x)}
          y={Math.max(0, vpMini.y)}
          width={Math.min(vpMiniW, miniW)}
          height={Math.min(vpMiniH, miniH)}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          rx={2}
          opacity={0.8}
        />
      </svg>
    </div>
  );
}
