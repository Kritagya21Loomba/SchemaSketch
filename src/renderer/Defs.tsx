import { useTheme } from '../theme';

export function Defs() {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <defs>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
        <feBlend in="SourceGraphic" mode={theme.name === 'dark' ? 'multiply' : 'overlay'} />
      </filter>

      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill={colors.fkAccent} />
      </marker>

      {colors.edgeAccents.map((color, i) => (
        <marker
          key={i}
          id={`arrowhead-${i}`}
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      ))}

      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="card-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor={colors.shadowColor} floodOpacity={colors.shadowOpacity} />
      </filter>
    </defs>
  );
}
