import { useTheme } from '../theme';
import type { Rect } from '../layout/types';
import { FONTS } from './styles';

interface LegendProps {
  viewBox: Rect;
}

const LEGEND_WIDTH = 200;
const LEGEND_HEIGHT = 100;
const MARGIN = 16;

export function Legend({ viewBox }: LegendProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const x = viewBox.x + viewBox.width - LEGEND_WIDTH - MARGIN;
  const y = viewBox.y + viewBox.height - LEGEND_HEIGHT - MARGIN;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background */}
      <rect
        width={LEGEND_WIDTH}
        height={LEGEND_HEIGHT}
        rx={6}
        ry={6}
        fill={colors.cardBg}
        stroke={colors.cardBorder}
        strokeWidth={1}
        opacity={0.92}
      />

      {/* Title */}
      <text
        x={12}
        y={20}
        fontFamily={FONTS.tableName}
        fontWeight={700}
        fontSize={10}
        letterSpacing="0.06em"
        fill={colors.typeText}
      >
        LEGEND
      </text>

      {/* PK */}
      <text
        x={12}
        y={40}
        fontFamily={FONTS.columnName}
        fontSize={10}
        fontWeight={500}
        fill={colors.pkAccent}
      >
        PK
      </text>
      <text
        x={36}
        y={40}
        fontFamily={FONTS.columnName}
        fontSize={11}
        fill={colors.columnText}
      >
        Primary Key
      </text>

      {/* FK */}
      <text
        x={12}
        y={58}
        fontFamily={FONTS.columnName}
        fontSize={10}
        fontWeight={500}
        fill={colors.fkAccent}
      >
        FK
      </text>
      <text
        x={36}
        y={58}
        fontFamily={FONTS.columnName}
        fontSize={11}
        fill={colors.columnText}
      >
        Foreign Key
      </text>

      {/* Relationship edge sample */}
      <line
        x1={12}
        y1={76}
        x2={48}
        y2={76}
        stroke={colors.edgeAccents[0]}
        strokeWidth={1.5}
        markerEnd="url(#arrowhead-0)"
      />
      <text
        x={58}
        y={80}
        fontFamily={FONTS.columnName}
        fontSize={11}
        fill={colors.columnText}
      >
        Relationship
      </text>
    </g>
  );
}
