import type { Schema } from '../types/schema';
import type { LayoutNode, LayoutEdge, Point } from './types';

function rectCenter(node: LayoutNode): Point {
  return {
    x: node.rect.x + node.rect.width / 2,
    y: node.rect.y + node.rect.height / 2,
  };
}

function getConnectionPoint(
  node: LayoutNode,
  targetCenter: Point,
  edgeOffset: number,
  totalEdgesOnSide: number
): Point {
  const center = rectCenter(node);
  const dx = targetCenter.x - center.x;
  const dy = targetCenter.y - center.y;
  const angle = Math.atan2(dy, dx);

  // Determine which side to exit from based on angle
  const absAngle = Math.abs(angle);
  const r = node.rect;

  // Compute offset fraction for multiple edges on the same side
  const offsetFraction = totalEdgesOnSide > 1
    ? (edgeOffset / (totalEdgesOnSide - 1)) - 0.5
    : 0;

  if (absAngle < Math.PI / 4) {
    // Right side
    const yOff = offsetFraction * r.height * 0.6;
    return { x: r.x + r.width, y: center.y + yOff };
  } else if (absAngle > (3 * Math.PI) / 4) {
    // Left side
    const yOff = offsetFraction * r.height * 0.6;
    return { x: r.x, y: center.y + yOff };
  } else if (angle > 0) {
    // Bottom
    const xOff = offsetFraction * r.width * 0.6;
    return { x: center.x + xOff, y: r.y + r.height };
  } else {
    // Top
    const xOff = offsetFraction * r.width * 0.6;
    return { x: center.x + xOff, y: r.y };
  }
}

export function routeEdges(schema: Schema, nodes: LayoutNode[]): LayoutEdge[] {
  const tableIndexMap = new Map<string, number>();
  for (const node of nodes) {
    tableIndexMap.set(node.tableName, node.tableIndex);
  }

  // Count edges per side for offset calculation
  const sideCountMap = new Map<string, number>();
  const sideIndexMap = new Map<string, number>();

  const edges: LayoutEdge[] = [];

  for (let fkIdx = 0; fkIdx < schema.foreignKeys.length; fkIdx++) {
    const fk = schema.foreignKeys[fkIdx];
    const fromIdx = tableIndexMap.get(fk.fromTable);
    const toIdx = tableIndexMap.get(fk.toTable);

    if (fromIdx === undefined || toIdx === undefined) continue;

    const fromNode = nodes[fromIdx];
    const toNode = nodes[toIdx];
    const fromCenter = rectCenter(fromNode);
    const toCenter = rectCenter(toNode);

    // Simple key for side counting
    const fromKey = `${fromIdx}-${getSide(fromCenter, toCenter)}`;
    const toKey = `${toIdx}-${getSide(toCenter, fromCenter)}`;

    sideCountMap.set(fromKey, (sideCountMap.get(fromKey) ?? 0) + 1);
    sideCountMap.set(toKey, (sideCountMap.get(toKey) ?? 0) + 1);
  }

  for (let fkIdx = 0; fkIdx < schema.foreignKeys.length; fkIdx++) {
    const fk = schema.foreignKeys[fkIdx];
    const fromIdx = tableIndexMap.get(fk.fromTable);
    const toIdx = tableIndexMap.get(fk.toTable);

    if (fromIdx === undefined || toIdx === undefined) continue;

    const fromNode = nodes[fromIdx];
    const toNode = nodes[toIdx];
    const fromCenter = rectCenter(fromNode);
    const toCenter = rectCenter(toNode);

    const fromKey = `${fromIdx}-${getSide(fromCenter, toCenter)}`;
    const toKey = `${toIdx}-${getSide(toCenter, fromCenter)}`;

    const fromOffset = sideIndexMap.get(fromKey) ?? 0;
    const toOffset = sideIndexMap.get(toKey) ?? 0;
    sideIndexMap.set(fromKey, fromOffset + 1);
    sideIndexMap.set(toKey, toOffset + 1);

    const fromCount = sideCountMap.get(fromKey) ?? 1;
    const toCount = sideCountMap.get(toKey) ?? 1;

    const startPt = getConnectionPoint(fromNode, toCenter, fromOffset, fromCount);
    const endPt = getConnectionPoint(toNode, fromCenter, toOffset, toCount);

    edges.push({
      fkIndex: fkIdx,
      fromNodeIndex: fromIdx,
      toNodeIndex: toIdx,
      points: [startPt, endPt],
    });
  }

  return edges;
}

function getSide(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const absAngle = Math.abs(angle);

  if (absAngle < Math.PI / 4) return 'right';
  if (absAngle > (3 * Math.PI) / 4) return 'left';
  if (angle > 0) return 'bottom';
  return 'top';
}
