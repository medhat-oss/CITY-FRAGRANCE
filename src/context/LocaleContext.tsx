'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LocaleConfig } from '@/types';

interface LocaleContextValue extends LocaleConfig {
  setLocale: (locale: string, dir: 'ltr' | 'rtl') => void;
  toggleDirection: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LocaleConfig>({
    locale: 'en',
    dir: 'ltr',
  });

  const setLocale = useCallback((locale: string, dir: 'ltr' | 'rtl') => {
    setConfig({ locale, dir });
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, []);

  const toggleDirection = useCallback(() => {
    setConfig((prev) => {
      const dir = prev.dir === 'ltr' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      return { ...prev, dir };
    });
  }, []);

  return (
    <LocaleContext.Provider value={{ ...config, setLocale, toggleDirection }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
