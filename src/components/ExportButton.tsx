interface ExportButtonProps {
  onExport: () => void;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  return (
    <button
      onClick={onExport}
      style={{
        padding: '6px 14px',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        background: 'var(--fk-accent)',
        color: '#0e0e11',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      Export PNG
    </button>
  );
}
