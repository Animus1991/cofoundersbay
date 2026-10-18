import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Facts about a card's subject - stage, place, sector, level, topics,
 * cheque size - as one muted line, dot-separated.
 *
 * A pill is kept for a state (status, outcome, "actively scouting") or a
 * control. Facts set as pills read as buttons, add a tint each, and are one
 * more level to rank: on 2026-10-09 a phone met up to eight of them on one
 * investor card (`.probes/card_type.mjs`).
 */
/**
 * Tags arrive as typed ("ai", "saas", "b2b"), and a fact line capitalises its
 * first letter, which made them "Ai", "Saas" and "B2b". A tag that is a known
 * acronym or sector name shows in its usual spelling.
 */
const ACRONYMS: Record<string, string> = {
  ai: 'AI', ml: 'ML', llm: 'LLM', nlp: 'NLP', saas: 'SaaS', paas: 'PaaS', b2b: 'B2B', b2c: 'B2C', b2b2c: 'B2B2C',
  gtm: 'GTM', ux: 'UX', ui: 'UI', api: 'API', iot: 'IoT', vc: 'VC', seo: 'SEO', crm: 'CRM', mvp: 'MVP', kpi: 'KPI',
  okr: 'OKR', esg: 'ESG', hr: 'HR', pr: 'PR', ar: 'AR', vr: 'VR', erp: 'ERP', ip: 'IP', gdpr: 'GDPR', safe: 'SAFE',
  fintech: 'FinTech', edtech: 'EdTech', healthtech: 'HealthTech', proptech: 'PropTech', cleantech: 'CleanTech',
  insurtech: 'InsurTech', regtech: 'RegTech', legaltech: 'LegalTech', foodtech: 'FoodTech', agritech: 'AgriTech',
  deeptech: 'DeepTech', climatetech: 'ClimateTech', martech: 'MarTech', medtech: 'MedTech',
};

export function FactLine({
  items,
  label,
  className,
}: {
  items: readonly ReactNode[];
  /** Names the list for a screen reader when the facts are not self-evident. */
  label?: string;
  className?: string;
}) {
  const shown = items
    .filter((item) => item !== null && item !== undefined && item !== false && item !== '')
    .map((item) => (typeof item === 'string' ? ACRONYMS[item.trim().toLowerCase()] ?? item : item));
  if (!shown.length) return null;
  return (
    <ul aria-label={label} className={cn('facts-dotted flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground', className)}>
      {shown.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
