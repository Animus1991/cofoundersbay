'use client';

import { ArrowRight } from 'lucide-react';
import type { OpportunityItem } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardHead } from '@/components/common/CardAnatomy';
import { CardMoreMenu } from '@/components/common/CardMoreMenu';
import { FactLine } from '@/components/common/FactLine';
import { SaveItemButton } from '@/components/common/SaveItemButton';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { calendarDaysUntil } from '@/lib/calendar-days';
import { opportunitiesEn, opportunitiesEl } from '@/lib/i18n/strings-opportunities';
import { cn, initialsOf } from '@/lib/utils';
import { OPP_TYPE_DISPLAY, approachPrompt } from './opportunity-prompts';

export function OpportunityCard({ opportunity, onPropose, proposalSent, compact = false }: {
  opportunity: OpportunityItem;
  /** Absent on the reader's own listing. */
  onPropose?: () => void;
  proposalSent?: boolean;
  compact?: boolean;
}) {
  const fmtDate = useDateFormat();
  const { ask } = useAskAssistant();
  const cfg = OPP_TYPE_DISPLAY[opportunity.type] ?? OPP_TYPE_DISPLAY.other;
  const initials = (opportunity.company ?? opportunity.title).slice(0, 2).toUpperCase();
  const postedAgo = fmtDate(opportunity.createdAt, { day: 'numeric', month: 'short' });
  const deadline = opportunity.deadline
    ? fmtDate(opportunity.deadline, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  /* A company's listing shows the company's mark; a person's listing shows
     the person, round like every person on the platform. */
  const mark = (size: string) => (
    <Avatar className={cn(size, 'ring-2 ring-border/60', opportunity.company ? 'rounded-xl' : 'rounded-full')}>
      <AvatarImage src={(opportunity.company ? opportunity.companyLogo : opportunity.createdBy?.avatarUrl) ?? undefined} alt="" />
      <AvatarFallback className={cn('bg-status-accent-bg text-foreground font-semibold', size === 'h-9 w-9' ? 'text-xs' : 'text-sm', opportunity.company ? 'rounded-xl' : 'rounded-full')}>
        {opportunity.company ? initials : initialsOf(opportunity.createdBy?.displayName)}
      </AvatarFallback>
    </Avatar>
  );

  const deadlineItem = deadline && opportunity.deadline ? (() => {
    // Calendar days: closing today is not "Expired".
    const daysLeft = calendarDaysUntil(opportunity.deadline) ?? 0;
    const key = daysLeft < 0 ? 'expired' : daysLeft === 0 ? 'closes_today' : daysLeft <= 3 ? 'days_left' : 'deadline';
    const fill = (t: string) => t.replace('{n}', String(daysLeft)).replace('{date}', deadline);
    return (
      <span key="deadline" className={daysLeft <= 3 ? 'font-medium text-status-danger' : 'text-status-warning'}>
        <BilingualText en={fill(opportunitiesEn(key))} el={fill(opportunitiesEl(key))} compact />
      </span>
    );
  })() : null;

  // One button (docs §115): the way to act on the listing — its own link when it
  // has one, else the proposal, else the assistant's draft. Saving stays a mark;
  // the other two ways are in the menu and do what their buttons did.
  const primary = opportunity.url ? 'apply' : onPropose && !proposalSent ? 'propose' : 'draft';
  const menuItems = [
    ...(primary !== 'draft' ? [{ key: 'draft', en: 'Draft an approach', el: 'Σύνταξη προσέγγισης', onSelect: () => ask(approachPrompt(opportunity)) }] : []),
    ...(primary === 'apply' && onPropose && !proposalSent ? [{ key: 'propose', en: opportunitiesEn('proposal_send'), el: opportunitiesEl('proposal_send'), onSelect: onPropose }] : []),
  ];
  const actions = (
    <>
      {/* Stored for the reader (/api/saved-items). It used to toast
          "saved on this device" and store nothing. */}
      <SaveItemButton kind="opportunity" itemId={opportunity.id} title={opportunity.title} />
      {primary === 'apply' ? (
        <Button size="sm" className="gap-1.5 text-xs" asChild>
          <a href={opportunity.url!} target="_blank" rel="noopener noreferrer">
            <BilingualText en={opportunitiesEn('apply_now')} el={opportunitiesEl('apply_now')} compact /> <ArrowRight className="icon-sm" />
          </a>
        </Button>
      ) : primary === 'propose' ? (
        <Button size="sm" className="text-xs" onClick={onPropose}>
          <BilingualText en={opportunitiesEn('proposal_send')} el={opportunitiesEl('proposal_send')} compact />
        </Button>
      ) : (
        /* No link was posted, and there is no apply endpoint to call — so
           the button said "Apply Now" and did nothing. The assistant can
           actually draft the approach from what this listing says, and the
           label now names that rather than promising a form. */
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => ask(approachPrompt(opportunity))}
        >
          <BilingualText en="Draft an approach" el="Σύνταξη προσέγγισης" compact />
          <ArrowRight className="icon-sm" />
        </Button>
      )}
      {proposalSent ? (
        <span className="self-center text-xs text-muted-foreground"><BilingualText en={opportunitiesEn('proposal_sent_badge')} el={opportunitiesEl('proposal_sent_badge')} compact /></span>
      ) : null}
      <CardMoreMenu name={opportunity.title} items={menuItems} />
    </>
  );

  // The id is the assistant's citation target (`/opportunities#opportunity-…`).
  const cardClass = 'card-interactive hover-lift group scroll-mt-24 transition-all duration-300 hover:border-primary/30';

  /* Compact: mark, title and one facts line on the row, actions on the edge.
     Description and tags stay in the detailed view, where the card breathes. */
  if (compact) {
    return (
      <Card id={`opportunity-${opportunity.id}`} className={cardClass}>
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
          {mark('h-9 w-9')}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground" title={opportunity.title}>{opportunity.title}</p>
            <FactLine
              className="text-xs"
              items={[
                opportunity.company,
                <BilingualText key="type" en={opportunitiesEn(cfg.labelKey)} el={opportunitiesEl(cfg.labelKey)} compact />,
                opportunity.isRemote ? <BilingualText key="remote" en={opportunitiesEn('remote')} el={opportunitiesEl('remote')} compact /> : null,
                opportunity.location,
                deadlineItem,
                opportunity.createdBy.displayName ? (
                  <BilingualText key="by" en={`Posted by ${opportunity.createdBy.displayName}`} el={`Από ${opportunity.createdBy.displayName}`} compact />
                ) : null,
                postedAgo,
              ]}
            />
          </div>
          <div className="flex max-w-full flex-wrap gap-2">{actions}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id={`opportunity-${opportunity.id}`} className={cardClass}>
      <CardContent className="space-y-3">
        <CardHead
          mark={mark('h-10 w-10')}
          title={opportunity.title}
          /* Company, type and remote are facts about the listing: one line,
             where the type and remote were two tinted pills. */
          subtitle={(
            <FactLine
              className="text-sm"
              items={[
                opportunity.company,
                <BilingualText key="type" en={opportunitiesEn(cfg.labelKey)} el={opportunitiesEl(cfg.labelKey)} compact />,
                opportunity.isRemote ? <BilingualText key="remote" en={opportunitiesEn('remote')} el={opportunitiesEl('remote')} compact /> : null,
              ]}
            />
          )}
        />

        {opportunity.description && (
          <p className="card-body line-clamp-2 text-muted-foreground">{opportunity.description}</p>
        )}

        <FactLine items={opportunity.tags ?? []} />

        <FactLine
          items={[
            opportunity.location,
            deadlineItem,
            // A bare name at the end of the line did not say who it was.
            opportunity.createdBy.displayName ? (
              <BilingualText key="by" en={`Posted by ${opportunity.createdBy.displayName}`} el={`Από ${opportunity.createdBy.displayName}`} compact />
            ) : null,
            postedAgo,
          ]}
        />

        <div className="flex flex-wrap gap-2 pt-1">{actions}</div>
      </CardContent>
    </Card>
  );
}
