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

type GridCell = { row: number; col: number };

/**
 * BFS adjacency-aware grid placement.
 *
 * 1. Build bidirectional adjacency from foreign keys
 * 2. Find connected components
 * 3. BFS from highest-degree root in each component,
 *    placing each neighbor in the nearest unoccupied cell to its parent
 * 4. Isolated tables fill remaining cells at the end
 */
export function computeGridLayout(schema: Schema): LayoutNode[] {
  const nodes = measureNodes(schema);
  if (nodes.length === 0) return nodes;

  const N = nodes.length;
  const nameToIndex = new Map<string, number>();
  for (const node of nodes) {
    nameToIndex.set(node.tableName, node.tableIndex);
  }

  // Build adjacency list (bidirectional)
  const adj = new Map<number, Set<number>>();
  for (let i = 0; i < N; i++) adj.set(i, new Set());

  for (const fk of schema.foreignKeys) {
    const fromIdx = nameToIndex.get(fk.fromTable);
    const toIdx = nameToIndex.get(fk.toTable);
    if (fromIdx !== undefined && toIdx !== undefined && fromIdx !== toIdx) {
      adj.get(fromIdx)!.add(toIdx);
      adj.get(toIdx)!.add(fromIdx);
    }
  }

  // Find connected components
  const visited = new Set<number>();
  const components: number[][] = [];

  for (let i = 0; i < N; i++) {
    if (visited.has(i)) continue;
    const component: number[] = [];
    const stack = [i];
    while (stack.length > 0) {
      const n = stack.pop()!;
      if (visited.has(n)) continue;
      visited.add(n);
      component.push(n);
      for (const neighbor of adj.get(n)!) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }
    components.push(component);
  }

  // Sort components: largest first (connected tables first, isolates last)
  components.sort((a, b) => b.length - a.length);

  // Grid dimensions
  const cols = Math.ceil(Math.sqrt(N));
  const rows = Math.ceil(N / cols);

  const occupied = new Map<string, number>(); // "row,col" -> nodeIndex
  const cellOf = new Map<number, GridCell>(); // nodeIndex -> grid cell

  function cellKey(r: number, c: number): string {
    return `${r},${c}`;
  }

  function isOccupied(r: number, c: number): boolean {
    return occupied.has(cellKey(r, c));
  }

  // Spiral search for nearest unoccupied cell to a target cell
  function findNearestEmpty(targetRow: number, targetCol: number): GridCell {
    if (!isOccupied(targetRow, targetCol)) {
      return { row: targetRow, col: targetCol };
    }
    for (let radius = 1; radius < rows + cols + 10; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
          const r = targetRow + dr;
          const c = targetCol + dc;
          if (r >= 0 && c >= 0 && !isOccupied(r, c)) {
            return { row: r, col: c };
          }
        }
      }
    }
    // Fallback
    for (let r = 0; ; r++) {
      for (let c = 0; c < Math.max(cols, 10); c++) {
        if (!isOccupied(r, c)) return { row: r, col: c };
      }
    }
  }

  function placeNode(nodeIdx: number, cell: GridCell) {
    occupied.set(cellKey(cell.row, cell.col), nodeIdx);
    cellOf.set(nodeIdx, cell);
  }

  // BFS place each component
  let nextIsolateCol = 0;

  for (const component of components) {
    if (component.length === 1) {
      // Isolated node — place in a bottom row
      const cell = findNearestEmpty(rows, nextIsolateCol);
      placeNode(component[0], cell);
      nextIsolateCol++;
      continue;
    }

    // Find root: highest degree in this component
    let root = component[0];
    let maxDeg = 0;
    for (const nodeIdx of component) {
      const deg = adj.get(nodeIdx)!.size;
      if (deg > maxDeg) {
        maxDeg = deg;
        root = nodeIdx;
      }
    }

    // BFS from root
    const bfsVisited = new Set<number>();
    const queue: number[] = [root];
    bfsVisited.add(root);

    // Place root near center
    const startRow = Math.floor(rows / 2);
    const startCol = Math.floor(cols / 2);
    const rootCell = findNearestEmpty(startRow, startCol);
    placeNode(root, rootCell);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const parentCell = cellOf.get(current)!;

      // Sort neighbors by degree descending for better placement
      const neighbors = [...adj.get(current)!]
        .filter(n => !bfsVisited.has(n))
        .sort((a, b) => adj.get(b)!.size - adj.get(a)!.size);

      for (const neighbor of neighbors) {
        if (bfsVisited.has(neighbor)) continue;
        bfsVisited.add(neighbor);

        // Try to place adjacent to parent (right, below, left, above, then diagonals)
        const candidates: GridCell[] = [
          { row: parentCell.row, col: parentCell.col + 1 },
          { row: parentCell.row + 1, col: parentCell.col },
          { row: parentCell.row, col: parentCell.col - 1 },
          { row: parentCell.row - 1, col: parentCell.col },
          { row: parentCell.row + 1, col: parentCell.col + 1 },
          { row: parentCell.row - 1, col: parentCell.col + 1 },
          { row: parentCell.row + 1, col: parentCell.col - 1 },
          { row: parentCell.row - 1, col: parentCell.col - 1 },
        ];

        let placed = false;
        for (const cand of candidates) {
          if (cand.row >= 0 && cand.col >= 0 && !isOccupied(cand.row, cand.col)) {
            placeNode(neighbor, cand);
            placed = true;
            break;
          }
        }

        if (!placed) {
          const cell = findNearestEmpty(parentCell.row, parentCell.col);
          placeNode(neighbor, cell);
        }

        queue.push(neighbor);
      }
    }
  }

  // Normalize grid coordinates to start at (0,0)
  let minRow = Infinity, minCol = Infinity;
  let maxRow = -Infinity, maxCol = -Infinity;
  for (const cell of cellOf.values()) {
    minRow = Math.min(minRow, cell.row);
    minCol = Math.min(minCol, cell.col);
    maxRow = Math.max(maxRow, cell.row);
    maxCol = Math.max(maxCol, cell.col);
  }
  for (const [idx, cell] of cellOf) {
    cellOf.set(idx, { row: cell.row - minRow, col: cell.col - minCol });
  }
  const gridRows = maxRow - minRow + 1;
  const gridCols = maxCol - minCol + 1;

  // Compute per-column max width and per-row max height
  const colWidths = new Array(gridCols).fill(DIMS.nodeMinWidth);
  const rowHeights = new Array(gridRows).fill(0);

  for (const [nodeIdx, cell] of cellOf) {
    const node = nodes[nodeIdx];
    if (node.rect.width > colWidths[cell.col]) {
      colWidths[cell.col] = node.rect.width;
    }
    if (node.rect.height > rowHeights[cell.row]) {
      rowHeights[cell.row] = node.rect.height;
    }
  }

  // Compute cumulative x/y offsets
  const colX: number[] = [0];
  for (let c = 1; c < gridCols; c++) {
    colX.push(colX[c - 1] + colWidths[c - 1] + DIMS.hGap);
  }
  const rowY: number[] = [0];
  for (let r = 1; r < gridRows; r++) {
    rowY.push(rowY[r - 1] + rowHeights[r - 1] + DIMS.vGap);
  }

  // Position nodes, centered in their cell
  for (const [nodeIdx, cell] of cellOf) {
    const node = nodes[nodeIdx];
    const cellWidth = colWidths[cell.col];
    node.rect.x = colX[cell.col] + (cellWidth - node.rect.width) / 2;
    node.rect.y = rowY[cell.row];
  }

  return nodes;
}
