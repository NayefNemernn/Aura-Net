import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    // Read from localStorage first, then fall back to the class already on <html>
    // (set by the flash-prevention inline script in index.html)
    const stored = localStorage.getItem('aura-theme');
    if (stored) return stored;
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggle, isLight: theme === 'light' };
}
