import type { Schema } from '../types/schema';
import type { LayoutNode, LayoutEdge, Point } from './types';

type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * Determine which side of the source node to exit from,
 * based on grid-relative position of the target node.
 * Prefers horizontal connections; uses vertical only when
 * nodes share the same column.
 */
function chooseSide(from: LayoutNode, to: LayoutNode): Side {
  const fcx = from.rect.x + from.rect.width / 2;
  const fcy = from.rect.y + from.rect.height / 2;
  const tcx = to.rect.x + to.rect.width / 2;
  const tcy = to.rect.y + to.rect.height / 2;

  const dx = tcx - fcx;
  const dy = tcy - fcy;

  // Strongly prefer horizontal exits (left/right) — they look cleaner
  if (Math.abs(dx) > 20) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'bottom' : 'top';
}

/**
 * Get the anchor point on a given side of a node,
 * with an offset for parallel edge spacing.
 */
function getAnchor(
  node: LayoutNode,
  side: Side,
  offset: number,
  total: number,
): Point {
  const r = node.rect;
  const fraction = total > 1 ? (offset + 1) / (total + 1) : 0.5;

  switch (side) {
    case 'right':
      return { x: r.x + r.width, y: r.y + r.height * fraction };
    case 'left':
      return { x: r.x, y: r.y + r.height * fraction };
    case 'bottom':
      return { x: r.x + r.width * fraction, y: r.y + r.height };
    case 'top':
      return { x: r.x + r.width * fraction, y: r.y };
  }
}

/**
 * Produce orthogonal (Manhattan) waypoints between two anchor points.
 * The path always consists of: start → bend1 → bend2 → end,
 * forming an L-shape or Z-shape with only 90° turns.
 */
function manhattanRoute(
  start: Point,
  startSide: Side,
  end: Point,
  endSide: Side,
  channelOffset: number,
): Point[] {
  const GAP = 30 + channelOffset * 12; // clearance from node edge

  // Extend start and end points outward from their respective sides
  const s = extendPoint(start, startSide, GAP);
  const e = extendPoint(end, endSide, GAP);

  // If the extensions are already aligned on one axis, simple L-bend
  if (isHorizontalSide(startSide) && isHorizontalSide(endSide)) {
    // Both exit horizontally — route via a midpoint x
    const midX = (s.x + e.x) / 2;
    return [
      start, s,
      { x: midX, y: s.y },
      { x: midX, y: e.y },
      e, end,
    ];
  }

  if (isVerticalSide(startSide) && isVerticalSide(endSide)) {
    // Both exit vertically — route via a midpoint y
    const midY = (s.y + e.y) / 2;
    return [
      start, s,
      { x: s.x, y: midY },
      { x: e.x, y: midY },
      e, end,
    ];
  }

  // Mixed: one horizontal, one vertical — single L-bend
  if (isHorizontalSide(startSide)) {
    return [
      start, s,
      { x: s.x, y: e.y },
      e, end,
    ];
  }

  return [
    start, s,
    { x: e.x, y: s.y },
    e, end,
  ];
}

function extendPoint(pt: Point, side: Side, gap: number): Point {
  switch (side) {
    case 'right':  return { x: pt.x + gap, y: pt.y };
    case 'left':   return { x: pt.x - gap, y: pt.y };
    case 'bottom': return { x: pt.x, y: pt.y + gap };
    case 'top':    return { x: pt.x, y: pt.y - gap };
  }
}

function isHorizontalSide(s: Side): boolean {
  return s === 'left' || s === 'right';
}

function isVerticalSide(s: Side): boolean {
  return s === 'top' || s === 'bottom';
}

/**
 * Remove redundant collinear waypoints to produce cleaner paths.
 */
function simplifyPath(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Skip if all three are collinear (same x or same y)
    const sameX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
    const sameY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
    if (!sameX && !sameY) {
      result.push(curr);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

export function routeEdges(schema: Schema, nodes: LayoutNode[]): LayoutEdge[] {
  const tableIndexMap = new Map<string, number>();
  for (const node of nodes) {
    tableIndexMap.set(node.tableName, node.tableIndex);
  }

  // Pre-compute side assignments and count edges per (node, side) pair
  type EdgeInfo = {
    fkIdx: number;
    fromIdx: number;
    toIdx: number;
    fromSide: Side;
    toSide: Side;
  };

  const edgeInfos: EdgeInfo[] = [];
  const sideCount = new Map<string, number>();

  for (let fkIdx = 0; fkIdx < schema.foreignKeys.length; fkIdx++) {
    const fk = schema.foreignKeys[fkIdx];
    const fromIdx = tableIndexMap.get(fk.fromTable);
    const toIdx = tableIndexMap.get(fk.toTable);
    if (fromIdx === undefined || toIdx === undefined) continue;

    const fromSide = chooseSide(nodes[fromIdx], nodes[toIdx]);
    const toSide = chooseSide(nodes[toIdx], nodes[fromIdx]);

    const fromKey = `${fromIdx}:${fromSide}`;
    const toKey = `${toIdx}:${toSide}`;
    sideCount.set(fromKey, (sideCount.get(fromKey) ?? 0) + 1);
    sideCount.set(toKey, (sideCount.get(toKey) ?? 0) + 1);

    edgeInfos.push({ fkIdx, fromIdx, toIdx, fromSide, toSide });
  }

  // Track current offset index per (node, side)
  const sideOffset = new Map<string, number>();

  const edges: LayoutEdge[] = [];

  for (const info of edgeInfos) {
    const fromKey = `${info.fromIdx}:${info.fromSide}`;
    const toKey = `${info.toIdx}:${info.toSide}`;

    const fromOff = sideOffset.get(fromKey) ?? 0;
    const toOff = sideOffset.get(toKey) ?? 0;
    sideOffset.set(fromKey, fromOff + 1);
    sideOffset.set(toKey, toOff + 1);

    const fromTotal = sideCount.get(fromKey) ?? 1;
    const toTotal = sideCount.get(toKey) ?? 1;

    const startPt = getAnchor(nodes[info.fromIdx], info.fromSide, fromOff, fromTotal);
    const endPt = getAnchor(nodes[info.toIdx], info.toSide, toOff, toTotal);

    const channelOffset = Math.max(fromOff, toOff);
    const waypoints = manhattanRoute(startPt, info.fromSide, endPt, info.toSide, channelOffset);
    const simplified = simplifyPath(waypoints);

    edges.push({
      fkIndex: info.fkIdx,
      fromNodeIndex: info.fromIdx,
      toNodeIndex: info.toIdx,
      points: simplified,
    });
  }

  return edges;
}
