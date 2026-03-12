import type { Point } from '../layout/types';
import { COLORS } from './styles';

interface RelationshipEdgeProps {
  points: Point[];
  colorIndex: number;
  highlighted?: boolean;
}

export function RelationshipEdge({
  points,
  colorIndex,
  highlighted = false,
}: RelationshipEdgeProps) {
  if (points.length < 2) return null;

  const color = COLORS.edgeAccents[colorIndex % COLORS.edgeAccents.length];
  const markerId = `arrowhead-${colorIndex % COLORS.edgeAccents.length}`;
  const pointString = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <polyline
      points={pointString}
      fill="none"
      stroke={color}
      strokeWidth={highlighted ? 2.5 : 1.5}
      opacity={highlighted ? 1 : 0.5}
      markerEnd={`url(#${markerId})`}
      filter={highlighted ? 'url(#glow)' : undefined}
      style={{ transition: 'opacity 0.15s, stroke-width 0.15s' }}
    />
  );
}
