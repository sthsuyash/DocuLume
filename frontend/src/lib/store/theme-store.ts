import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

const applyTheme = (resolved: 'light' | 'dark') => {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch { /* ignore */ }
  return 'light';
};

const initialTheme = getInitialTheme();
const initialResolved = resolveTheme(initialTheme);
if (typeof window !== 'undefined') {
  applyTheme(initialResolved);

  // Watch OS preference changes when in "system" mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      const resolved = e.matches ? 'dark' : 'light';
      applyTheme(resolved);
      useThemeStore.setState({ resolvedTheme: resolved });
    }
  });
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  resolvedTheme: initialResolved,

  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.resolvedTheme === 'light' ? 'dark' : 'light';
      const resolved = resolveTheme(next);
      applyTheme(resolved);
      try { localStorage.setItem('theme', next); } catch { /* ignore */ }
      return { theme: next, resolvedTheme: resolved };
    }),

  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
    set({ theme, resolvedTheme: resolved });
  },
}));
