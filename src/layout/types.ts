export type Point = { x: number; y: number };

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutNode = {
  tableIndex: number;
  tableName: string;
  rect: Rect;
  columnCount: number;
};

export type LayoutEdge = {
  fkIndex: number;
  fromNodeIndex: number;
  toNodeIndex: number;
  points: Point[];
};

export type LayoutResult = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  bounds: Rect;
};
