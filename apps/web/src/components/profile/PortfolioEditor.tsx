'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import {
  PORTFOLIO_TYPES,
  addPortfolioItem,
  getMyPortfolio,
  removePortfolioItem,
  updatePortfolioItem,
  type PortfolioInput,
  type PortfolioItem,
  type PortfolioType,
} from '@/lib/portfolio';
import { qk } from '@/lib/query-keys';

const EMPTY: PortfolioInput = { type: 'project', title: '', description: null, url: null };

/**
 * The profile form's Portfolio tab (docs §111), where "coming soon" stood.
 * Each item saves on its own, apart from the form around it: it has its own
 * Save, so leaving the page with unsaved profile fields does not touch it.
 */
export function PortfolioEditor() {
  const qc = useQueryClient();
  const say = useBilingualString();
  const { success, error: showError } = useToast();
  const { data, isLoading } = useQuery({ queryKey: qk('me', 'portfolio'), queryFn: getMyPortfolio, staleTime: 60_000, retry: 0 });
  const items = data?.items ?? [];

  // `null` is closed; an item without an id is a new one.
  const [draft, setDraft] = useState<(PortfolioInput & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<PortfolioItem | null>(null);

  const keep = (next: { items: PortfolioItem[] }) => qc.setQueryData(qk('me', 'portfolio'), next);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft?.title.trim() || saving) return;
    setSaving(true);
    const body: PortfolioInput = { type: draft.type, title: draft.title.trim(), description: draft.description?.trim() || null, url: draft.url?.trim() || null };
    try {
      keep(draft.id ? await updatePortfolioItem(draft.id, body) : await addPortfolioItem(body));
      success('Portfolio saved');
      setDraft(null);
    } catch (err) {
      showError('Could not save the portfolio item', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          {isLoading ? null : items.length === 0 && !draft ? (
            <p className="card-body text-muted-foreground">
              <BilingualText en="Nothing here yet. Add a project, a publication or an award, with a link where there is one." el="Δεν υπάρχει τίποτα ακόμη. Προσθέστε ένα έργο, μια δημοσίευση ή ένα βραβείο, με σύνδεσμο όπου υπάρχει." wrap />
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const type = PORTFOLIO_TYPES.find((t) => t.value === item.type);
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-foreground">{item.title}</p>
                      {type ? <p className="text-xs text-muted-foreground"><BilingualText en={type.en} el={type.el} compact /></p> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setDraft({ id: item.id, type: item.type, title: item.title, description: item.description, url: item.url })}>
                        <BilingualText en="Edit" el="Επεξεργασία" compact />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setRemoving(item)}>
                        <BilingualText en="Remove" el="Αφαίρεση" compact />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!draft ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setDraft({ ...EMPTY })}>
              <BilingualText en="Add an item" el="Προσθήκη στοιχείου" compact />
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {draft ? (
        <Card>
          <CardContent>
            {/* A div with a handler, not a <form>: this sits inside the profile form. */}
            <div className="space-y-3" role="group" aria-label={say('Portfolio item', 'Στοιχείο χαρτοφυλακίου')}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem]">
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio-title"><BilingualText en="Title" el="Τίτλος" compact /> *</Label>
                  <Input id="portfolio-title" maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio-type"><BilingualText en="Type" el="Είδος" compact /></Label>
                  <select id="portfolio-type" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as PortfolioType })}>
                    {PORTFOLIO_TYPES.map((t) => <option key={t.value} value={t.value}>{say(t.en, t.el)}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="portfolio-url"><BilingualText en="Link" el="Σύνδεσμος" compact /></Label>
                <Input id="portfolio-url" type="url" inputMode="url" placeholder="https://" maxLength={500} value={draft.url ?? ''} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="portfolio-description"><BilingualText en="What it was" el="Τι ήταν" compact /></Label>
                <textarea id="portfolio-description" rows={3} maxLength={1000} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}><BilingualText en="Cancel" el="Ακύρωση" compact /></Button>
                <Button type="button" disabled={!draft.title.trim() || saving} onClick={(e) => void save(e)}><BilingualText en="Save item" el="Αποθήκευση στοιχείου" compact /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(next) => { if (!next) setRemoving(null); }}
        title={<BilingualText en="Remove this item?" el="Αφαίρεση αυτού του στοιχείου;" />}
        description={<BilingualText en="It leaves your profile." el="Θα φύγει από το προφίλ σας." wrap />}
        confirmLabel={<BilingualText en="Remove" el="Αφαίρεση" compact />}
        onConfirm={async () => {
          if (!removing) return;
          try {
            keep(await removePortfolioItem(removing.id));
            success('Portfolio saved');
          } catch (err) {
            showError('Could not save the portfolio item', err instanceof Error ? err.message : undefined);
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}
