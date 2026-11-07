'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { RoomLinks } from '@/components/fundraising/RoomLinks';
import { fundraisingEl, fundraisingEn, useFundraisingPrimaryText } from '@/lib/i18n/strings-fundraising';
import { initialsOf } from '@/lib/utils';

export type ShareMember = { id: string; displayName: string; avatarUrl?: string | null; headline?: string | null };
export type ShareLead = { id: string; name: string; firm?: string; account: ShareMember | null };
export type ShareDoc = { id: string; name: string; nameEl?: string; shared: boolean; canShare: boolean; openedBy: string[] };
export type ShareRoomActions = {
  search: (query: string) => Promise<ShareMember[]>;
  link: (leadId: string, member: ShareMember | null) => Promise<void>;
  share: (ids: string[], shared: boolean) => Promise<void>;
};

/** One investor: linked to an account, or a field to find theirs. */
function LeadRow({ lead, actions }: { lead: ShareLead; actions: ShareRoomActions }) {
  const { success, error: showError } = useToast();
  const t = useFundraisingPrimaryText();
  const [linking, setLinking] = useState(false);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<ShareMember[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setMembers([]);
      return undefined;
    }
    let current = true;
    const timer = setTimeout(() => {
      actions.search(query.trim()).then(
        (found) => { if (current) setMembers(found); },
        () => { if (current) setMembers([]); },
      );
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [actions, query]);

  async function choose(member: ShareMember | null) {
    setBusy(true);
    try {
      await actions.link(lead.id, member);
      success(member ? 'Account linked' : 'Link removed');
      setLinking(false);
      setQuery('');
    } catch (err) {
      showError('Could not change the link', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-2 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{lead.name}{lead.firm ? ` · ${lead.firm}` : ''}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lead.account
              ? <BilingualText en={`Linked to ${lead.account.displayName}`} el={`Συνδεδεμένος λογαριασμός: ${lead.account.displayName}`} compact />
              : <BilingualText en={fundraisingEn('share_not_linked')} el={fundraisingEl('share_not_linked')} compact />}
          </p>
        </div>
        {lead.account ? (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void choose(null)}>
            <BilingualText en={fundraisingEn('share_unlink')} el={fundraisingEl('share_unlink')} compact />
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" aria-expanded={linking} onClick={() => setLinking((v) => !v)}>
            <BilingualText en={fundraisingEn('share_link')} el={fundraisingEl('share_link')} compact />
          </Button>
        )}
      </div>
      {linking ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              autoFocus
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(fundraisingEn('share_search'), fundraisingEl('share_search'))}
              aria-label={t(fundraisingEn('share_search'), fundraisingEl('share_search'))}
            />
          </div>
          {members.length > 0 ? (
            <ul className="space-y-1">
              {members.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void choose(member)}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={member.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="text-xs">{initialsOf(member.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{member.displayName}</span>
                      {member.headline ? <span className="block truncate text-xs text-muted-foreground">{member.headline}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 ? (
            <p className="px-1 text-xs text-muted-foreground"><BilingualText en={fundraisingEn('share_no_member')} el={fundraisingEl('share_no_member')} compact /></p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/**
 * Who can open the room, and what they see. There is no public link: a file
 * reaches an investor only through their own account, each opening is logged,
 * and unlinking or unsharing ends access on the next try (docs §112).
 */
export function ShareRoomDialog({
  open,
  onOpenChange,
  leads,
  docs,
  actions,
  withLinks = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: ShareLead[];
  docs: ShareDoc[];
  actions: ShareRoomActions;
  /** A real account's round: the showcase has no files to open from a link. */
  withLinks?: boolean;
}) {
  const { success, error: showError } = useToast();
  const linked = leads.filter((l) => l.account).length;
  const shared = docs.filter((d) => d.shared).length;

  async function toggle(doc: ShareDoc, next: boolean) {
    try {
      await actions.share([doc.id], next);
      success(next ? 'Document shared' : 'Document no longer shared');
    } catch (err) {
      showError('Could not change the sharing', err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88dvh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle><BilingualText en={fundraisingEn('share_title')} el={fundraisingEl('share_title')} compact /></DialogTitle>
          <DialogDescription><BilingualText en={fundraisingEn('share_intro')} el={fundraisingEl('share_intro')} wrap /></DialogDescription>
        </DialogHeader>

        <section aria-labelledby="share-who" className="space-y-1">
          <h3 id="share-who" className="text-sm font-semibold text-foreground">
            <BilingualText en={fundraisingEn('share_who')} el={fundraisingEl('share_who')} compact />
          </h3>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground"><BilingualText en={fundraisingEn('share_no_leads')} el={fundraisingEl('share_no_leads')} wrap /></p>
          ) : (
            <ul className="divide-y divide-border">
              {leads.map((lead) => <LeadRow key={lead.id} lead={lead} actions={actions} />)}
            </ul>
          )}
        </section>

        <section aria-labelledby="share-what" className="space-y-1">
          <h3 id="share-what" className="text-sm font-semibold text-foreground">
            <BilingualText en={fundraisingEn('share_what')} el={fundraisingEl('share_what')} compact />
          </h3>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground"><BilingualText en={fundraisingEn('share_no_docs')} el={fundraisingEl('share_no_docs')} wrap /></p>
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((doc) => (
                <li key={doc.id} className="py-2">
                  <label className="flex min-h-11 items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0"
                      checked={doc.shared}
                      disabled={!doc.canShare}
                      onChange={(e) => void toggle(doc, e.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm text-foreground">
                        {doc.nameEl ? <BilingualText en={doc.name} el={doc.nameEl} compact /> : doc.name}
                      </span>
                      {!doc.canShare ? (
                        <span className="block text-xs text-muted-foreground"><BilingualText en={fundraisingEn('share_needs_file')} el={fundraisingEl('share_needs_file')} compact /></span>
                      ) : doc.openedBy.length > 0 ? (
                        <span className="block text-xs text-muted-foreground">
                          <BilingualText en={`Opened by ${doc.openedBy.join(', ')}`} el={`Το άνοιξαν: ${doc.openedBy.join(', ')}`} compact />
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        {withLinks ? <RoomLinks sharedCount={shared} /> : null}
        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            <BilingualText
              en={`${shared} of ${docs.length} shared · ${linked} linked`}
              el={`${shared} από ${docs.length} κοινόχρηστα · ${linked} συνδεδεμένοι`}
              compact
            />
          </p>
          <Button type="button" onClick={() => onOpenChange(false)}>
            <BilingualText en={fundraisingEn('share_finish')} el={fundraisingEl('share_finish')} compact />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
