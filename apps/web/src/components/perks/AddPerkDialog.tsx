'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PERK_CATEGORIES, PERK_CATEGORY_COPY, PERK_LIMITS, PERK_STAGES, readPerkInput, type PerkCategory, type PerkStage } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { StatusText } from '@/components/common/StatusText';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createPerk } from '@/lib/perks-api';

type Draft = {
  partner: string;
  title: string;
  titleEl: string;
  value: string;
  valueEl: string;
  summary: string;
  summaryEl: string;
  howToRedeem: string;
  howToRedeemEl: string;
  terms: string;
  code: string;
  redeemUrl: string;
  expiresAt: string;
  category: PerkCategory;
  stages: PerkStage[];
};

const EMPTY: Draft = {
  partner: '',
  title: '',
  titleEl: '',
  value: '',
  valueEl: '',
  summary: '',
  summaryEl: '',
  howToRedeem: '',
  howToRedeemEl: '',
  terms: '',
  code: '',
  redeemUrl: '',
  expiresAt: '',
  category: 'software',
  stages: [],
};

/**
 * A platform admin adds a partner offer. The form checks with the same reader
 * the API applies (`readPerkInput`), so what it refuses here is what the
 * server would refuse; Greek fields are optional and fall back to English.
 */
export function AddPerkDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { success, error: showError } = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const payload = () => ({ ...draft, expiresAt: draft.expiresAt ? new Date(`${draft.expiresAt}T23:59:59`).toISOString() : null });

  const create = useMutation({
    mutationFn: () => createPerk(payload()),
    onSuccess: () => {
      success('Perk added');
      onCreated();
      setDraft(EMPTY);
      onClose();
    },
    onError: (err) => showError('Could not add the perk', err instanceof Error ? err.message : undefined),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const read = readPerkInput(payload());
    if (!read.ok) {
      setProblem(read.error);
      return;
    }
    setProblem(null);
    create.mutate();
  };

  const text = (key: keyof Draft, en: string, el: string, max: number, opts: { required?: boolean; long?: boolean; hint?: string; type?: string } = {}) => (
    <FormField label={<BilingualText en={en} el={el} compact />} htmlFor={`perk-${key}`} required={opts.required} hint={opts.hint}>
      {opts.long ? (
        <Textarea rows={2} maxLength={max} value={draft[key] as string} onChange={(e) => set(key, e.target.value as never)} />
      ) : (
        <Input type={opts.type ?? 'text'} maxLength={max} value={draft[key] as string} onChange={(e) => set(key, e.target.value as never)} />
      )}
    </FormField>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle><BilingualText en="Add a perk" el="Προσθήκη προσφοράς" compact /></DialogTitle>
          <DialogDescription>
            <BilingualText en="Members see the code and the link only after they claim. Greek fields are optional." el="Τα μέλη βλέπουν κωδικό και σύνδεσμο μόνο μετά τη διεκδίκηση. Τα ελληνικά πεδία είναι προαιρετικά." wrap />
          </DialogDescription>
        </DialogHeader>
        <form id="add-perk" className="space-y-4" onSubmit={submit}>
          {text('partner', 'Partner', 'Συνεργάτης', PERK_LIMITS.partner, { required: true })}
          {text('title', 'Title', 'Τίτλος', PERK_LIMITS.title, { required: true })}
          {text('titleEl', 'Title in Greek', 'Τίτλος στα ελληνικά', PERK_LIMITS.title)}
          {text('value', 'The offer, in the partner’s words', 'Η προσφορά, με τα λόγια του συνεργάτη', PERK_LIMITS.value, { required: true, hint: '$5,000 in credits for 12 months' })}
          {text('valueEl', 'The offer in Greek', 'Η προσφορά στα ελληνικά', PERK_LIMITS.value)}
          {text('summary', 'What it is for', 'Σε τι χρησιμεύει', PERK_LIMITS.summary, { required: true, long: true })}
          {text('summaryEl', 'What it is for, in Greek', 'Σε τι χρησιμεύει, στα ελληνικά', PERK_LIMITS.summary, { long: true })}
          <div role="group" aria-labelledby="perk-category-label" className="space-y-1.5">
            <p id="perk-category-label" className="text-sm font-medium"><BilingualText en="Category" el="Κατηγορία" compact /></p>
            <div className="flex flex-wrap gap-2">
              {PERK_CATEGORIES.map((c) => (
                <Button key={c} type="button" size="sm" variant={draft.category === c ? 'default' : 'outline'} aria-pressed={draft.category === c} onClick={() => set('category', c)}>
                  <BilingualText en={PERK_CATEGORY_COPY[c].en} el={PERK_CATEGORY_COPY[c].el} compact />
                </Button>
              ))}
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium"><BilingualText en="Stages it suits (none for every stage)" el="Στάδια που ταιριάζει (κανένα για όλα)" compact wrap /></legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {PERK_STAGES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.stages.includes(s)}
                    onCheckedChange={(on) => set('stages', on ? [...draft.stages, s] : draft.stages.filter((x) => x !== s))}
                  />
                  <StatusText value={s} />
                </label>
              ))}
            </div>
          </fieldset>
          {text('howToRedeem', 'How to redeem', 'Πώς εξαργυρώνεται', PERK_LIMITS.howToRedeem, { required: true, long: true })}
          {text('howToRedeemEl', 'How to redeem, in Greek', 'Πώς εξαργυρώνεται, στα ελληνικά', PERK_LIMITS.howToRedeem, { long: true })}
          {text('code', 'Code', 'Κωδικός', PERK_LIMITS.code, { hint: 'A code, a link, or both.' })}
          {text('redeemUrl', 'Redeem link (https)', 'Σύνδεσμος εξαργύρωσης (https)', PERK_LIMITS.url, { type: 'url' })}
          {text('terms', 'Terms', 'Όροι', PERK_LIMITS.terms, { long: true })}
          {text('expiresAt', 'Ends on (optional)', 'Λήγει στις (προαιρετικά)', 10, { type: 'date' })}
          {problem ? (
            <p role="alert" className="text-sm text-destructive-accessible">{problem}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}><BilingualText en="Cancel" el="Ακύρωση" compact /></Button>
          <Button type="submit" form="add-perk" disabled={create.isPending}><BilingualText en="Add the perk" el="Προσθήκη" compact /></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
