'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette, Sparkles, Check, Minus } from 'lucide-react';
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
import { BilingualText } from '@/components/common/BilingualText';
import { translate } from '@/lib/i18n/translate';

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
    swatch: ['#eef6f7', '#e8940a', '#fafdfd'],
  },
  {
    name: 'cofounder' as ThemeName,
    label: 'Cofounder',
    description: 'Modern & vibrant',
    icon: Sparkles,
    swatch: ['#0a0a14', '#9333ea', '#00ccff'],
  },
  {
    name: 'minimal' as ThemeName,
    label: 'Minimal',
    description: 'Warm paper, quiet chrome',
    icon: Minus,
    swatch: ['#faf8f5', '#237a86', '#e8e4dc'],
  },
];

export function ThemeSwitcher({ className }: { className?: string }) {
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
      <Button aria-label="Change theme" variant="ghost" size="icon" className={cn('relative h-9 w-9', className)}>
        <Moon className="icon-sm" />
      </Button>
    );
  }

  const CurrentIcon = themeConfig.find((t) => t.name === currentTheme)?.icon || Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative h-9 w-9', className)} aria-label={t('Theme')}>
          <CurrentIcon className="icon-sm transition-all" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <BilingualText en="Choose Theme" el={translate('el', 'Choose Theme')} compact />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {themeConfig.map((theme, idx) => {
          const isActive = currentTheme === theme.name;
          return (
            <div key={theme.name}>
              {idx === 3 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    <BilingualText
                      en="Custom Themes"
                      el={translate('el', 'Custom Themes')}
                      compact
                      secondaryClassName="text-muted-foreground/60"
                    />
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
                <div className="min-w-0 flex-1">
                  <BilingualText
                    en={theme.label}
                    el={translate('el', theme.label)}
                    stacked
                    primaryClassName="text-sm font-medium leading-tight"
                    secondaryClassName="leading-tight"
                  />
                  <BilingualText
                    en={theme.description}
                    el={translate('el', theme.description)}
                    stacked
                    primaryClassName="text-[11px] leading-tight text-muted-foreground"
                    secondaryClassName="text-[11px] leading-tight text-muted-foreground"
                  />
                </div>
                {isActive && <Check className="ml-auto icon-sm text-primary-accessible shrink-0" />}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
