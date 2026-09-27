import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export interface ThemeTokens {
  /* Shell */
  bg: string;
  sidebar: string;
  sidebarBorder: string;
  divider: string;
  toggleColor: string;
  userCard: string;
  userCardBorder: string;
  /* Nav */
  navActive: string;
  navHover: string;
  navText: string;
  navTextActive: string;
  /* Text */
  text: string;
  textMid: string;
  textDim: string;
  /* Surfaces */
  card: string;
  cardAlt: string;
  cardDim: string;
  cardBorder: string;
  cardBorderStrong: string;
  /* Inputs */
  input: string;
  inputBorder: string;
  /* Code / mono labels */
  codeBg: string;
}

const DARK: ThemeTokens = {
  bg: '#030E1C',
  sidebar: '#050F1E',
  sidebarBorder: 'rgba(8,145,178,0.1)',
  divider: 'rgba(8,145,178,0.08)',
  toggleColor: '#D9EEF7',
  userCard: 'rgba(8,145,178,0.06)',
  userCardBorder: 'rgba(8,145,178,0.12)',
  navActive: 'rgba(8,145,178,0.12)',
  navHover: 'rgba(8,145,178,0.06)',
  navText: '#2E5B75',
  navTextActive: '#22D3EE',
  text: '#D9EEF7',
  textMid: '#6DA8C4',
  textDim: '#2E5B75',
  card: 'rgba(15,22,32,0.7)',
  cardAlt: 'rgba(15,22,32,0.5)',
  cardDim: 'rgba(15,22,32,0.4)',
  cardBorder: 'rgba(8,145,178,0.1)',
  cardBorderStrong: 'rgba(8,145,178,0.18)',
  input: 'rgba(8,145,178,0.05)',
  inputBorder: 'rgba(8,145,178,0.15)',
  codeBg: 'rgba(8,145,178,0.06)',
};

const LIGHT: ThemeTokens = {
  bg: '#EDF5FC',
  sidebar: '#FFFFFF',
  sidebarBorder: 'rgba(8,145,178,0.18)',
  divider: 'rgba(8,145,178,0.12)',
  toggleColor: '#0A1628',
  userCard: 'rgba(8,145,178,0.06)',
  userCardBorder: 'rgba(8,145,178,0.15)',
  navActive: 'rgba(8,145,178,0.1)',
  navHover: 'rgba(8,145,178,0.05)',
  navText: '#4A7FA0',
  navTextActive: '#0891B2',
  text: '#0A1628',
  textMid: '#1E5070',
  textDim: '#5A8FAA',
  card: 'rgba(255,255,255,0.95)',
  cardAlt: 'rgba(255,255,255,0.75)',
  cardDim: 'rgba(255,255,255,0.55)',
  cardBorder: 'rgba(8,145,178,0.14)',
  cardBorderStrong: 'rgba(8,145,178,0.22)',
  input: 'rgba(255,255,255,0.8)',
  inputBorder: 'rgba(8,145,178,0.2)',
  codeBg: 'rgba(8,145,178,0.07)',
};

interface DashThemeCtx {
  theme: Theme;
  tokens: ThemeTokens;
  toggle: () => void;
}

const Ctx = createContext<DashThemeCtx>({
  theme: 'dark',
  tokens: DARK,
  toggle: () => {},
});

export function DashThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('vvs-theme');
    const initial = stored === 'light' || stored === 'dark'
      ? stored
      : document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      setTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      window.localStorage.setItem('vvs-theme', next);
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transition = document.startViewTransition?.bind(document);
    if (!transition || reducedMotion) {
      apply();
      return;
    }
    transition(apply);
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, tokens: theme === 'dark' ? DARK : LIGHT, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useDashTheme = () => useContext(Ctx);
