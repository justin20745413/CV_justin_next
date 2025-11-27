'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark-orange' | 'blue-white';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 初始化讀取 localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    // 在客戶端環境下localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return savedTheme || 'dark-orange';
    }
    return 'dark-orange';
  });

  // useEffect 只同步 DOM，不更新 state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme =
      theme === 'dark-orange' ? 'blue-white' : 'dark-orange';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
