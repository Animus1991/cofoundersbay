'use client';

import { Moon, Sun, Monitor, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/layout/RoleTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
    minimal: Minus,
  };

  const CurrentIcon = icons[theme] || Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Toggle theme" variant="ghost" size="icon" className="h-9 w-9">
          <CurrentIcon className="h-4 w-4 transition-transform hover:rotate-12" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="icon-sm" aria-hidden="true" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="icon-sm" aria-hidden="true" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="icon-sm" aria-hidden="true" />
          System
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('minimal')} className="gap-2">
          <Minus className="icon-sm" aria-hidden="true" />
          Minimal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
