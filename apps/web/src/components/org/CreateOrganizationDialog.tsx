'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ORG_CREATE_LIMITS,
  ORGANIZATION_TYPE_COPY,
  ORGANIZATION_TYPES,
  readNewOrganization,
  slugFromName,
  type OrganizationTypeValue,
} from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createOrganization } from '@/lib/api';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { qk } from '@/lib/query-keys';

type Draft = { type: OrganizationTypeValue | ''; name: string; slug: string; description: string; website: string; city: string; country: string };
const EMPTY: Draft = { type: '', name: '', slug: '', description: '', website: '', city: '', country: '' };

/**
 * Starts an organisation with the person as its owner (`POST /organizations`).
 * The endpoint existed and no screen called it, so an account with no
 * organisation could only read "No organisation yet". The form checks with
 * the reader the API applies (`readNewOrganization`), so what it refuses here
 * is what the server refuses; the server alone answers whether an address is
 * taken. Verification, settings and the tenant are never sent.
 */
export function CreateOrganizationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sayOne = useBilingualString();
  const { success } = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  // The address follows the name until the person edits it.
  const [slugEdited, setSlugEdited] = useState(false);
  const [problem, setProblem] = useState<{ field: string; en: string; el: string } | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const slug = slugEdited ? draft.slug : slugFromName(draft.name);

  const payload = () => ({
    type: draft.type,
    name: draft.name,
    slug,
    description: draft.description || undefined,
    website: draft.website || undefined,
    city: draft.city || undefined,
    country: draft.country || undefined,
  });

  const create = useMutation({
    mutationFn: () => {
      const read = readNewOrganization(payload());
      if (!read.ok) throw Object.assign(new Error(read.reason.en), { details: { field: read.field, messageEl: read.reason.el } });
      return createOrganization(read.value);
    },
    onSuccess: async (org) => {
      success('Organisation created', org?.name);
      await queryClient.invalidateQueries({ queryKey: qk('org') });
      setDraft(EMPTY);
      setSlugEdited(false);
      onClose();
      if (org?.slug) router.push(`/org/${org.slug}/admin`);
    },
    onError: (err) => {
      const e = err as { message?: string; details?: { field?: string; messageEl?: string } };
      const en = e?.message || 'The organisation was not created.';
      setProblem({ field: e?.details?.field ?? '', en, el: e?.details?.messageEl ?? en });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(null);
    create.mutate();
  };

  const errorFor = (field: string) => (problem?.field === field ? sayOne(problem.en, problem.el) : undefined);
  const text = (key: 'name' | 'website' | 'city' | 'country', en: string, el: string, max: number, opts: { required?: boolean; type?: string; autoComplete?: string } = {}) => (
    <FormField label={<BilingualText en={en} el={el} compact />} htmlFor={`org-${key}`} required={opts.required} error={errorFor(key)}>
      <Input type={opts.type ?? 'text'} maxLength={max} autoComplete={opts.autoComplete ?? 'off'} value={draft[key]} onChange={(e) => set(key, e.target.value)} />
    </FormField>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle><BilingualText en="Create an organisation" el="Δημιουργία οργανισμού" compact /></DialogTitle>
          <DialogDescription>
            <BilingualText
              en="You become its owner. Programmes, cohorts, members and mentors are added from its admin page afterwards."
              el="Γίνεστε ο κάτοχός του. Προγράμματα, κύκλοι, μέλη και μέντορες προστίθενται μετά από τη σελίδα διαχείρισης."
              wrap
            />
          </DialogDescription>
        </DialogHeader>
        <form id="create-organization" className="space-y-4" onSubmit={submit} noValidate>
          {text('name', 'Name', 'Όνομα', ORG_CREATE_LIMITS.name, { required: true, autoComplete: 'organization' })}
          <FormField label={<BilingualText en="Kind of organisation" el="Είδος οργανισμού" compact />} htmlFor="org-type" required error={errorFor('type')}>
            <Select value={draft.type} onValueChange={(v) => set('type', v as OrganizationTypeValue)}>
              <SelectTrigger id="org-type"><SelectValue placeholder={sayOne('Choose one', 'Επιλέξτε')} /></SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{sayOne(ORGANIZATION_TYPE_COPY[t].en, ORGANIZATION_TYPE_COPY[t].el)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label={<BilingualText en="Address on CoFounderBay" el="Διεύθυνση στο CoFounderBay" compact />}
            htmlFor="org-slug"
            required
            error={errorFor('slug')}
            hint={<BilingualText en={`/org/${slug || '…'}`} el={`/org/${slug || '…'}`} compact />}
          >
            <Input
              maxLength={ORG_CREATE_LIMITS.slugMax}
              autoComplete="off"
              spellCheck={false}
              translate="no"
              value={slug}
              onChange={(e) => { setSlugEdited(true); set('slug', e.target.value.toLowerCase()); }}
            />
          </FormField>
          <FormField label={<BilingualText en="What it does (optional)" el="Τι κάνει (προαιρετικά)" compact />} htmlFor="org-description" error={errorFor('description')}>
            <Textarea rows={3} maxLength={ORG_CREATE_LIMITS.text} value={draft.description} onChange={(e) => set('description', e.target.value)} />
          </FormField>
          {text('website', 'Website (optional)', 'Ιστότοπος (προαιρετικά)', ORG_CREATE_LIMITS.url, { type: 'url', autoComplete: 'url' })}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {text('city', 'City (optional)', 'Πόλη (προαιρετικά)', ORG_CREATE_LIMITS.short, { autoComplete: 'address-level2' })}
            {text('country', 'Country (optional)', 'Χώρα (προαιρετικά)', ORG_CREATE_LIMITS.short, { autoComplete: 'country-name' })}
          </div>
          {problem && !['name', 'type', 'slug', 'description', 'website', 'city', 'country'].includes(problem.field) ? (
            <p role="alert" className="text-sm text-destructive-accessible">{sayOne(problem.en, problem.el)}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}><BilingualText en="Cancel" el="Ακύρωση" compact /></Button>
          <Button type="submit" form="create-organization" disabled={create.isPending}>
            <BilingualText en={create.isPending ? 'Creating…' : 'Create organisation'} el={create.isPending ? 'Δημιουργία…' : 'Δημιουργία οργανισμού'} compact />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
