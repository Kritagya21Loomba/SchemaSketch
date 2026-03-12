import React from 'react';

interface ToolbarProps {
  children: React.ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '12px',
    }}>
      {children}
    </div>
  );
}
