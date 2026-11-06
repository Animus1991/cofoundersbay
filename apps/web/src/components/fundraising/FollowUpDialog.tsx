'use client';

import { useEffect, useState } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { fundraisingEl, fundraisingEn, useFundraisingPrimaryText } from '@/lib/i18n/strings-fundraising';

/** What to do next with one investor, and when. Clearing it is how a done step leaves the home. */
export function FollowUpDialog({
  lead,
  onClose,
  onSave,
}: {
  lead: { id: string; name: string; nextFollowUp?: string; nextStep?: string } | null;
  onClose: () => void;
  onSave: (leadId: string, at: string | null, step: string | null) => Promise<void>;
}) {
  const t = useFundraisingPrimaryText();
  const { success, error: showError } = useToast();
  const [date, setDate] = useState('');
  const [step, setStep] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDate(lead?.nextFollowUp?.slice(0, 10) ?? '');
    setStep(lead?.nextStep ?? '');
  }, [lead]);

  async function save(at: string | null, nextStep: string | null) {
    if (!lead || saving) return;
    setSaving(true);
    try {
      await onSave(lead.id, at, nextStep);
      success(at ? 'Next step saved' : 'Next step cleared');
      onClose();
    } catch (err) {
      showError('Could not save the next step', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={lead !== null} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save(date || null, step.trim() || null);
          }}
        >
          <DialogHeader>
            <DialogTitle><BilingualText en={fundraisingEn('followup_title')} el={fundraisingEl('followup_title')} compact /></DialogTitle>
            <DialogDescription>{lead?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="followup-step"><BilingualText en={fundraisingEn('followup_step')} el={fundraisingEl('followup_step')} compact /></Label>
            <Input
              id="followup-step"
              maxLength={200}
              value={step}
              onChange={(e) => setStep(e.target.value)}
              placeholder={t(fundraisingEn('followup_step_hint'), fundraisingEl('followup_step_hint'))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="followup-date"><BilingualText en={fundraisingEn('followup_date')} el={fundraisingEl('followup_date')} compact /></Label>
            <Input id="followup-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            {lead?.nextFollowUp ? (
              <Button type="button" variant="ghost" disabled={saving} onClick={() => void save(null, null)}>
                <BilingualText en={fundraisingEn('followup_clear')} el={fundraisingEl('followup_clear')} compact />
              </Button>
            ) : null}
            <Button type="submit" disabled={!date || saving}>
              <BilingualText en={fundraisingEn('save')} el={fundraisingEl('save')} compact />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
