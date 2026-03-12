import type { Table } from '../types/schema';
import { COLORS, DIMS, FONTS } from './styles';

interface TableNodeProps {
  table: Table;
  x: number;
  y: number;
  width: number;
  height: number;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function TableNode({
  table,
  x,
  y,
  width,
  height,
  highlighted = false,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
}: TableNodeProps) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      data-table-node
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      style={{ cursor: 'grab' }}
    >
      {/* Card background */}
      <rect
        rx={DIMS.cardRadius}
        ry={DIMS.cardRadius}
        width={width}
        height={height}
        fill={COLORS.cardBg}
        stroke={highlighted ? COLORS.fkAccent : COLORS.cardBorder}
        strokeWidth={highlighted ? 2 : 1.5}
        filter={highlighted ? 'url(#glow)' : 'url(#card-shadow)'}
      />

      {/* Table name header */}
      <text
        x={width / 2}
        y={30}
        textAnchor="middle"
        fontFamily={FONTS.tableName}
        fontWeight={800}
        fontSize={13}
        letterSpacing="0.08em"
        fill={COLORS.headerText}
        style={{ textTransform: 'uppercase' } as React.CSSProperties}
      >
        {table.name.toUpperCase()}
      </text>

      {/* Divider */}
      <line
        x1={12}
        y1={DIMS.headerHeight - 2}
        x2={width - 12}
        y2={DIMS.headerHeight - 2}
        stroke={COLORS.divider}
        strokeWidth={1}
      />

      {/* Columns */}
      {table.columns.map((col, i) => {
        const rowY = DIMS.headerHeight + i * DIMS.rowHeight + 18;
        const isFk = col.isForeignKey;
        const isPk = col.isPrimaryKey;

        return (
          <g key={col.name} transform={`translate(0, ${rowY})`}>
            {isPk && (
              <text
                x={DIMS.hPadding}
                y={0}
                fontFamily={FONTS.columnName}
                fontSize={10}
                fontWeight={500}
                fill={COLORS.pkAccent}
              >
                PK
              </text>
            )}
            {isFk && !isPk && (
              <text
                x={DIMS.hPadding}
                y={0}
                fontFamily={FONTS.columnName}
                fontSize={10}
                fontWeight={500}
                fill={COLORS.fkAccent}
              >
                FK
              </text>
            )}
            <text
              x={isPk || isFk ? DIMS.hPadding + 28 : DIMS.hPadding}
              y={0}
              fontFamily={FONTS.columnName}
              fontSize={12}
              fill={isFk ? COLORS.fkAccent : COLORS.columnText}
            >
              {col.name}
            </text>
            <text
              x={width - DIMS.hPadding}
              y={0}
              textAnchor="end"
              fontFamily={FONTS.columnName}
              fontSize={11}
              fill={COLORS.typeText}
            >
              {col.type}
            </text>
          </g>
        );
      })}
    </g>
  );
}
