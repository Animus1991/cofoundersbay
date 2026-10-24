'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFollowPerson } from '@/components/updates/FollowButton';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { bilingualAria } from '@/lib/i18n/format';
import type { AskText } from '@/lib/page-questions';

/**
 * The less frequent actions on someone else's profile, behind "More"
 * (docs §101). The profile's head carried seven: Connect, Message, Follow
 * updates, Ask for an introduction, How we fit, AI Match Analysis and Copy
 * link, side by side. Connect, Message and How we fit stay in view; these
 * four are one press away, each doing what its button did.
 */
export function ProfileMoreMenu({
  userId,
  name,
  signedIn,
  askAboutFit,
  onCopyLink,
  onAskIntro,
}: {
  userId: string;
  name: string;
  signedIn: boolean;
  /** The question the "AI Match Analysis" button asked. */
  askAboutFit: AskText;
  onCopyLink: () => void;
  /** Opens the page's introduction dialog (the page owns it, so the assistant can open it too). */
  onAskIntro: () => void;
}) {
  const follow = useFollowPerson(userId);
  const { ask } = useAskAssistant();
  const here = typeof window !== 'undefined' ? window.location.pathname : `/profiles/${userId}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={bilingualAria(`More actions for ${name}`, `Περισσότερες ενέργειες: ${name}`)}
            title={bilingualAria('More', 'Περισσότερα')}
          >
            <MoreHorizontal className="icon-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[14rem]">
          {signedIn ? (
            <DropdownMenuItem disabled={follow.busy} onSelect={() => follow.toggle()}>
              {follow.following
                ? <BilingualText en="Stop following updates" el="Διακοπή παρακολούθησης" compact />
                : <BilingualText en="Follow updates" el="Ακολουθήστε τις ενημερώσεις" compact />}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href={`/login?redirect=${encodeURIComponent(here)}`}>
                <BilingualText en="Follow updates" el="Ακολουθήστε τις ενημερώσεις" compact />
              </Link>
            </DropdownMenuItem>
          )}
          {signedIn ? (
            <DropdownMenuItem onSelect={onAskIntro}>
              <BilingualText en="Ask for an introduction" el="Ζητήστε σύσταση" compact />
            </DropdownMenuItem>
          ) : null}
          {signedIn ? (
            <DropdownMenuItem onSelect={() => ask(askAboutFit)}>
              <BilingualText en="Ask AI about our fit" el="Ρωτήστε το AI για το ταίριασμα" compact />
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onCopyLink}>
            <BilingualText en="Copy link" el="Αντιγραφή συνδέσμου" compact />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
