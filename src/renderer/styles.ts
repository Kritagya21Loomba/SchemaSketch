export const COLORS = {
  background: '#0e0e11',
  cardBg: '#1a1a1f',
  cardBorder: '#2a2a32',
  headerText: '#e8e8ec',
  columnText: '#b0b0b8',
  typeText: '#606068',
  divider: '#2a2a32',
  pkAccent: '#ffcc00',
  fkAccent: '#00e5ff',
  edgeAccents: ['#00e5ff', '#ff0080', '#7c4dff', '#00e676', '#ffab00'],
} as const;

export const DIMS = {
  headerHeight: 44,
  rowHeight: 28,
  bottomPadding: 12,
  nodeMinWidth: 200,
  nodeMaxWidth: 320,
  hPadding: 16,
  cardRadius: 8,
  hGap: 100,
  vGap: 80,
  charWidthBold: 8.5,
  charWidthMono: 7.2,
} as const;

export const FONTS = {
  tableName: "'Inter', 'Helvetica Neue', sans-serif",
  columnName: "'JetBrains Mono', 'Fira Code', monospace",
} as const;
