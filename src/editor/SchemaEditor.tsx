import { useRef } from 'react';
import { useCodeMirror } from './useCodeMirror';
import { useTheme } from '../theme';
import type { SchemaMode } from '../types/schema';

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: SchemaMode;
}

export function SchemaEditor({ value, onChange, mode }: SchemaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  useCodeMirror(containerRef, value, onChange, mode, theme.name);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        borderRadius: '8px',
        border: '1px solid var(--card-border)',
      }}
    />
  );
}
