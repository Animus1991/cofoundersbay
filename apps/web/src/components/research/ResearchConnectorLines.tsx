'use client';

import { useMemo } from 'react';
import { ResearchConnector, ResearchNode } from '@/lib/api';

interface ResearchConnectorLinesProps {
  connectors: ResearchConnector[];
  nodes: ResearchNode[];
}

export function ResearchConnectorLines({ connectors, nodes }: ResearchConnectorLinesProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, ResearchNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const svgPaths = useMemo(() => {
    return connectors.map((connector) => {
      const fromNode = nodeMap.get(connector.fromNodeId);
      const toNode = nodeMap.get(connector.toNodeId);
      
      if (!fromNode || !toNode) return null;

      // Calculate connection points (center of nodes)
      const fromX = fromNode.posX + fromNode.width / 2;
      const fromY = fromNode.posY + fromNode.height / 2;
      const toX = toNode.posX + toNode.width / 2;
      const toY = toNode.posY + toNode.height / 2;

      // Create a curved path using quadratic bezier
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      const controlX = midX;
      const controlY = midY - Math.abs(fromY - toY) * 0.2; // Add some curve

      const pathData = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;

      return {
        id: connector.id,
        path: pathData,
        color: connector.color || '#6b7280',
        style: connector.style || 'solid',
        label: connector.label,
        labelX: midX,
        labelY: midY,
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [connectors, nodeMap]);

  if (svgPaths.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        {/* Define arrowhead marker */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#6b7280"
          />
        </marker>
      </defs>

      {svgPaths.map((path) => (
        <g key={path.id}>
          <path
            d={path.path}
            stroke={path.color}
            strokeWidth="2"
            fill="none"
            strokeDasharray={path.style === 'dashed' ? '5,5' : path.style === 'dotted' ? '2,2' : undefined}
            markerEnd="url(#arrowhead)"
            opacity="0.6"
          />
          {path.label && (
            <text
              x={path.labelX}
              y={path.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7280"
              fontSize="12"
              className="bg-background"
            >
              {path.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
