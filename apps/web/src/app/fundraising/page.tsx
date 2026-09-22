'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, ChevronRight, Clock, Upload, Download, X,
} from 'lucide-react';
import { useDemoData } from '@/contexts/DemoDataContext';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useModalA11y } from '@/hooks/useModalA11y';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useToast } from '@/components/ui/toast';
import { bilingualAria, formatShortDate } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import {
  fundraisingEn,
  fundraisingEl,
  useFundraisingPrimaryText,
  INVESTOR_STATUS_KEYS,
  ROUND_STATUS_KEYS,
  DOC_STATUS_KEYS,
  DOC_CATEGORY_KEYS,
  INVESTOR_TYPE_EL,
} from '@/lib/i18n/strings-fundraising';
import {
  FUNDRAISING_SEED_DOCS,
  PIPELINE_STAGES,
  DOC_CATEGORIES,
  INVESTOR_TYPES,
  listFundraisingLeads,
  addFundraisingLead,
  moveFundraisingLead,
  fundraisingPipelineStats,
  fundraisingRoundView,
  fmtMoney,
  daysUntil,
  readFundraisingOverlay,
  type InvestorLead,
  type InvestorStatus,
  type DataRoomDoc,
  type DocStatus,
} from '@/lib/fundraising-demo';

const ROUND_TONE: Record<string, StatusTone> = {
  planning: 'neutral',
  active: 'success',
  closing: 'warning',
  closed: 'info',
};

const INVESTOR_TONE: Record<InvestorStatus, StatusTone> = {
  prospect: 'neutral',
  contacted: 'info',
  meeting: 'accent',
  dd: 'warning',
  committed: 'success',
  passed: 'danger',
};

const DOC_TONE: Record<DocStatus, StatusTone> = {
  draft: 'warning',
  ready: 'success',
  shared: 'info',
};

const DOC_GLYPH: Record<DocStatus, CfbGlyphName> = {
  draft: 'book',
  ready: 'award',
  shared: 'discover',
};

function statusLabel(status: InvestorStatus) {
  const key = INVESTOR_STATUS_KEYS[status];
  return key
    ? <BilingualText en={fundraisingEn(key)} el={fundraisingEl(key)} compact />
    : status;
}

function AddLeadModal({
  open,
  defaultStatus,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultStatus: InvestorStatus;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useFundraisingPrimaryText();
  const { success } = useToast();
  const [name, setName] = useState('');
  const panelRef = useModalA11y<HTMLFormElement>(open, onClose);
  const [firm, setFirm] = useState('');
  const [type, setType] = useState<string>('Angel');
  const [stage, setStage] = useState('Pre-Seed / Seed');
  const [checkSize, setCheckSize] = useState('$25K–$150K');
  const [status, setStatus] = useState<InvestorStatus>(defaultStatus);
  const [notes, setNotes] = useState('');

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addFundraisingLead({
      name: name.trim(),
      firm: firm.trim() || undefined,
      type,
      stage,
      checkSize,
      status,
      notes: notes.trim() || undefined,
    });
    success(t(fundraisingEn('created'), fundraisingEl('created')), t(fundraisingEn('created_hint'), fundraisingEl('created_hint')));
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* `useModalA11y` gives this the four behaviours Radix would: focus in
          on open, Tab trapped, Escape closes, scroll locked and focus
          returned. Without them a keyboard user opened this and kept tabbing
          through the page behind it. */}
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fundraising-modal-title"
        tabIndex={-1}
        onSubmit={submit}
        className="relative w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CfbGlyph name="wallet" className="icon-sm text-primary-accessible" />
            <h2 id="fundraising-modal-title" className="text-sm font-semibold">
              <BilingualText en={fundraisingEn('modal_new')} el={fundraisingEl('modal_new')} />
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted" aria-label={bilingualAria(fundraisingEn('cancel'), fundraisingEl('cancel'))}>
            <X className="icon-sm" />
          </button>
        </div>
        <div className="space-y-1.5">
          <Label><BilingualText en={fundraisingEn('field_name')} el={fundraisingEl('field_name')} compact /> *</Label>
          <Input className="rounded-xl" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t(fundraisingEn('name_ph'), fundraisingEl('name_ph'))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label><BilingualText en={fundraisingEn('field_firm')} el={fundraisingEl('field_firm')} compact /></Label>
            <Input className="rounded-xl" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder={t(fundraisingEn('firm_ph'), fundraisingEl('firm_ph'))} />
          </div>
          <div className="space-y-1.5">
            <Label><BilingualText en={fundraisingEn('field_type')} el={fundraisingEl('field_type')} compact /></Label>
            <select className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {INVESTOR_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label><BilingualText en={fundraisingEn('field_stage')} el={fundraisingEl('field_stage')} compact /></Label>
            <Input className="rounded-xl" value={stage} onChange={(e) => setStage(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label><BilingualText en={fundraisingEn('field_check')} el={fundraisingEl('field_check')} compact /></Label>
            <Input className="rounded-xl" value={checkSize} onChange={(e) => setCheckSize(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label><BilingualText en={fundraisingEn('field_status')} el={fundraisingEl('field_status')} compact /></Label>
          <select className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as InvestorStatus)}>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{t(fundraisingEn(INVESTOR_STATUS_KEYS[s]), fundraisingEl(INVESTOR_STATUS_KEYS[s]))}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label><BilingualText en={fundraisingEn('field_notes')} el={fundraisingEl('field_notes')} compact /></Label>
          <textarea className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t(fundraisingEn('notes_ph'), fundraisingEl('notes_ph'))} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={onClose}>
            <BilingualText en={fundraisingEn('cancel')} el={fundraisingEl('cancel')} compact />
          </Button>
          <Button type="submit" className="rounded-xl" disabled={!name.trim()}>
            <BilingualText en={fundraisingEn('save')} el={fundraisingEl('save')} compact />
          </Button>
        </div>
      </form>
    </div>
  );
}

function RoundCard({
  round,
  onAdd,
}: {
  round: ReturnType<typeof fundraisingRoundView>;
  onAdd: () => void;
}) {
  const pct = Math.round((round.raised / round.target) * 100);
  const remaining = round.target - round.raised;
  const days = daysUntil(round.closingDate);
  const roundKey = ROUND_STATUS_KEYS[round.status];

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CfbGlyph name="wallet" className="icon-sm text-muted-foreground" />
              <h2 className="text-xl font-bold">{round.name}</h2>
              <Badge variant="outline" className={cn('rounded-full border', STATUS[ROUND_TONE[round.status]].chip)}>
                {roundKey ? <BilingualText en={fundraisingEn(roundKey)} el={fundraisingEl(roundKey)} compact /> : round.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {round.type} · {round.valuation
                ? `${fmtMoney(round.valuation, round.currency)} `
                : null}
              {round.valuation
                ? <BilingualText en={fundraisingEn('pre_money')} el={fundraisingEl('pre_money')} compact />
                : <BilingualText en={fundraisingEn('valuation_tbd')} el={fundraisingEl('valuation_tbd')} compact />}
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 rounded-xl" onClick={onAdd}>
            <Plus className="icon-sm mr-1.5" />
            <BilingualText en={fundraisingEn('add_investor')} el={fundraisingEl('add_investor')} compact />
          </Button>
        </div>

        <div className="mb-4 space-y-1.5">
          <div className="flex justify-between text-sm font-medium">
            <span>{fmtMoney(round.raised, round.currency)} <BilingualText en={fundraisingEn('raised')} el={fundraisingEl('raised')} compact /></span>
            <span className="text-muted-foreground">{fmtMoney(round.target, round.currency)} <BilingualText en={fundraisingEn('target')} el={fundraisingEl('target')} compact /></span>
          </div>
          <Progress value={pct} className="h-3" />
          <div className="flex justify-between text-2xs text-muted-foreground">
            <span>{pct}% <BilingualText en={fundraisingEn('of_target')} el={fundraisingEl('of_target')} compact /></span>
            <span>{fmtMoney(remaining, round.currency)} <BilingualText en={fundraisingEn('remaining')} el={fundraisingEl('remaining')} compact /></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { glyph: 'people' as const, label: 'stat_investors' as const, value: round.investors.toString() },
            { glyph: 'chart' as const, label: 'stat_committed_amt' as const, value: fmtMoney(round.raised, round.currency) },
            { glyph: 'calendar' as const, label: 'stat_closing' as const, value: days === null ? null : days < 0 ? 'overdue' : `${days}` },
            { glyph: 'award' as const, label: 'lead_investor' as const, value: round.leadInvestor ?? '' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-background/60 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <CfbGlyph name={s.glyph} className="icon-sm shrink-0 text-primary-accessible" />
                <p className="min-w-0 text-2xs leading-snug text-muted-foreground">
                  <BilingualText en={fundraisingEn(s.label)} el={fundraisingEl(s.label)} compact wrap />
                </p>
              </div>
              <p className="truncate text-sm font-semibold">
                {s.label === 'stat_closing' && s.value === 'overdue'
                  ? <BilingualText en={fundraisingEn('overdue')} el={fundraisingEl('overdue')} compact />
                  : s.label === 'stat_closing' && s.value === null
                    ? <BilingualText en={fundraisingEn('closing_tbd')} el={fundraisingEl('closing_tbd')} compact />
                    : s.label === 'stat_closing' && s.value
                      // Greek needs the gap: "24ημ." ran the number into the
                      // unit. English reads "24d left", so it keeps the space
                      // too - the unit was never meant to touch the figure.
                      ? <>{s.value}{' '}<BilingualText en={fundraisingEn('days_left')} el={fundraisingEl('days_left')} compact /></>
                      : s.label === 'lead_investor' && !s.value
                        ? <BilingualText en={fundraisingEn('none_yet')} el={fundraisingEl('none_yet')} compact />
                        : s.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineView({
  leads,
  onAdd,
  onMove,
}: {
  leads: InvestorLead[];
  onAdd: (status: InvestorStatus) => void;
  onMove: (id: string, status: InvestorStatus) => void;
}) {
  const { primary } = useLanguagePreference();
  const byStage = PIPELINE_STAGES.reduce<Record<InvestorStatus, InvestorLead[]>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {} as Record<InvestorStatus, InvestorLead[]>);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const items = byStage[stage];
          const colors = STATUS[INVESTOR_TONE[stage]];
          return (
            <div key={stage} className="w-56 shrink-0">
              <div className={cn('mb-2 flex items-center justify-between rounded-xl border px-2.5 py-1.5', colors.chip)}>
                <span className="text-xs font-semibold">{statusLabel(stage)}</span>
                <Badge variant="secondary" size="sm" className="rounded-full px-1.5">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((lead) => (
                  <Card key={lead.id} className="rounded-xl transition-colors hover:border-primary/30">
                    <CardContent className="space-y-1.5 p-3">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-7 w-7 shrink-0 rounded-xl">
                          <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-bold text-primary-accessible">
                            {lead.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{lead.name}</p>
                          {lead.firm && <p className="truncate text-2xs text-muted-foreground">{lead.firm}</p>}
                        </div>
                        {lead.isVerified && <CfbGlyph name="award" className={cn('ml-auto icon-sm shrink-0', STATUS.info.icon)} />}
                      </div>
                      <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                        <CfbGlyph name="wallet" className="icon-sm" />{lead.checkSize}
                      </div>
                      {lead.notes && (
                        <p className="line-clamp-2 text-2xs text-muted-foreground">
                          {lead.notesEl
                            ? <BilingualText en={lead.notes} el={lead.notesEl} wrap />
                            : lead.notes}
                        </p>
                      )}
                      {lead.lastContact && (
                        <p className="flex items-center gap-1 text-2xs text-muted-foreground">
                          <Clock className="icon-sm" />
                          <BilingualText en={fundraisingEn('last_contact')} el={fundraisingEl('last_contact')} compact />
                          : {formatShortDate(lead.lastContact, primary)}
                        </p>
                      )}
                      <select
                        className="w-full rounded-xl border border-border/60 bg-background px-2 py-1 text-2xs"
                        value={lead.status}
                        onChange={(e) => onMove(lead.id, e.target.value as InvestorStatus)}
                        aria-label={bilingualAria(fundraisingEn('move_to'), fundraisingEl('move_to'))}
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {primary === 'el' ? fundraisingEl(INVESTOR_STATUS_KEYS[s]) : fundraisingEn(INVESTOR_STATUS_KEYS[s])}
                          </option>
                        ))}
                      </select>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="ghost" size="sm" className="h-7 w-full rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground" onClick={() => onAdd(stage)}>
                  <Plus className="icon-sm mr-1" />
                  <BilingualText en={fundraisingEn('add_to_stage')} el={fundraisingEl('add_to_stage')} compact />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataRoomView({ docs }: { docs: DataRoomDoc[] }) {
  const { primary } = useLanguagePreference();
  const t = useFundraisingPrimaryText();
  const { success } = useToast();
  const [catFilter, setCatFilter] = useState('All');
  const filtered = catFilter === 'All' ? docs : docs.filter((d) => d.category === catFilter);
  const ready = docs.filter((d) => d.status === 'ready' || d.status === 'shared').length;
  const required = docs.filter((d) => d.isRequired);
  const requiredReady = required.filter((d) => d.status === 'ready' || d.status === 'shared').length;

  return (
    <div className="space-y-4">
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold"><BilingualText en={fundraisingEn('dr_health')} el={fundraisingEl('dr_health')} compact /></p>
              <p className="mt-0.5 text-2xs text-muted-foreground">
                {requiredReady}/{required.length} <BilingualText en={fundraisingEn('dr_required')} el={fundraisingEl('dr_required')} compact />
                {' · '}
                {ready}/{docs.length} <BilingualText en={fundraisingEn('dr_total')} el={fundraisingEl('dr_total')} compact />
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums text-primary-accessible">{docs.length ? Math.round((ready / docs.length) * 100) : 0}%</p>
                <p className="text-2xs text-muted-foreground"><BilingualText en={fundraisingEn('dr_complete')} el={fundraisingEl('dr_complete')} compact /></p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-xl text-xs"
                onClick={() => {
                  void navigator.clipboard?.writeText(`${window.location.origin}/share/data-room-seed`);
                  success(t(fundraisingEn('share_done'), fundraisingEl('share_done')), t(fundraisingEn('share_hint'), fundraisingEl('share_hint')));
                }}
              >
                <CfbGlyph name="discover" className="icon-sm" />
                <BilingualText en={fundraisingEn('share_room')} el={fundraisingEl('share_room')} compact />
              </Button>
            </div>
          </div>
          <Progress value={docs.length ? (ready / docs.length) * 100 : 0} className="mt-3 h-2" />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {DOC_CATEGORIES.map((c) => {
          const key = DOC_CATEGORY_KEYS[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                catFilter === c ? 'border-primary bg-primary/15 text-primary-accessible' : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {key ? <BilingualText en={fundraisingEn(key)} el={fundraisingEl(key)} compact /> : c}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          <BilingualText en={fundraisingEn('empty_docs')} el={fundraisingEl('empty_docs')} />
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const docKey = DOC_STATUS_KEYS[doc.status];
            return (
              <Card key={doc.id} className="rounded-xl transition-colors hover:border-primary/20">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="shrink-0 text-muted-foreground">
                    <CfbGlyph name="book" className="icon-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {doc.nameEl
                          ? <BilingualText en={doc.name} el={doc.nameEl} compact />
                          : doc.name}
                      </p>
                      {doc.isRequired && (
                        <Badge variant="secondary" size="sm" className={cn('rounded-full', STATUS.danger.chip)}>
                          <BilingualText en={fundraisingEn('required')} el={fundraisingEl('required')} compact />
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-2xs text-muted-foreground">
                      <span>{DOC_CATEGORY_KEYS[doc.category] ? <BilingualText en={fundraisingEn(DOC_CATEGORY_KEYS[doc.category])} el={fundraisingEl(DOC_CATEGORY_KEYS[doc.category])} compact /> : doc.category}</span>
                      {doc.lastUpdated && (
                        <span>· <BilingualText en={fundraisingEn('updated')} el={fundraisingEl('updated')} compact /> {formatShortDate(doc.lastUpdated, primary)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className={cn('flex items-center gap-1 text-xs font-medium', STATUS[DOC_TONE[doc.status]].text)}>
                      <CfbGlyph name={DOC_GLYPH[doc.status]} className="icon-sm" />
                      {docKey ? <BilingualText en={fundraisingEn(docKey)} el={fundraisingEl(docKey)} compact /> : doc.status}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 rounded-xl p-0" aria-label={bilingualAria(fundraisingEn('upload'), fundraisingEl('upload'))} onClick={() => success(t(fundraisingEn('upload_done'), fundraisingEl('upload_done')), doc.name)}>
                        <Upload className="icon-sm" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 rounded-xl p-0" aria-label={bilingualAria(fundraisingEn('download'), fundraisingEl('download'))} onClick={() => success(t(fundraisingEn('download_done'), fundraisingEl('download_done')), doc.name)}>
                        <Download className="icon-sm" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InvestorListView({
  leads,
  onMove,
}: {
  leads: InvestorLead[];
  onMove: (id: string, status: InvestorStatus) => void;
}) {
  const { primary } = useLanguagePreference();
  const { open: openAskAi } = usePopupChat();

  if (leads.length === 0) return null;

  return (
    <div className="space-y-2">
      {leads.map((lead) => {
        const colors = STATUS[INVESTOR_TONE[lead.status]];
        return (
          <Card key={lead.id} className="rounded-xl transition-colors hover:border-primary/20">
            {/* Two rows on a phone, one row from `sm` up.
                Measured at 360px: the identity column collapsed to 18px — the
                status <select> is sized by its widest option label and, with the
                two icon buttons, held ~206px of a ~296px row as `shrink-0`, so
                every line of investor text lost 33-67% of its characters. Wrapping
                the controls onto their own line gives the name, firm and note the
                full width back; nothing is hidden or removed. */}
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 shrink-0 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/10 font-bold text-primary-accessible">{lead.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{lead.name}</p>
                    {lead.isVerified && <CfbGlyph name="award" className={cn('icon-sm', STATUS.info.icon)} />}
                  </div>
                  <p className="text-2xs text-muted-foreground">
                    {lead.firm ? `${lead.firm} · ` : ''}
                    <BilingualText en={lead.type} el={INVESTOR_TYPE_EL[lead.type] ?? lead.type} compact />
                    {' · '}
                    {lead.checkSize}
                  </p>
                  {lead.notes && (
                    <p className="mt-0.5 line-clamp-2 text-2xs text-muted-foreground">
                      {lead.notesEl
                        ? <BilingualText en={lead.notes} el={lead.notesEl} wrap />
                        : lead.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                {lead.lastContact && (
                  /* `mr-auto` pins the date to the left edge of the controls row so
                     the status select and the actions stay right-aligned whether or
                     not a lead has a last-contact date. */
                  <p className="mr-auto text-2xs text-muted-foreground sm:mr-0">
                    <Clock className="mr-1 inline icon-sm" />
                    {formatShortDate(lead.lastContact, primary)}
                  </p>
                )}
                <select
                  className={cn('rounded-full border bg-transparent px-2 py-1 text-xs', colors.chip)}
                  value={lead.status}
                  onChange={(e) => onMove(lead.id, e.target.value as InvestorStatus)}
                  aria-label={bilingualAria(fundraisingEn('move_to'), fundraisingEl('move_to'))}
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {primary === 'el' ? fundraisingEl(INVESTOR_STATUS_KEYS[s]) : fundraisingEn(INVESTOR_STATUS_KEYS[s])}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-xl p-0" aria-label={bilingualAria(fundraisingEn('message'), fundraisingEl('message'))} onClick={() => openAskAi()}>
                    <CfbGlyph name="messages" className="icon-sm" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-xl p-0" aria-label={bilingualAria(fundraisingEn('view_details'), fundraisingEl('view_details'))} onClick={() => openAskAi()}>
                    <CfbGlyph name="discover" className="icon-sm" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function FundraisingPage() {
  const { showDemoData } = useDemoData();
  const { open: openAskAi } = usePopupChat();
  const [tick, setTick] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<InvestorStatus>('prospect');

  const leads = useMemo(() => {
    const all = listFundraisingLeads();
    if (showDemoData) return all;
    const createdIds = new Set(readFundraisingOverlay().created.map((l) => l.id));
    return all.filter((l) => createdIds.has(l.id));
  }, [showDemoData, tick]);
  const docs = showDemoData ? FUNDRAISING_SEED_DOCS : [];
  const stats = fundraisingPipelineStats(leads);
  const round = showDemoData ? fundraisingRoundView(leads) : null;

  function refresh() {
    setTick((n) => n + 1);
  }

  function openAdd(status: InvestorStatus = 'prospect') {
    setAddStatus(status);
    setAddOpen(true);
  }

  function handleMove(id: string, status: InvestorStatus) {
    moveFundraisingLead(id, status);
    refresh();
  }

  const emptyCta = (
    <div className="flex flex-wrap justify-center gap-2">
      <Button size="sm" className="rounded-xl" onClick={() => openAdd()}>
        <Plus className="icon-sm mr-1.5" />
        <BilingualText en={fundraisingEn('add_lead')} el={fundraisingEl('add_lead')} compact />
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl" asChild>
        <Link href="/investors"><BilingualText en={fundraisingEn('find_investors')} el={fundraisingEl('find_investors')} compact /></Link>
      </Button>
    </div>
  );

  return (
    <AppShell
      showHelp
      askAi="Fundraising is still sample data. Based on my graph, what should I do next toward a real round — profile, matches, or builder?"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5 rounded-xl" asChild>
            <Link href="/investors">
              <CfbGlyph name="discover" className="icon-sm" />
              <BilingualText en={fundraisingEn('find_investors')} el={fundraisingEl('find_investors')} compact />
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => openAdd()}>
            <Plus className="icon-sm" />
            <BilingualText en={fundraisingEn('add_lead')} el={fundraisingEl('add_lead')} compact />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => openAskAi()}
          className="flex w-full items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        >
          <CfbGlyph name="spark" className="icon-sm shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">
              <BilingualText en={fundraisingEn('ask_ai_plan')} el={fundraisingEl('ask_ai_plan')} stacked />
            </span>
            <span className="block text-2xs text-muted-foreground">
              <BilingualText en={fundraisingEn('ask_ai_hint')} el={fundraisingEl('ask_ai_hint')} />
            </span>
          </span>
        </button>

        {showDemoData && (
          <SampleDataNotice
            surface="Fundraising"
            detail="Rounds, leads, and the data room on this page are sample records until a live fundraising API exists. Ask the assistant for next steps from your actual profile, matches, and builder docs."
            askAiPrompt="Fundraising is still sample data. Based on my graph, what should I do next toward a real round — profile, matches, or builder?"
          />
        )}

        {round ? (
          <RoundCard round={round} onAdd={() => openAdd('committed')} />
        ) : (
          <Card className="rounded-xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CfbGlyph name="wallet" className="icon-lg text-muted-foreground/50" />
              <p className="font-medium"><BilingualText en={fundraisingEn('empty_round_title')} el={fundraisingEl('empty_round_title')} /></p>
              <p className="max-w-sm text-sm text-muted-foreground"><BilingualText en={fundraisingEn('empty_round_hint')} el={fundraisingEl('empty_round_hint')} /></p>
              <Button size="sm" className="rounded-xl" onClick={() => openAskAi()}>
                <CfbGlyph name="spark" className="icon-sm mr-1.5" />
                <BilingualText en={fundraisingEn('ask_ai')} el={fundraisingEl('ask_ai')} compact />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            // `count` is the number the label has to agree with in Greek;
            // the conversion tile has none, so it keeps one form.
            { glyph: 'people' as const, label: 'stat_leads' as const, value: stats.total, count: stats.total, tone: 'accent' as const },
            { glyph: 'messages' as const, label: 'stat_active' as const, value: stats.active, count: stats.active, tone: 'warning' as const },
            { glyph: 'award' as const, label: 'stat_committed' as const, value: stats.committed, count: stats.committed, tone: 'success' as const },
            { glyph: 'chart' as const, label: 'stat_conversion' as const, value: stats.total ? `${stats.conversion}%` : '—', count: null, tone: 'info' as const },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('shrink-0 rounded-xl p-2', STATUS[s.tone].bg)}>
                  <CfbGlyph name={s.glyph} className={cn('icon-sm', STATUS[s.tone].icon)} />
                </div>
                {/* min-w-0 so the label truncates instead of widening the tile —
                    measured 122px past the viewport at 640-1024px without it. */}
                <div className="min-w-0">
                  <p className="text-lg font-bold tabular-nums">{s.value}</p>
                  {/* The note above is only half the story: `min-w-0` lets the
                      label truncate, and truncating is not what a 104px label in
                      a 100px box should do. `wrap` gives it the second line. */}
                  <p className="text-2xs leading-snug text-muted-foreground">
                    <BilingualText
                      en={fundraisingEn(s.label)}
                      el={fundraisingEl(s.count === 1 ? (`${s.label}_one` as typeof s.label) : s.label)}
                      compact
                      wrap
                    />
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pipeline">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="rounded-xl">
              <TabsTrigger value="pipeline" className="rounded-xl">
                <BilingualText en={fundraisingEn('tab_pipeline')} el={fundraisingEl('tab_pipeline')} compact />
                <Badge variant="secondary" size="sm" className="ml-1.5 rounded-full px-1.5">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="rounded-xl">
                <BilingualText en={fundraisingEn('tab_kanban')} el={fundraisingEl('tab_kanban')} compact />
              </TabsTrigger>
              <TabsTrigger value="dataroom" className="rounded-xl">
                <BilingualText en={fundraisingEn('tab_dataroom')} el={fundraisingEl('tab_dataroom')} compact />
                <Badge variant="secondary" size="sm" className="ml-1.5 rounded-full px-1.5">{docs.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl text-xs" asChild>
                <Link href="/investors">
                  <CfbGlyph name="discover" className="icon-sm" />
                  <BilingualText en={fundraisingEn('find_investors')} el={fundraisingEl('find_investors')} compact />
                </Link>
              </Button>
              <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => openAdd()}>
                <Plus className="icon-sm" />
                <BilingualText en={fundraisingEn('add_lead')} el={fundraisingEl('add_lead')} compact />
              </Button>
            </div>
          </div>

          <TabsContent value="pipeline" className="mt-4">
            {leads.length === 0 ? (
              <Card className="rounded-xl border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <CfbGlyph name="people" className="icon-lg text-muted-foreground/50" />
                  <p className="font-medium"><BilingualText en={fundraisingEn('empty_pipeline_title')} el={fundraisingEl('empty_pipeline_title')} /></p>
                  <p className="max-w-sm text-sm text-muted-foreground"><BilingualText en={fundraisingEn('empty_pipeline_hint')} el={fundraisingEl('empty_pipeline_hint')} /></p>
                  {emptyCta}
                </CardContent>
              </Card>
            ) : (
              <InvestorListView leads={leads} onMove={handleMove} />
            )}
          </TabsContent>
          <TabsContent value="kanban" className="mt-4">
            <PipelineView leads={leads} onAdd={openAdd} onMove={handleMove} />
          </TabsContent>
          <TabsContent value="dataroom" className="mt-4">
            <DataRoomView docs={docs} />
          </TabsContent>
        </Tabs>

        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              <BilingualText en={fundraisingEn('resources')} el={fundraisingEl('resources')} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { title: 'res_playbook' as const, desc: 'res_playbook_desc' as const, href: '/learning', glyph: 'book' as const },
              { title: 'res_find' as const, desc: 'res_find_desc' as const, href: '/investors', glyph: 'discover' as const },
              { title: 'res_ready' as const, desc: 'res_ready_desc' as const, href: '/readiness', glyph: 'chart' as const },
              { title: 'res_deck' as const, desc: 'res_deck_desc' as const, href: '/builder/pitch-deck', glyph: 'builder' as const },
            ].map((r) => (
              <Link key={r.href} href={r.href} className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted">
                <div className="flex items-center gap-3">
                  <CfbGlyph name={r.glyph} className="icon-sm text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium transition-colors group-hover:text-primary-accessible">
                      <BilingualText en={fundraisingEn(r.title)} el={fundraisingEl(r.title)} compact />
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      <BilingualText en={fundraisingEn(r.desc)} el={fundraisingEl(r.desc)} compact />
                    </p>
                  </div>
                </div>
                <ChevronRight className="icon-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {addOpen && (
        <AddLeadModal
          key={addStatus}
          open
          defaultStatus={addStatus}
          onClose={() => setAddOpen(false)}
          onCreated={refresh}
        />
      )}
    </AppShell>
  );
}
