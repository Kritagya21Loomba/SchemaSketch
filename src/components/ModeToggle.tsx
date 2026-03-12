import type { SchemaMode } from '../types/schema';

interface ModeToggleProps {
  mode: SchemaMode;
  onChange: (mode: SchemaMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div style={{
      display: 'flex',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid var(--card-border)',
    }}>
      {(['sql', 'json'] as SchemaMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: mode === m ? 'var(--card-border)' : 'transparent',
            color: mode === m ? 'var(--header-text)' : 'var(--type-text)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
