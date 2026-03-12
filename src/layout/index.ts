import type { Schema } from '../types/schema';
import type { LayoutResult, Rect } from './types';
import { computeGridLayout } from './grid-layout';
import { routeEdges } from './edge-routing';

export function computeLayout(schema: Schema): LayoutResult {
  const nodes = computeGridLayout(schema);

  if (nodes.length === 0) {
    return {
      nodes: [],
      edges: [],
      bounds: { x: 0, y: 0, width: 800, height: 600 },
    };
  }

  const edges = routeEdges(schema, nodes);

  // Compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.rect.x);
    minY = Math.min(minY, node.rect.y);
    maxX = Math.max(maxX, node.rect.x + node.rect.width);
    maxY = Math.max(maxY, node.rect.y + node.rect.height);
  }

  const padding = 60;
  const bounds: Rect = {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };

  return { nodes, edges, bounds };
}

export type { LayoutResult, LayoutNode, LayoutEdge, Point, Rect } from './types';
