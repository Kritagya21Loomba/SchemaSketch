import React, { useState, useMemo, useCallback } from 'react';
import type { Schema } from '../types/schema';
import type { LayoutResult, LayoutNode, Point } from '../layout/types';
import { routeEdges } from '../layout/edge-routing';
import { COLORS } from './styles';
import { Defs } from './Defs';
import { TableNode } from './TableNode';
import { RelationshipEdge } from './RelationshipEdge';
import { usePanZoom } from '../hooks/usePanZoom';
import { useDragTable } from '../hooks/useDragTable';

interface DiagramCanvasProps {
  schema: Schema;
  layout: LayoutResult;
}

export const DiagramCanvas = React.forwardRef<SVGSVGElement, DiagramCanvasProps>(
  function DiagramCanvas({ schema, layout }, ref) {
    const [hoveredTable, setHoveredTable] = useState<number | null>(null);
    const [nodeOverrides, setNodeOverrides] = useState<Map<number, Point>>(new Map());
    const { nodes: baseNodes, bounds } = layout;

    // Reset overrides when layout changes (new schema parsed)
    const layoutRef = React.useRef(layout);
    if (layoutRef.current !== layout) {
      layoutRef.current = layout;
      if (nodeOverrides.size > 0) {
        setNodeOverrides(new Map());
      }
    }

    // Merge layout nodes with drag overrides
    const mergedNodes: LayoutNode[] = useMemo(() => {
      if (nodeOverrides.size === 0) return baseNodes;
      return baseNodes.map(node => {
        const override = nodeOverrides.get(node.tableIndex);
        return override
          ? { ...node, rect: { ...node.rect, x: override.x, y: override.y } }
          : node;
      });
    }, [baseNodes, nodeOverrides]);

    // Recompute edges based on merged positions
    const edges = useMemo(() => {
      return routeEdges(schema, mergedNodes);
    }, [schema, mergedNodes]);

    // Pan/zoom
    const { viewBox, handlers: panHandlers } = usePanZoom(bounds);

    // Drag
    const getNodePosition = useCallback((tableIndex: number): Point => {
      const override = nodeOverrides.get(tableIndex);
      if (override) return override;
      const node = baseNodes.find(n => n.tableIndex === tableIndex);
      return node ? { x: node.rect.x, y: node.rect.y } : { x: 0, y: 0 };
    }, [nodeOverrides, baseNodes]);

    const handleDrag = useCallback((tableIndex: number, position: Point) => {
      setNodeOverrides(prev => {
        const next = new Map(prev);
        next.set(tableIndex, position);
        return next;
      });
    }, []);

    const { handlePointerDown: onTablePointerDown, handlePointerMove: onDragMove, handlePointerUp: onDragUp } =
      useDragTable(handleDrag, getNodePosition);

    // Highlighted edges/tables
    const highlightedEdges = new Set<number>();
    if (hoveredTable !== null) {
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (edge.fromNodeIndex === hoveredTable || edge.toNodeIndex === hoveredTable) {
          highlightedEdges.add(i);
        }
      }
    }

    // Expand the background far beyond bounds so grain covers during pan/zoom
    const bgPad = 2000;

    return (
      <svg
        ref={ref}
        width="100%"
        height="100%"
        viewBox={viewBox}
        style={{ display: 'block', background: COLORS.background, cursor: 'grab' }}
        {...panHandlers}
        onPointerMove={(e) => {
          panHandlers.onPointerMove(e);
          onDragMove(e);
        }}
        onPointerUp={() => {
          panHandlers.onPointerUp();
          onDragUp();
        }}
      >
        <Defs />

        {/* Background + Grain */}
        <rect
          x={bounds.x - bgPad}
          y={bounds.y - bgPad}
          width={bounds.width + bgPad * 2}
          height={bounds.height + bgPad * 2}
          fill={COLORS.background}
        />
        <rect
          x={bounds.x - bgPad}
          y={bounds.y - bgPad}
          width={bounds.width + bgPad * 2}
          height={bounds.height + bgPad * 2}
          filter="url(#grain)"
          opacity={0.06}
        />

        {/* Edges (behind nodes) */}
        {edges.map((edge, i) => (
          <RelationshipEdge
            key={i}
            points={edge.points}
            colorIndex={i}
            highlighted={hoveredTable === null || highlightedEdges.has(i)}
          />
        ))}

        {/* Table nodes */}
        {mergedNodes.map((node) => {
          const table = schema.tables[node.tableIndex];
          return (
            <TableNode
              key={node.tableName}
              table={table}
              x={node.rect.x}
              y={node.rect.y}
              width={node.rect.width}
              height={node.rect.height}
              highlighted={hoveredTable !== null && hoveredTable === node.tableIndex}
              onMouseEnter={() => setHoveredTable(node.tableIndex)}
              onMouseLeave={() => setHoveredTable(null)}
              onPointerDown={(e) => onTablePointerDown(e, node.tableIndex)}
            />
          );
        })}
      </svg>
    );
  }
);
