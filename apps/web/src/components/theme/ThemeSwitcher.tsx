'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { applyTheme, getStoredTheme, type ThemeName } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/common/I18nProvider';

const themeConfig = [
  {
    name: 'dark' as ThemeName,
    label: 'Dark',
    description: 'Classic dark theme',
    icon: Moon,
    swatch: ['#0f172a', '#8b5cf6', '#1e293b'],
  },
  {
    name: 'light' as ThemeName,
    label: 'Light',
    description: 'Classic light theme',
    icon: Sun,
    swatch: ['#f8fafc', '#6366f1', '#e2e8f0'],
  },
  {
    name: 'system' as ThemeName,
    label: 'System',
    description: 'Adapts to OS preference',
    icon: Monitor,
    swatch: ['#172035', '#06b6d4', '#1e3a52'],
  },
  {
    name: 'alliance' as ThemeName,
    label: 'Alliance',
    description: 'Professional & clean',
    icon: Palette,
    swatch: ['#eef6f7', '#efa758', '#fafdfd'],
  },
  {
    name: 'cofounder' as ThemeName,
    label: 'Cofounder',
    description: 'Modern & vibrant',
    icon: Sparkles,
    swatch: ['#0a0a14', '#9333ea', '#00ccff'],
  },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('dark');
  const [mounted, setMounted] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setMounted(true);
    const theme = getStoredTheme();
    setCurrentTheme(theme);
    applyTheme(theme);
  }, []);

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  const CurrentIcon = themeConfig.find((t) => t.name === currentTheme)?.icon || Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <CurrentIcon className="h-4 w-4 transition-all" />
          <span className="sr-only">{t('Theme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('Choose Theme')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeConfig.map((theme, idx) => {
          const isActive = currentTheme === theme.name;
          return (
            <div key={theme.name}>
              {idx === 3 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {t('Custom Themes')}
                  </DropdownMenuLabel>
                </>
              )}
              <DropdownMenuItem
                onClick={() => handleThemeChange(theme.name)}
                className={cn(
                  'flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2',
                  isActive && 'bg-accent/60'
                )}
              >
                <div className="flex shrink-0 overflow-hidden rounded-md border border-border/50" style={{ width: 36, height: 28 }}>
                  <div style={{ background: theme.swatch[0], flex: 1 }} />
                  <div style={{ background: theme.swatch[1], width: 8 }} />
                  <div style={{ background: theme.swatch[2], width: 8 }} />
                </div>
                <div className="flex flex-col gap-0">
                  <span className="text-sm font-medium leading-tight">{t(theme.label)}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{t(theme.description)}</span>
                </div>
                {isActive && <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
