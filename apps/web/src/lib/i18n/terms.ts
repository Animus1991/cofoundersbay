/**
 * Tags and sectors arrive as typed ("ai", "saas", "b2b"), and the same sector was "Fintech" on one
 * card and "FinTech" on the next; a fact line also capitalised "ai" into "Ai".
 * A known acronym or sector name shows in its usual spelling.
 */
const SPELLINGS: Record<string, string> = {
  ai: 'AI', ml: 'ML', llm: 'LLM', nlp: 'NLP', saas: 'SaaS', paas: 'PaaS', b2b: 'B2B', b2c: 'B2C', b2b2c: 'B2B2C',
  gtm: 'GTM', ux: 'UX', ui: 'UI', api: 'API', iot: 'IoT', vc: 'VC', seo: 'SEO', crm: 'CRM', mvp: 'MVP', kpi: 'KPI',
  okr: 'OKR', esg: 'ESG', hr: 'HR', pr: 'PR', ar: 'AR', vr: 'VR', erp: 'ERP', ip: 'IP', gdpr: 'GDPR', safe: 'SAFE',
  fintech: 'FinTech', edtech: 'EdTech', healthtech: 'HealthTech', proptech: 'PropTech', cleantech: 'CleanTech',
  insurtech: 'InsurTech', regtech: 'RegTech', legaltech: 'LegalTech', foodtech: 'FoodTech', agritech: 'AgriTech',
  deeptech: 'DeepTech', climatetech: 'ClimateTech', martech: 'MarTech', medtech: 'MedTech',
};

/** "fintech", "Fintech" → "FinTech"; "saas" → "SaaS"; anything else as written. */
export function termDisplay(term: string): string {
  return SPELLINGS[term.trim().toLowerCase()] ?? term;
}
