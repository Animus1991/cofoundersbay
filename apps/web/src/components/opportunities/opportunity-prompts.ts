import { Briefcase, Building2, Coins, FileText, Handshake, Rocket, Users } from 'lucide-react';
import type { OpportunityItem, OpportunityType } from '@/lib/api';
import { opportunitiesEn, opportunitiesEl } from '@/lib/i18n/strings-opportunities';
import type { AskText } from '@/lib/page-questions';

export const OPP_TYPE_DISPLAY: Record<OpportunityType, { labelKey: `type_${OpportunityType}`; className: string; icon: typeof Briefcase }> = {
  cofounder: { labelKey: 'type_cofounder', className: 'bg-status-accent-bg text-status-accent border-status-accent-border ', icon: Handshake },
  job: { labelKey: 'type_job', className: 'bg-primary/10 text-primary-accessible border-primary/20', icon: Building2 },
  investment: { labelKey: 'type_investment', className: 'bg-status-success-bg text-status-success border-status-success-border ', icon: Coins },
  partnership: { labelKey: 'type_partnership', className: 'bg-status-accent-bg text-status-accent border-status-accent-border ', icon: Users },
  mentorship: { labelKey: 'type_mentorship', className: 'bg-status-warning-bg text-status-warning border-status-warning-border ', icon: Rocket },
  other: { labelKey: 'type_other', className: 'bg-muted text-muted-foreground border-border', icon: FileText },
};

/** What "Draft an approach" asks, in both languages (the card and the assistant's command). */
export function approachPrompt(opportunity: OpportunityItem): AskText {
  const cfg = OPP_TYPE_DISPLAY[opportunity.type] ?? OPP_TYPE_DISPLAY.other;
  return {
    en: `Draft my approach for this opportunity: "${opportunity.title}"${opportunity.company ? ` at ${opportunity.company}` : ''}. Type: ${opportunitiesEn(cfg.labelKey)}. ${opportunity.description ?? ''}`,
    el: `Ετοίμασε την προσέγγισή μου για αυτή την ευκαιρία: «${opportunity.title}»${opportunity.company ? ` στην ${opportunity.company}` : ''}. Είδος: ${opportunitiesEl(cfg.labelKey)}. ${opportunity.description ?? ''}`,
  };
}
