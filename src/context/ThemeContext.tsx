'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface ThemeContextValue {
  isDark: true;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: true });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
