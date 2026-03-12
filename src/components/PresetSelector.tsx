import type { Preset } from '../presets';

interface PresetSelectorProps {
  presets: Preset[];
  onSelect: (preset: Preset) => void;
}

export function PresetSelector({ presets, onSelect }: PresetSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {presets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset)}
          style={{
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            background: 'transparent',
            color: 'var(--column-text)',
            border: '1px solid var(--card-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--fk-accent)';
            e.currentTarget.style.color = 'var(--header-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--card-border)';
            e.currentTarget.style.color = 'var(--column-text)';
          }}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
