import type { Schema } from '../types/schema';
import type { LayoutNode } from './types';
import { DIMS } from '../renderer/styles';

function computeTextWidth(text: string, font: 'bold' | 'mono'): number {
  const charWidth = font === 'bold' ? DIMS.charWidthBold : DIMS.charWidthMono;
  return text.length * charWidth;
}

function measureNodes(schema: Schema): LayoutNode[] {
  return schema.tables.map((table, i) => {
    const headerWidth = computeTextWidth(table.name, 'bold') + 2 * DIMS.hPadding + 40;

    let maxColWidth = 0;
    for (const col of table.columns) {
      const colWidth = computeTextWidth(col.name, 'mono') + computeTextWidth(col.type, 'mono') + 60;
      if (colWidth > maxColWidth) maxColWidth = colWidth;
    }

    const width = Math.max(
      DIMS.nodeMinWidth,
      Math.min(DIMS.nodeMaxWidth, Math.max(headerWidth, maxColWidth + 2 * DIMS.hPadding))
    );
    const height = DIMS.headerHeight + table.columns.length * DIMS.rowHeight + DIMS.bottomPadding;

    return {
      tableIndex: i,
      tableName: table.name,
      rect: { x: 0, y: 0, width, height },
      columnCount: table.columns.length,
    };
  });
}

function computeSpiralOrder(rows: number, cols: number): [number, number][] {
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);
  const result: [number, number][] = [[centerRow, centerCol]];
  const total = rows * cols;

  const directions: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  let dirIdx = 0;
  let stepsInDir = 1;
  let stepsTaken = 0;
  let turnsAtLen = 0;
  let r = centerRow;
  let c = centerCol;

  while (result.length < total) {
    const [dr, dc] = directions[dirIdx];
    r += dr;
    c += dc;
    stepsTaken++;

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      result.push([r, c]);
    }

    if (stepsTaken === stepsInDir) {
      stepsTaken = 0;
      dirIdx = (dirIdx + 1) % 4;
      turnsAtLen++;
      if (turnsAtLen === 2) {
        turnsAtLen = 0;
        stepsInDir++;
      }
    }
  }

  return result;
}

export function computeGridLayout(schema: Schema): LayoutNode[] {
  const nodes = measureNodes(schema);
  if (nodes.length === 0) return nodes;

  // Compute degree for each table
  const degreeMap = new Map<string, number>();
  for (const fk of schema.foreignKeys) {
    degreeMap.set(fk.fromTable, (degreeMap.get(fk.fromTable) ?? 0) + 1);
    degreeMap.set(fk.toTable, (degreeMap.get(fk.toTable) ?? 0) + 1);
  }

  // Sort indices by degree descending, then alphabetically
  const sortedIndices = nodes.map((_, i) => i).sort((a, b) => {
    const da = degreeMap.get(nodes[a].tableName) ?? 0;
    const db = degreeMap.get(nodes[b].tableName) ?? 0;
    if (db !== da) return db - da;
    return nodes[a].tableName.localeCompare(nodes[b].tableName);
  });

  // Grid dimensions
  const N = nodes.length;
  const cols = Math.ceil(Math.sqrt(N));
  const rows = Math.ceil(N / cols);

  const maxHeight = Math.max(...nodes.map(n => n.rect.height));
  const CELL_W = DIMS.nodeMaxWidth + DIMS.hGap;
  const CELL_H = maxHeight + DIMS.vGap;

  // Spiral placement
  const spiralCells = computeSpiralOrder(rows, cols);

  for (let i = 0; i < N; i++) {
    const nodeIdx = sortedIndices[i];
    const [row, col] = spiralCells[i];
    nodes[nodeIdx].rect.x = col * CELL_W + (CELL_W - nodes[nodeIdx].rect.width) / 2;
    nodes[nodeIdx].rect.y = row * CELL_H;
  }

  return nodes;
}
