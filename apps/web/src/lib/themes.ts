export type ThemeName = 'dark' | 'light' | 'lilac' | 'system' | 'alliance' | 'cofounder' | 'minimal' | 'apricot' | 'terra';

/**
 * Which class and `data-theme` each theme puts on <html>. One table for the
 * boot script in the root layout, `applyTheme` here and `RoleTheme`, so the
 * first paint and every later switch agree. `light` is the AI Studio
 * prototype's look (`data-theme="studio"`, docs §63); `lilac` is the Light
 * theme before it, kept as a choice.
 */
export const THEME_ROOT: Record<Exclude<ThemeName, 'system'>, { mode: 'light' | 'dark'; dataTheme: string | null }> = {
  light: { mode: 'light', dataTheme: 'studio' },
  lilac: { mode: 'light', dataTheme: null },
  dark: { mode: 'dark', dataTheme: null },
  alliance: { mode: 'light', dataTheme: 'alliance' },
  cofounder: { mode: 'dark', dataTheme: 'cofounder' },
  minimal: { mode: 'light', dataTheme: 'minimal' },
  apricot: { mode: 'light', dataTheme: 'apricot' },
  terra: { mode: 'light', dataTheme: 'terra' },
};

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '224.3 76.3% 48%',
  },
  lilac: {
    // The Light theme before 2026-10-20; globals.css :root owns the live tokens.
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 50.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '221.2 83.2% 53.3%',
  },
  light: {
    // Legacy inline fallback only; globals.css html[data-theme="studio"] owns the live tokens.
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 50.2%', /* WCAG AA with white foreground */
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '221.2 83.2% 53.3%',
  },
  system: {
    // System theme with distinct slate-blue tones (clearly different from dark)
    background: '215 28% 17%', // Slate blue background
    foreground: '210 20% 98%',
    card: '215 25% 20%', // Slightly lighter slate
    cardForeground: '210 20% 98%',
    popover: '215 25% 20%',
    popoverForeground: '210 20% 98%',
    primary: '199 89% 36%',
    primaryForeground: '0 0% 100%',
    secondary: '215 20% 25%',
    secondaryForeground: '210 20% 98%',
    muted: '215 20% 25%',
    mutedForeground: '215 16% 70%',
    accent: '199 89% 36%',
    accentForeground: '0 0% 100%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 100%',
    border: '215 20% 30%',
    input: '215 20% 30%',
    ring: '199 89% 36%',
  },
  alliance: {
    // "Cyan" — legacy inline fallback only; globals.css owns the live tokens.
    background: '195 26% 96%', // #eef6f7
    foreground: '220 100% 3%', // #000724
    card: '0 0% 100%', // #ffffff
    cardForeground: '220 100% 3%',
    popover: '180 25% 98%', // #f8fbfc
    popoverForeground: '220 100% 3%',
    primary: '34 100% 52%', // amber accent — pair with dark primaryForeground
    primaryForeground: '220 100% 3%',
    secondary: '200 15% 88%', // #d9e0e3
    secondaryForeground: '220 100% 3%',
    muted: '180 25% 98%',
    mutedForeground: '210 5% 44%', // WCAG AA on cream background
    accent: '34 100% 52%',
    accentForeground: '220 100% 3%',
    destructive: '0 84% 50%',
    destructiveForeground: '0 0% 100%',
    border: '200 15% 88%',
    input: '200 15% 88%',
    ring: '34 100% 52%',
  },
  cofounder: {
    // Cofounder-startapp inspired theme (modern, vibrant)
    background: '240 10% 4%', // Very dark blue-gray
    foreground: '0 0% 98%',
    card: '240 8% 8%',
    cardForeground: '0 0% 98%',
    popover: '240 8% 8%',
    popoverForeground: '0 0% 98%',
    primary: '262 83% 58%', // Vibrant purple
    primaryForeground: '0 0% 100%',
    secondary: '200 100% 50%', // Cyan accent
    secondaryForeground: '240 10% 4%',
    muted: '240 6% 15%',
    mutedForeground: '240 5% 65%',
    accent: '280 100% 55%', // WCAG AA with white foreground (was 70%)
    accentForeground: '0 0% 100%',
    destructive: '0 72% 51%',
    destructiveForeground: '0 0% 100%',
    border: '240 6% 15%',
    input: '240 6% 15%',
    ring: '262 83% 58%',
  },
  minimal: {
    // "Mint" — legacy inline fallback only; globals.css owns the live tokens.
    background: '40 20% 98%',
    foreground: '30 8% 12%',
    card: '0 0% 100%',
    cardForeground: '30 8% 12%',
    popover: '0 0% 100%',
    popoverForeground: '30 8% 12%',
    primary: '121.54 41.05% 37.3%',
    primaryForeground: '0 0% 100%',
    secondary: '40 14% 94%',
    secondaryForeground: '30 8% 16%',
    muted: '40 14% 95%',
    mutedForeground: '30 6% 38%',
    accent: '40 16% 93%',
    accentForeground: '30 8% 12%',
    destructive: '6 60% 42%',
    destructiveForeground: '0 0% 100%',
    border: '36 12% 88%',
    input: '36 10% 55%',
    ring: '120 32% 36%',
  },
  apricot: {
    // "Apricot" — legacy inline fallback only; globals.css owns the live tokens.
    background: '30 12% 96.6%',
    foreground: '24 10% 13%',
    card: '30 22% 99.3%',
    cardForeground: '24 10% 13%',
    popover: '0 0% 100%',
    popoverForeground: '24 10% 13%',
    primary: '24 33.5% 44.75%',
    primaryForeground: '0 0% 100%',
    secondary: '30 10% 94.4%',
    secondaryForeground: '24 10% 18%',
    muted: '30 10% 94%',
    mutedForeground: '26 6% 40%',
    accent: '30 14% 93%',
    accentForeground: '24 10% 13%',
    destructive: '350 30% 42.6%',
    destructiveForeground: '0 0% 100%',
    border: '30 10% 93.6%',
    input: '30 10% 92%',
    ring: '24 24.7% 42.5%',
  },
  terra: {
    // "Terracotta" — legacy inline fallback only; globals.css owns the live tokens.
    background: '12 18% 95.8%',
    foreground: '12 12% 12%',
    card: '12 26% 98.6%',
    cardForeground: '12 12% 13%',
    popover: '0 0% 100%',
    popoverForeground: '12 12% 13%',
    primary: '6.88 27.11% 44.12%',
    primaryForeground: '0 0% 100%',
    secondary: '12 14% 93%',
    secondaryForeground: '12 10% 17%',
    muted: '12 14% 92.5%',
    mutedForeground: '12 7% 38%',
    accent: '12 18% 92.5%',
    accentForeground: '12 10% 12%',
    destructive: '335 30% 42.6%',
    destructiveForeground: '0 0% 100%',
    border: '12 16% 91%',
    input: '12 16% 87%',
    ring: '6.88 30% 43.5%',
  },
};

export function applyTheme(themeName: ThemeName) {
  const root = document.documentElement;

  // Remove all theme classes and data-theme attribute
  root.classList.remove('dark', 'light');
  root.removeAttribute('data-theme');
  // Clear any previously inline-set CSS vars from old applyTheme calls
  const varsToClear = Object.keys(themes.dark).map(
    (k) => `--${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`
  );
  varsToClear.forEach((v) => root.style.removeProperty(v));

  // Apply the new theme using classes + data-theme (matching globals.css definitions)
  switch (themeName) {
    case 'dark':
      root.classList.add('dark');
      break;
    case 'light':
      // The AI Studio prototype's look (docs §63).
      root.classList.add('light');
      root.setAttribute('data-theme', 'studio');
      break;
    case 'lilac':
      // The Light theme before it: :root's palette and the role hues.
      root.classList.add('light');
      break;
    case 'system': {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
      root.setAttribute('data-theme', 'system');
      break;
    }
    case 'alliance':
      root.classList.add('light');
      root.setAttribute('data-theme', 'alliance');
      break;
    case 'cofounder':
      root.classList.add('dark');
      root.setAttribute('data-theme', 'cofounder');
      break;
    case 'apricot':
      root.classList.add('light');
      root.setAttribute('data-theme', 'apricot');
      break;
    case 'terra':
      root.classList.add('light');
      root.setAttribute('data-theme', 'terra');
      break;
    case 'minimal':
      // Light-first: the `light` class supplies the base, and data-theme
      // carries both the palette and the component layer.
      root.classList.add('light');
      root.setAttribute('data-theme', 'minimal');
      break;
  }

  // Store theme preference
  localStorage.setItem('theme', themeName);
}

export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('theme') as ThemeName;
  if (stored && themes[stored]) return stored;

  // No saved choice: resolve to what the OS asks for, matching RoleTheme.
  return getSystemTheme();
}

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
