import React from 'react';

interface LayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function Layout({ left, right }: LayoutProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--card-border)',
        overflow: 'hidden',
      }}>
        {left}
      </div>
      <div style={{
        overflow: 'hidden',
        position: 'relative',
      }}>
        {right}
      </div>
    </div>
  );
}
