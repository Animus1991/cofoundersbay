'use client';

import { useEffect, useState } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { investorEmailDraft, mailtoHref } from '@/lib/investor-email';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

export type InvestorEmailTarget = {
  name: string;
  nameEl?: string;
  email?: string;
  nextStep?: string;
  /** What the assistant wrote; without it the note starts from the next step. */
  subject?: string;
  body?: string;
};

/**
 * A note to an investor, sent from the founder's own mail app: the platform
 * does not send it and does not say it was sent. Whoever reads it should get a
 * message from the founder's address, and the founder reads it first.
 */
export function InvestorEmailDialog({ target, sender, onClose }: { target: InvestorEmailTarget | null; sender: string | null; onClose: () => void }) {
  const { primary } = useLanguagePreference();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!target) return;
    const start = investorEmailDraft(target, sender, primary === 'el' ? 'el' : 'en');
    setTo(target.email ?? '');
    setSubject(target.subject ?? start.subject);
    setBody(target.body ?? start.body);
    setCopied(false);
  }, [target, sender, primary]);

  const copy = async () => {
    await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><BilingualText en={`Email to ${target?.name ?? ''}`} el={`Email σε ${target?.nameEl ?? target?.name ?? ''}`} compact /></DialogTitle>
          <DialogDescription>
            <BilingualText en="It opens in your own mail app. Nothing is sent from here." el="Ανοίγει στο δικό σας πρόγραμμα email. Από εδώ δεν στέλνεται τίποτα." compact wrap />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="investor-email-to"><BilingualText en="To" el="Προς" compact /></Label>
            <Input id="investor-email-to" type="email" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="investor-email-subject"><BilingualText en="Subject" el="Θέμα" compact /></Label>
            <Input id="investor-email-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="investor-email-body"><BilingualText en="Message" el="Μήνυμα" compact /></Label>
            <Textarea id="investor-email-body" rows={8} value={body} onChange={(event) => setBody(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void copy()}>
            {copied ? <BilingualText en="Copied" el="Αντιγράφηκε" compact /> : <BilingualText en="Copy" el="Αντιγραφή" compact />}
          </Button>
          <Button asChild>
            <a href={mailtoHref({ to, subject, body })} onClick={onClose}><BilingualText en="Open in mail" el="Άνοιγμα στο email" compact /></a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
