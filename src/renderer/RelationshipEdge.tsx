import type { Point } from '../layout/types';
import { useTheme } from '../theme';

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
  const { theme } = useTheme();
  const colors = theme.colors;

  if (points.length < 2) return null;

  const color = colors.edgeAccents[colorIndex % colors.edgeAccents.length];
  const markerId = `arrowhead-${colorIndex % colors.edgeAccents.length}`;
  const pointString = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <polyline
      points={pointString}
      fill="none"
      stroke={color}
      strokeWidth={highlighted ? 2.5 : 1.5}
      strokeLinejoin="round"
      opacity={highlighted ? 1 : 0.5}
      markerEnd={`url(#${markerId})`}
      filter={highlighted ? 'url(#glow)' : undefined}
      style={{ transition: 'opacity 0.15s, stroke-width 0.15s' }}
    />
  );
}
