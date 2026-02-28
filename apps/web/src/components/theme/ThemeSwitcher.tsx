'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette, Sparkles } from 'lucide-react';
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

const themeConfig = [
  {
    name: 'dark' as ThemeName,
    label: 'Dark',
    description: 'Classic dark theme',
    icon: Moon,
  },
  {
    name: 'light' as ThemeName,
    label: 'Light',
    description: 'Classic light theme',
    icon: Sun,
  },
  {
    name: 'system' as ThemeName,
    label: 'System',
    description: 'Adaptive system theme',
    icon: Monitor,
  },
  {
    name: 'alliance' as ThemeName,
    label: 'Alliance',
    description: 'Professional & clean',
    icon: Palette,
  },
  {
    name: 'cofounder' as ThemeName,
    label: 'Cofounder',
    description: 'Modern & vibrant',
    icon: Sparkles,
  },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('dark');
  const [mounted, setMounted] = useState(false);

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
      <Button variant="ghost" size="icon" className="relative">
        <Moon className="h-5 w-5" />
      </Button>
    );
  }

  const CurrentIcon = themeConfig.find((t) => t.name === currentTheme)?.icon || Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CurrentIcon className="h-5 w-5 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeConfig.slice(0, 3).map((theme) => {
          const Icon = theme.icon;
          return (
            <DropdownMenuItem
              key={theme.name}
              onClick={() => handleThemeChange(theme.name)}
              className={cn(
                'flex items-start gap-3 cursor-pointer',
                currentTheme === theme.name && 'bg-accent'
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{theme.label}</span>
                <span className="text-xs text-muted-foreground">{theme.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Premium Themes
        </DropdownMenuLabel>

        {themeConfig.slice(3).map((theme) => {
          const Icon = theme.icon;
          return (
            <DropdownMenuItem
              key={theme.name}
              onClick={() => handleThemeChange(theme.name)}
              className={cn(
                'flex items-start gap-3 cursor-pointer',
                currentTheme === theme.name && 'bg-accent'
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{theme.label}</span>
                <span className="text-xs text-muted-foreground">{theme.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
