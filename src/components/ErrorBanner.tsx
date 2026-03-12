import type { ParseError } from '../types/schema';

interface ErrorBannerProps {
  errors: ParseError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--error-bg)',
      border: '1px solid var(--error-border)',
      borderRadius: '6px',
      marginTop: '8px',
      maxHeight: '120px',
      overflowY: 'auto',
    }}>
      {errors.map((err, i) => (
        <div key={i} style={{
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--error-text)',
          lineHeight: 1.5,
        }}>
          {err.line !== undefined && (
            <span style={{ color: 'var(--type-text)', marginRight: '8px' }}>
              line {err.line}
            </span>
          )}
          {err.message}
        </div>
      ))}
    </div>
  );
}
