'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Compass,
  User,
  Settings,
  LogOut,
  MessageCircle,
  Sun,
  Moon,
  Users,
  Sparkles,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from '@/components/layout/RoleTheme';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { bilingualInline } from '@/lib/i18n/format';
import { BilingualText } from '@/components/common/BilingualText';
import { useStoredUser } from '@/hooks/useStoredUser';
import { foldText, searchPages } from '@/lib/page-search';
import { FileText } from 'lucide-react';

type CommandItem = {
  id: string;
  label: string;
  labelEl?: string;
  description?: string;
  descriptionEl?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** The page a navigation command opens, so a page search does not list it twice. */
  path?: string;
  shortcut?: string[];
  action: () => void;
  category: 'navigation' | 'pages' | 'actions' | 'settings' | 'help';
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the `?` shortcut reference — supplied by the host so `?` works globally too. */
  onOpenShortcuts?: () => void;
};

export function CommandPalette({ open, onOpenChange, onOpenShortcuts }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'home',
      label: 'Go to Home',
      labelEl: 'Μετάβαση στην αρχική',
      description: 'Return to homepage',
      descriptionEl: 'Επιστροφή στην αρχική σελίδα',
      icon: Home,
      shortcut: ['G', 'H'],
      path: '/',
      action: () => router.push('/'),
      category: 'navigation',
    },
    {
      id: 'discover',
      label: 'Go to Discover',
      labelEl: 'Μετάβαση στην Εξερεύνηση',
      description: 'Find founders, mentors, investors',
      descriptionEl: 'Βρείτε ιδρυτές, μέντορες, επενδυτές',
      icon: Compass,
      shortcut: ['G', 'D'],
      path: '/discover',
      action: () => router.push('/discover'),
      category: 'navigation',
    },
    {
      id: 'profile',
      label: 'Go to Profile',
      labelEl: 'Μετάβαση στο προφίλ',
      description: 'View your profile',
      descriptionEl: 'Δείτε το προφίλ σας',
      icon: User,
      shortcut: ['G', 'P'],
      path: '/profile',
      action: () => router.push('/profile'),
      category: 'navigation',
    },
    {
      id: 'ai-assistant',
      label: 'Go to AI Assistant',
      labelEl: 'Μετάβαση στον βοηθό AI',
      description: 'Full-page copilot workspace',
      descriptionEl: 'Ο βοηθός σε πλήρη σελίδα',
      icon: Sparkles,
      shortcut: ['G', 'A'],
      path: '/ai',
      action: () => router.push('/ai'),
      category: 'navigation',
    },
    {
      id: 'messages',
      label: 'Go to Messages',
      labelEl: 'Μετάβαση στα μηνύματα',
      description: 'View your conversations',
      descriptionEl: 'Δείτε τις συνομιλίες σας',
      icon: MessageCircle,
      shortcut: ['G', 'M'],
      path: '/messages',
      action: () => router.push('/messages'),
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      labelEl: 'Μετάβαση στις ρυθμίσεις',
      description: 'Manage your account',
      descriptionEl: 'Διαχείριση λογαριασμού',
      icon: Settings,
      shortcut: ['G', 'S'],
      path: '/settings',
      action: () => router.push('/settings'),
      category: 'navigation',
    },

    // Actions
    {
      id: 'ask-ai',
      label: 'Ask AI…',
      labelEl: 'Ρωτήστε το AI…',
      description: 'Start a new assistant conversation',
      descriptionEl: 'Νέα συνομιλία με τον βοηθό',
      icon: Sparkles,
      path: '/ai',
      action: () => router.push('/ai'),
      category: 'actions',
    },
    {
      id: 'search',
      label: 'Search profiles',
      labelEl: 'Αναζήτηση προφίλ',
      description: 'Find people by name or skills',
      descriptionEl: 'Βρείτε άτομα με όνομα ή δεξιότητες',
      icon: Search,
      shortcut: ['/'],
      path: '/discover',
      action: () => router.push('/discover'),
      category: 'actions',
    },
    {
      id: 'matches',
      label: 'View matches',
      labelEl: 'Οι αντιστοιχίσεις σας',
      description: 'People who complement you, with the reasons',
      descriptionEl: 'Άτομα που σας συμπληρώνουν, με τους λόγους',
      icon: Users,
      path: '/matches',
      action: () => router.push('/matches'),
      category: 'actions',
    },
    {
      id: 'recommendations',
      label: 'Get recommendations',
      labelEl: 'Προτάσεις',
      description: 'AI-powered suggestions',
      descriptionEl: 'Προτάσεις με AI',
      icon: Sparkles,
      path: '/recommendations',
      action: () => router.push('/recommendations'),
      category: 'actions',
    },
    {
      id: 'shortlist',
      label: 'Open saved profiles',
      labelEl: 'Αποθηκευμένα προφίλ',
      description: 'People you shortlisted',
      descriptionEl: 'Άτομα στη λίστα σας',
      icon: Users,
      path: '/shortlist',
      action: () => router.push('/shortlist'),
      category: 'actions',
    },

    // Settings
    {
      id: 'theme-light',
      label: 'Switch to Light mode',
      labelEl: 'Φωτεινό θέμα',
      icon: Sun,
      action: () => setTheme('light'),
      category: 'settings',
    },
    {
      id: 'theme-dark',
      label: 'Switch to Dark mode',
      labelEl: 'Σκούρο θέμα',
      icon: Moon,
      action: () => setTheme('dark'),
      category: 'settings',
    },
    {
      id: 'logout',
      label: 'Sign out',
      labelEl: 'Αποσύνδεση',
      description: 'Log out of your account',
      descriptionEl: 'Έξοδος από τον λογαριασμό',
      icon: LogOut,
      action: () => {
        clearPreviewDemoSession();
        router.push('/login');
      },
      category: 'settings',
    },

    // Help
    {
      id: 'shortcuts',
      label: 'Keyboard shortcuts',
      labelEl: 'Συντομεύσεις πληκτρολογίου',
      description: 'View all shortcuts',
      descriptionEl: 'Όλες οι συντομεύσεις',
      icon: Keyboard,
      shortcut: ['?'],
      action: () => onOpenShortcuts?.(),
      category: 'help',
    },
    {
      id: 'help',
      label: 'Help & Support',
      labelEl: 'Βοήθεια και υποστήριξη',
      description: 'Get help with CoFounderBay',
      descriptionEl: 'Βοήθεια για το CoFounderBay',
      icon: HelpCircle,
      path: '/help',
      action: () => router.push('/help'),
      category: 'help',
    },
  ], [router, setTheme, onOpenShortcuts]);

  // Filter commands in either language, accents ignored; then every page that
  // fits the words, for this reader's role; then hand the words to the assistant.
  const reader = useStoredUser();
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const q = foldText(search.trim());
    const own = commands.filter((cmd) =>
      [cmd.label, cmd.labelEl, cmd.description, cmd.descriptionEl].some((t) => t && foldText(t).includes(q)),
    );
    const taken = new Set(own.map((cmd) => cmd.path).filter(Boolean));
    const pages: CommandItem[] = searchPages(search, reader?.role)
      .filter((p) => !taken.has(p.path))
      .map((p) => ({
        id: `page:${p.path}`,
        label: p.title,
        labelEl: p.titleEl,
        description: p.description,
        descriptionEl: p.descriptionEl,
        icon: FileText,
        action: () => router.push(p.path),
        category: 'pages' as const,
      }));
    const ask: CommandItem = {
      id: 'ask-ai-query',
      label: `Ask the assistant: “${search.trim()}”`,
      labelEl: `Ρωτήστε τον βοηθό: «${search.trim()}»`,
      description: 'It reads your workspace and asks before it changes anything',
      descriptionEl: 'Διαβάζει τον χώρο εργασίας σας και ρωτά πριν αλλάξει κάτι',
      icon: Sparkles,
      action: () => router.push(`/ai?q=${encodeURIComponent(search.trim())}`),
      category: 'actions',
    };
    return [...own, ...pages, ask];
  }, [commands, search, reader?.role, router]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      pages: [],
      actions: [],
      settings: [],
      help: [],
    };
    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onOpenChange(false);
          }
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    },
    [filteredCommands, selectedIndex, onOpenChange]
  );

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const categoryLabels: Record<string, { en: string; el: string }> = {
    navigation: { en: 'Navigation', el: 'Πλοήγηση' },
    pages: { en: 'Pages', el: 'Σελίδες' },
    actions: { en: 'Actions', el: 'Ενέργειες' },
    settings: { en: 'Settings', el: 'Ρυθμίσεις' },
    help: { en: 'Help', el: 'Βοήθεια' },
  };

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[min(70dvh,calc(100svh_-_5.5rem))] flex-col gap-0 overflow-hidden p-0 max-md:top-[max(0.5rem,env(safe-area-inset-top))] max-md:translate-y-0 md:max-h-[min(92dvh,720px)] md:max-w-lg"
      >
        <DialogTitle className="sr-only">{bilingualInline('Command palette', 'Παλέτα εντολών')}</DialogTitle>
        {/* Search input */}
        <div className="shrink-0 border-b border-border p-4 pr-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder={bilingualInline("Type a command or search…", "Πληκτρολογήστε εντολή ή αναζήτηση…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 bg-transparent pl-9 focus-visible:ring-0"
              autoFocus
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-2xs font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
        </div>

        {/* Command list */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <BilingualText en="No commands found" el="Δεν βρέθηκαν εντολές" compact />
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <BilingualText en={categoryLabels[category].en} el={categoryLabels[category].el} compact />
                  </div>
                  {items.map((cmd) => {
                    const currentFlatIndex = flatIndex++;
                    const isSelected = currentFlatIndex === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onOpenChange(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                        className={cn(
                          'flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors md:min-h-0 md:py-2',
                          isSelected
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <cmd.icon className="icon-sm flex-shrink-0" />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-medium"><BilingualText en={cmd.label} el={cmd.labelEl} compact wrap /></p>
                          {cmd.description && (
                            <p className="text-xs text-muted-foreground"><BilingualText en={cmd.description} el={cmd.descriptionEl} wrap /></p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className="hidden items-center gap-1 md:flex">
                            {cmd.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1 font-mono text-2xs text-muted-foreground"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="hidden shrink-0 items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground md:flex">
          <span><BilingualText en="Navigate with ↑↓ keys" el="Πλοήγηση με τα πλήκτρα ↑↓" compact /></span>
          <span><BilingualText en="Press Enter to select" el="Enter για επιλογή" compact /></span>
        </div>
        <div className="shrink-0 border-t border-border px-4 py-2 text-center text-xs text-muted-foreground md:hidden">
          <BilingualText en="Tap a result to go" el="Πατήστε ένα αποτέλεσμα για μετάβαση" compact />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to enable global keyboard shortcuts
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}
