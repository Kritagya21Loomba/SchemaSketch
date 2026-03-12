import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ThemeColors {
  background: string;
  cardBg: string;
  cardBorder: string;
  headerText: string;
  columnText: string;
  typeText: string;
  divider: string;
  pkAccent: string;
  fkAccent: string;
  edgeAccents: string[];
  grainOpacity: number;
  shadowColor: string;
  shadowOpacity: number;
  errorBg: string;
  errorBorder: string;
  errorText: string;
}

export interface Theme {
  name: 'dark' | 'light';
  colors: ThemeColors;
}

export const DarkTheme: Theme = {
  name: 'dark',
  colors: {
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
    grainOpacity: 0.06,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    errorBg: '#2a1215',
    errorBorder: '#5c2028',
    errorText: '#ff6b7a',
  },
};

export const LightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#f5f5f7',
    cardBg: '#ffffff',
    cardBorder: '#d8d8dc',
    headerText: '#1a1a1f',
    columnText: '#3a3a42',
    typeText: '#8a8a94',
    divider: '#e0e0e4',
    pkAccent: '#d4a800',
    fkAccent: '#0088a3',
    edgeAccents: ['#0088a3', '#c4005e', '#5a35b5', '#00994d', '#cc8800'],
    grainOpacity: 0.02,
    shadowColor: '#00000020',
    shadowOpacity: 0.1,
    errorBg: '#fff0f0',
    errorBorder: '#ffcccc',
    errorText: '#cc3344',
  },
};

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DarkTheme,
  toggleTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DarkTheme);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev.name === 'dark' ? LightTheme : DarkTheme);
  }, []);

  // Sync CSS variables for HTML components
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty('--bg', c.background);
    root.style.setProperty('--card-bg', c.cardBg);
    root.style.setProperty('--card-border', c.cardBorder);
    root.style.setProperty('--header-text', c.headerText);
    root.style.setProperty('--column-text', c.columnText);
    root.style.setProperty('--type-text', c.typeText);
    root.style.setProperty('--divider', c.divider);
    root.style.setProperty('--pk-accent', c.pkAccent);
    root.style.setProperty('--fk-accent', c.fkAccent);
    root.style.setProperty('--error-bg', c.errorBg);
    root.style.setProperty('--error-border', c.errorBorder);
    root.style.setProperty('--error-text', c.errorText);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
