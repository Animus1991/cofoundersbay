'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import {
  OPEN_TO_COPY,
  OPEN_TO_VISIBILITY_COPY,
  VERIFICATION_COPY,
  type VerificationMethod,
} from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { getMyOpenTo, type MyOpenTo } from '@/lib/open-to-api';
import { getMyVerification } from '@/lib/verification-api';
import { qk } from '@/lib/query-keys';

/**
 * The signed-in person's own trust marks on `/profile`, read from the same
 * endpoints the profile's Verification and "Open to" cards write
 * (`/verification/me`, `/open-to/me`) and cached under the same keys, so a
 * change shows in the header without a reload.
 *
 * Before this, the profile drew a "Verified member" check on every avatar,
 * an "Open to work" pill on every header and "LinkedIn: not connected" in
 * the rail, whatever the person had actually done.
 */
export function useMyTrust() {
  const verification = useQuery({ queryKey: qk('verification', 'me'), queryFn: getMyVerification, staleTime: 60_000, retry: 0 });
  const openTo = useQuery({ queryKey: qk('open-to', 'me'), queryFn: getMyOpenTo, staleTime: 60_000, retry: 0 });
  const methods: VerificationMethod[] = (verification.data?.signals ?? []).map((s) => s.method);
  return { verification: verification.data, openTo: openTo.data, methods };
}

const verifiedLabel = (methods: readonly VerificationMethod[]) => {
  const how = methods.map((m) => VERIFICATION_COPY[m]);
  return `Verified: ${how.map((h) => h.en).join(', ')} · Επαληθευμένο προφίλ: ${how.map((h) => h.el).join(', ')}`;
};

/** The check on the avatar, only for someone with a verification signal. */
export function AvatarVerifiedMark({ methods }: { methods: readonly VerificationMethod[] }) {
  if (!methods.length) return null;
  const label = verifiedLabel(methods);
  return (
    <div className="absolute bottom-2 right-2 rounded-full bg-background p-1 shadow-sm" title={label} data-keep-icon="">
      <BadgeCheck className="icon-lg text-status-info" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * What the person said they are open to (the "Open to" card on the profile). With nothing
 * set it offers the setting instead of claiming "Open to work". The pill
 * names who sees the signal, because "Matching only" (the default) means
 * other members do not.
 */
export function OwnOpenToPill({ openTo }: { openTo: MyOpenTo | undefined }) {
  const signal = openTo?.active ? openTo.signal : null;
  const kinds = signal?.kinds ?? [];
  if (!signal || !kinds.length) {
    return (
      <Link
        href="/profile#open-to"
        className="inline-flex items-center rounded-md border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BilingualText en="Set what you are open to" el="Ορίστε σε τι είστε ανοιχτός/ή" compact />
      </Link>
    );
  }
  const who = OPEN_TO_VISIBILITY_COPY[signal.visibility];
  return (
    <Link
      href="/profile#open-to"
      title={`${who.en}: ${who.hintEn} · ${who.el}: ${who.hintEl}`}
      className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-status-success-border bg-status-success-bg px-3 py-1 text-xs font-medium text-status-success transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-status-success-mark" aria-hidden="true" />
      <BilingualText
        en={`Open to: ${kinds.map((k) => OPEN_TO_COPY[k].en.toLowerCase()).join(', ')}`}
        el={`Ανοιχτός/ή σε: ${kinds.map((k) => OPEN_TO_COPY[k].el.toLowerCase()).join(', ')}`}
        compact
      />
      <span className="sr-only">{`${who.en} · ${who.el}`}</span>
    </Link>
  );
}

/*
 * The rail's verification list (VerificationPanel) went with docs §99: the
 * Verification card itself is on the profile now, with every method and its
 * state; the list's email and GitHub rows had no verification behind them.
 */
