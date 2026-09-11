"use client";

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'system' | 'minimal';
type Role = 'founder' | 'mentor' | 'investor' | 'org' | null;

const roleClasses = ['role-founder', 'role-mentor', 'role-investor', 'role-org'];

type ThemeContextType = {
  theme: Theme;
  role: Role;
  setTheme: (theme: Theme) => void;
  setRole: (role: Role) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within RoleTheme');
  }
  return context;
}

export function RoleTheme({ children }: { children?: React.ReactNode }) {
  // Use consistent initial values for SSR/CSR to prevent hydration mismatch
  const [theme, setThemeState] = useState<Theme>('system');
  const [role, setRoleState] = useState<Role>(null);
  const [mounted, setMounted] = useState(false);

  // Apply theme and role classes
  const applyTheme = useCallback((newTheme: Theme, newRole: Role) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    
    // Handle dark/light mode. `minimal` is a light-based palette plus its own
    // component layer, both carried by the data-theme attribute; the attribute
    // is cleared for every other theme so none of them inherit it.
    root.classList.remove('dark', 'light');
    if (newTheme === 'minimal') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'minimal');
    } else {
      root.removeAttribute('data-theme');
      if (newTheme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(systemDark ? 'dark' : 'light');
      } else {
        root.classList.add(newTheme);
      }
    }

    // Handle role theme
    roleClasses.forEach((cls) => root.classList.remove(cls));
    if (newRole) {
      root.classList.add(`role-${newRole}`);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme, role);
  }, [applyTheme, role]);

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
    applyTheme(theme, newRole);
  }, [applyTheme, theme]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get stored theme
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'dark';
    setThemeState(initialTheme);

    // Get stored user role
    let initialRole: Role = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored) as { role?: string } | null;
        if (user?.role) {
          initialRole = user.role as Role;
          setRoleState(initialRole);
        }
      }
    } catch {
      // ignore invalid stored user
    }

    applyTheme(initialTheme, initialRole);
    setMounted(true);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (initialTheme === 'system') {
        applyTheme('system', initialRole);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        try {
          if (e.newValue) {
            const user = JSON.parse(e.newValue) as { role?: string };
            setRole(user.role as Role);
          } else {
            setRole(null);
          }
        } catch {
          // ignore
        }
      }
      if (e.key === 'theme') {
        setTheme((e.newValue as Theme) || 'dark');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setRole, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, role, setTheme, setRole }}>
      {children}
    </ThemeContext.Provider>
  );
}
