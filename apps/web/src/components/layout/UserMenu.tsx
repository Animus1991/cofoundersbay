"use client";

import Link from 'next/link';
import { LogOut, User, Settings, Edit, ChevronDown, Eye, EyeOff, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { useStoredUser } from '@/hooks/useStoredUser';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useDemoData } from '@/contexts/DemoDataContext';
import { useBilingualString, useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { cn, initialsOf } from '@/lib/utils';

/**
 * Secondary line shared by every menu entry. Sizing is deliberately NOT set here:
 * `.bilingual-secondary` (globals.css) already scales it to max(11px, 0.85em), so
 * the second language stays subordinate to the first at any container size. Adding
 * a fixed `text-sm` here would flatten that ratio to the primary's own size.
 * We only add wrapping, so a long Greek label is never clipped.
 */
const SECONDARY_LINE = 'whitespace-normal break-words';

/** Identity lines are user data, not translatable — they must wrap, never truncate. */
const IDENTITY_LINE = 'text-sm break-words whitespace-normal';

export function UserMenu({
  variant = 'toolbar',
  rail = false,
}: {
  variant?: 'toolbar' | 'sidebar';
  /** Icon-only square when the sidebar is a 68px rail. */
  rail?: boolean;
}) {
  const router = useRouter();
  const user = useStoredUser();
  const sayOne = useBilingualString();
  const { showDemoData, toggleDemoData } = useDemoData();
  const { displayMode, setDisplayMode } = useLanguagePreference();

  const initials =
    (user?.displayName ? initialsOf(user.displayName) : '') ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  // Name the trigger after whichever identity we actually hold. The email is used
  // only when there is no display name, and never appended to a name we already
  // have — an aria-label is announced in full, so it must not leak contact data.
  const identity = user?.displayName ?? user?.email ?? null;
  const triggerLabel = identity
    ? bilingualAria(`Account menu for ${identity}`, `Μενού λογαριασμού για ${identity}`)
    : bilingualAria('Account menu', 'Μενού λογαριασμού');

  const handleLogout = () => {
    clearPreviewDemoSession();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 text-sm transition-colors outline-none hover:bg-secondary/80 focus-visible:outline-none',
          variant === 'sidebar'
            ? rail
              ? 'mx-auto h-9 w-9 justify-center overflow-hidden p-0 lg:h-[36px] lg:w-[36px]'
              : 'h-9 w-full justify-center px-1.5 lg:justify-start lg:px-2'
            : 'h-9 px-1.5 sm:h-10 sm:px-2.5',
        )}
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary-accessible">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* One language on this row: the bilingual fallback clipped to
            "Acc…·Λογαρια…" inside the rail, and the dropdown already shows the
            full identity. The sidebar variant takes the row's whole width
            instead of the toolbar's 140px cap. */}
        <span
          className={cn(
            'truncate text-sm font-medium text-foreground',
            variant === 'sidebar'
              ? rail
                ? 'hidden'
                : 'hidden min-w-0 flex-1 text-left lg:inline'
              : 'hidden max-w-[140px] md:inline',
          )}
        >
          {user?.displayName ?? sayOne('Account', 'Λογαριασμός')}
        </span>
        <ChevronDown
          className={cn(
            'icon-sm text-muted-foreground',
            variant === 'sidebar'
              ? rail
                ? 'hidden'
                : 'hidden lg:block'
              : 'hidden md:block',
          )}
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex min-w-0 flex-col space-y-1">
            <p className={`font-medium leading-tight ${IDENTITY_LINE}`}>
              {user?.displayName ?? <BilingualText en="User" el="Χρήστης" />}
            </p>
            {user?.email && (
              <p className={`text-muted-foreground ${IDENTITY_LINE}`}>{user.email}</p>
            )}
            {user?.role && (
              <p className={`capitalize text-primary-accessible ${IDENTITY_LINE}`}>{user.role}</p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 icon-sm shrink-0" aria-hidden="true" />
            <BilingualText en="My Profile" el="Το προφίλ μου" secondaryClassName={SECONDARY_LINE} />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile/edit">
            <Edit className="mr-2 icon-sm shrink-0" aria-hidden="true" />
            <BilingualText en="Edit Profile" el="Επεξεργασία προφίλ" secondaryClassName={SECONDARY_LINE} />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 icon-sm shrink-0" aria-hidden="true" />
            <BilingualText en="Settings" el="Ρυθμίσεις" secondaryClassName={SECONDARY_LINE} />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => setDisplayMode(displayMode === 'bilingual' ? 'primary-only' : 'bilingual')}
        >
          <Languages className="mr-2 icon-sm shrink-0" aria-hidden="true" />
          <BilingualText
            en={displayMode === 'bilingual' ? 'Primary language only' : 'Bilingual display'}
            el={displayMode === 'bilingual' ? 'Μόνο κύρια γλώσσα' : 'Δίγλωσση εμφάνιση'}
            secondaryClassName={SECONDARY_LINE}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggleDemoData}>
          {showDemoData
            ? <Eye className="mr-2 icon-sm shrink-0" aria-hidden="true" />
            : <EyeOff className="mr-2 icon-sm shrink-0" aria-hidden="true" />}
          <BilingualText
            en={showDemoData ? 'Hide sample data' : 'Show sample data'}
            el={showDemoData ? 'Απόκρυψη δείγματος δεδομένων' : 'Εμφάνιση δείγματος δεδομένων'}
            secondaryClassName={SECONDARY_LINE}
          />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleLogout}
          className="text-destructive-accessible focus:text-destructive-accessible"
        >
          <LogOut className="mr-2 icon-sm shrink-0" aria-hidden="true" />
          <BilingualText en="Sign out" el="Αποσύνδεση" secondaryClassName={SECONDARY_LINE} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
