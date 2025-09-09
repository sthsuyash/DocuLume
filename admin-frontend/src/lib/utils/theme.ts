import type { Theme } from '@/types/theme';

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('admin-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage unavailable
  }
  return 'light';
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem('admin-theme', theme);
  } catch {
    // localStorage unavailable
  }
}
