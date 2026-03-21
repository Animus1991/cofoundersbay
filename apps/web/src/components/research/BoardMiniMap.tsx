'use client';

import { useMemo, useCallback } from 'react';
import type { ResearchNode } from '@/lib/api';

const MINIMAP_W = 180;
const MINIMAP_H = 120;
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
}

export function BoardMiniMap({ nodes, pan, zoom, viewportWidth, viewportHeight, onNavigate }: BoardMiniMapProps) {
  // Compute bounding box of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 2000, maxY: 1500 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.posX);
      minY = Math.min(minY, n.posY);
      maxX = Math.max(maxX, n.posX + n.width);
      maxY = Math.max(maxY, n.posY + n.height);
    }
    // Add padding around bounds
    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      maxX: maxX + PADDING,
      maxY: maxY + PADDING,
    };
  }, [nodes]);

  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scaleX = MINIMAP_W / worldW;
  const scaleY = MINIMAP_H / worldH;
  const scale = Math.min(scaleX, scaleY, 1);

  const toMini = useCallback((wx: number, wy: number) => ({
    x: (wx - bounds.minX) * scale,
    y: (wy - bounds.minY) * scale,
  }), [bounds, scale]);

  // Viewport rect in world coords
  const vpWorldX = -pan.x / zoom;
  const vpWorldY = -pan.y / zoom;
  const vpWorldW = viewportWidth / zoom;
  const vpWorldH = viewportHeight / zoom;

  const vpMini = toMini(vpWorldX, vpWorldY);
  const vpMiniW = Math.max(vpWorldW * scale, 8);
  const vpMiniH = Math.max(vpWorldH * scale, 8);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Convert minimap click to world coords
    const worldX = mx / scale + bounds.minX;
    const worldY = my / scale + bounds.minY;
    // Center the viewport on clicked world point
    const newPanX = -(worldX * zoom) + viewportWidth / 2;
    const newPanY = -(worldY * zoom) + viewportHeight / 2;
    onNavigate({ x: newPanX, y: newPanY });
  }, [scale, bounds, zoom, viewportWidth, viewportHeight, onNavigate]);

  return (
    <div className="pointer-events-auto rounded-xl border bg-card/90 backdrop-blur-sm shadow-lg overflow-hidden"
      style={{ width: MINIMAP_W + 2, height: MINIMAP_H + 2 }}>
      <svg
        width={MINIMAP_W}
        height={MINIMAP_H}
        className="cursor-crosshair"
        onClick={handleClick}
      >
        {/* Background */}
        <rect x={0} y={0} width={MINIMAP_W} height={MINIMAP_H} fill="var(--secondary)" opacity={0.5} />

        {/* Nodes */}
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

        {/* Viewport indicator */}
        <rect
          x={Math.max(0, vpMini.x)}
          y={Math.max(0, vpMini.y)}
          width={Math.min(vpMiniW, MINIMAP_W)}
          height={Math.min(vpMiniH, MINIMAP_H)}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          rx={2}
          opacity={0.8}
        />
      </svg>
    </div>
  );
}
