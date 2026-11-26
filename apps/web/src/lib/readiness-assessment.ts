/**
 * The readiness assessment as data (docs §158): the six dimensions, their
 * criteria in Greek, the showcase's seed and how an answer is checked and
 * turned into what a page draws. Moved unchanged from the Readiness page so
 * the Builder's Readiness tab reads exactly what that page reads, instead of
 * keeping a second list of criteria of its own.
 */
import type { CfbGlyphName } from '@/components/icons/CfbGlyph';
import type { ReadinessOverall } from '@/lib/api';
import { readinessEn, readinessEl } from '@/lib/i18n/strings-readiness';
import { DEMO_CRITERIA, applyOverlay, type ReadinessOverlay } from '@/lib/readiness-demo';
import { STATUS, type StatusChipClasses, type StatusTone } from '@/lib/semantic-colors';

export const DIMENSION_META: Record<string, {
  glyph: CfbGlyphName;
  labelEn: string;
  labelEl: string;
  descriptionEn: string;
  descriptionEl: string;
  acceleratorWeight: number;
  investorWeight: number;
}> = {
  team:      { glyph: 'people',    labelEn: readinessEn('dim_team'),      labelEl: readinessEl('dim_team'),      descriptionEn: readinessEn('dim_team_desc'),      descriptionEl: readinessEl('dim_team_desc'),      acceleratorWeight: 25, investorWeight: 30 },
  market:    { glyph: 'target',    labelEn: readinessEn('dim_market'),    labelEl: readinessEl('dim_market'),    descriptionEn: readinessEn('dim_market_desc'),    descriptionEl: readinessEl('dim_market_desc'),    acceleratorWeight: 20, investorWeight: 25 },
  product:   { glyph: 'builder',   labelEn: readinessEn('dim_product'),   labelEl: readinessEl('dim_product'),   descriptionEn: readinessEn('dim_product_desc'),   descriptionEl: readinessEl('dim_product_desc'),   acceleratorWeight: 20, investorWeight: 20 },
  business:  { glyph: 'briefcase', labelEn: readinessEn('dim_business'),  labelEl: readinessEl('dim_business'),  descriptionEn: readinessEn('dim_business_desc'),  descriptionEl: readinessEl('dim_business_desc'),  acceleratorWeight: 15, investorWeight: 15 },
  funding:   { glyph: 'wallet',    labelEn: readinessEn('dim_funding'),   labelEl: readinessEl('dim_funding'),   descriptionEn: readinessEn('dim_funding_desc'),   descriptionEl: readinessEl('dim_funding_desc'),   acceleratorWeight: 10, investorWeight: 5  },
  execution: { glyph: 'flag',      labelEn: readinessEn('dim_execution'), labelEl: readinessEl('dim_execution'), descriptionEn: readinessEn('dim_execution_desc'), descriptionEl: readinessEl('dim_execution_desc'), acceleratorWeight: 10, investorWeight: 5  },
};

export const CRITERION_EL: Record<string, string> = {
  'Co-founder identified': readinessEl('crit_cofounder_identified'),
  'Complementary skills covered': readinessEl('crit_complementary_skills'),
  'Full-time commitment secured': readinessEl('crit_fulltime_commitment'),
  'Previous startup experience': readinessEl('crit_previous_experience'),
  'Advisory board in place': readinessEl('crit_advisory_board'),
  'Target market defined': readinessEl('crit_target_market'),
  'Market size validated (TAM/SAM)': readinessEl('crit_market_size'),
  'Competitive analysis completed': readinessEl('crit_competitive_analysis'),
  'Customer interviews (10+)': readinessEl('crit_customer_interviews'),
  'Market timing analysis': readinessEl('crit_market_timing'),
  'Problem validated with users': readinessEl('crit_problem_validated'),
  'Solution clearly defined': readinessEl('crit_solution_defined'),
  'MVP built and tested': readinessEl('crit_mvp_built'),
  'User feedback collected': readinessEl('crit_user_feedback'),
  'Product roadmap documented': readinessEl('crit_roadmap'),
  'Revenue model defined': readinessEl('crit_revenue_model'),
  'Pricing strategy validated': readinessEl('crit_pricing_validated'),
  'Unit economics calculated': readinessEl('crit_unit_economics'),
  'Go-to-market strategy defined': readinessEl('crit_gtm_strategy'),
  'Partnership strategy outlined': readinessEl('crit_partnerships'),
  'Pitch deck ready (10-12 slides)': readinessEl('crit_pitch_deck'),
  'Financial projections (3 years)': readinessEl('crit_financial_projections'),
  'Data room prepared': readinessEl('crit_data_room'),
  'Target investor list built': readinessEl('crit_investor_list'),
  'Term sheet knowledge ready': readinessEl('crit_term_sheet'),
  'OKRs / quarterly goals set': readinessEl('crit_okrs'),
  'Key milestones defined': readinessEl('crit_milestones'),
  'Core metrics tracked': readinessEl('crit_metrics_tracked'),
  'Regular retrospectives held': readinessEl('crit_retrospectives'),
  'Documentation practices in place': readinessEl('crit_documentation'),
};

export const DEMO_RECS: Record<string, { en: string; el: string }> = {
  team:      { en: 'Add an advisor with proven domain expertise to strengthen your credibility.', el: 'Προσθέστε σύμβουλο με αποδεδειγμένη εμπειρία στον τομέα για αξιοπιστία.' },
  market:    { en: 'Complete a competitive landscape analysis and conduct 10+ structured customer interviews.', el: 'Ολοκληρώστε ανταγωνιστική ανάλυση και κάντε 10+ δομημένες συνεντεύξεις πελατών.' },
  product:   { en: 'Create a detailed product roadmap covering the next 6 months with clear milestones.', el: 'Φτιάξτε αναλυτικό χάρτη προϊόντος για τους επόμενους 6 μήνες με σαφή ορόσημα.' },
  business:  { en: 'Validate your pricing with at least 5 potential customers and calculate unit economics.', el: 'Επικυρώστε την τιμολόγηση με τουλάχιστον 5 δυνητικούς πελάτες και υπολογίστε τα μοναδιαία οικονομικά.' },
  funding:   { en: 'Build a 3-year financial model and prepare your data room before approaching investors.', el: 'Φτιάξτε τριετές οικονομικό μοντέλο και ετοιμάστε το data room πριν προσεγγίσετε επενδυτές.' },
  execution: { en: 'Implement bi-weekly retrospectives and document your processes in a shared wiki.', el: 'Καθιερώστε ανασκοπήσεις ανά δύο εβδομάδες και τεκμηριώστε τις διαδικασίες σε κοινό wiki.' },
};

export const REC_EL: Record<string, string> = Object.fromEntries(
  Object.values(DEMO_RECS).map((pair) => [pair.en, pair.el]),
);

export type DimCriterion = { id: string; name: string; nameEl?: string; completed: boolean; weight: number };

export type DimData = {
  key: string;
  glyph: CfbGlyphName;
  labelEn: string;
  labelEl: string;
  descriptionEn: string;
  descriptionEl: string;
  score: number;
  maxScore: number;
  criteria: DimCriterion[];
  recommendations: { en: string; el?: string }[];
  acceleratorWeight: number;
  investorWeight: number;
};

export type ScoreLevel = 'excellent' | 'good' | 'needs-work' | 'critical';

export function scoreToStatus(pct: number): ScoreLevel {
  if (pct >= 80) return 'excellent';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'needs-work';
  return 'critical';
}

export const SCORE_TONE: Record<ScoreLevel, StatusTone> = {
  excellent: 'success',
  good: 'info',
  'needs-work': 'warning',
  critical: 'danger',
};

export const STATUS_LABEL: Record<ScoreLevel, { en: string; el: string }> = {
  excellent: { en: readinessEn('status_excellent_label'), el: readinessEl('status_excellent_label') },
  good: { en: readinessEn('status_good_label'), el: readinessEl('status_good_label') },
  'needs-work': { en: readinessEn('status_needs_work_label'), el: readinessEl('status_needs_work_label') },
  critical: { en: readinessEn('status_critical_label'), el: readinessEl('status_critical_label') },
};

export function scoreColors(level: ScoreLevel): StatusChipClasses {
  return STATUS[SCORE_TONE[level]];
}

export type AssessmentData = Omit<ReadinessOverall, 'dimensions'> & {
  dimensions: Pick<ReadinessOverall['dimensions'][number], 'dimension' | 'score' | 'maxScore' | 'criteria' | 'recommendations'>[];
};

export function buildDimensions(apiData: AssessmentData): DimData[] {
  return apiData.dimensions.map(({ dimension, score, maxScore, criteria, recommendations }) => ({
    key: dimension,
    ...DIMENSION_META[dimension],
    score,
    maxScore,
    criteria: criteria.map((c) => ({ ...c, nameEl: CRITERION_EL[c.name] })),
    recommendations: recommendations.map((r) => ({ en: r, el: REC_EL[r] })),
  }));
}

export function isAssessmentData(value: unknown): value is AssessmentData {
  if (!value || typeof value !== 'object') return false;
  const assessment = value as AssessmentData;
  const validScore = (score: unknown, max: number) => typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= max;
  return typeof assessment.overallMax === 'number' && Number.isFinite(assessment.overallMax) && assessment.overallMax > 0
    && validScore(assessment.overallScore, assessment.overallMax)
    && validScore(assessment.acceleratorReadiness, 100) && validScore(assessment.investorReadiness, 100)
    && (assessment.lastAssessedAt === null || (typeof assessment.lastAssessedAt === 'string' && Number.isFinite(Date.parse(assessment.lastAssessedAt))))
    && Array.isArray(assessment.dimensions) && assessment.dimensions.length > 0
    && assessment.dimensions.every((d) => d && Object.prototype.hasOwnProperty.call(DIMENSION_META, d.dimension)
      && typeof d.maxScore === 'number' && Number.isFinite(d.maxScore) && d.maxScore > 0 && validScore(d.score, d.maxScore)
      && Array.isArray(d.criteria) && d.criteria.every((c) => c && typeof c.id === 'string' && typeof c.name === 'string'
        && typeof c.completed === 'boolean' && validScore(c.weight, 100))
      && Array.isArray(d.recommendations) && d.recommendations.every((r) => typeof r === 'string'))
    && new Set(assessment.dimensions.map((d) => d.dimension)).size === assessment.dimensions.length;
}

export function buildDemoAssessment(overlay: ReadinessOverlay = {}): AssessmentData {
  const dimensions = Object.entries(DEMO_CRITERIA).map(([dimension, seed]) => {
    // Every number on this page is derived from these flags and their weights,
    // which is why the demo can be made writable by overriding the flags alone
    // — dimension score, overall, accelerator and investor readiness all
    // recompute from here rather than being stored anywhere.
    const criteria = applyOverlay(dimension, seed, overlay) as typeof seed;
    return {
      dimension, criteria, maxScore: 100,
      score: criteria.reduce((sum, criterion) => sum + (criterion.completed ? criterion.weight : 0), 0),
      recommendations: [DEMO_RECS[dimension].en],
    };
  });
  const weightedScore = (audience: 'acceleratorWeight' | 'investorWeight') => Math.round(
    dimensions.reduce((sum, d) => sum + (d.score / d.maxScore) * DIMENSION_META[d.dimension][audience], 0),
  );
  return {
    dimensions, overallScore: Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length),
    overallMax: 100, lastAssessedAt: null,
    acceleratorReadiness: weightedScore('acceleratorWeight'), investorReadiness: weightedScore('investorWeight'),
  };
}

/** The heaviest criterion still open across the six, with its dimension: the page's "Next to complete". */
export function nextOpenCriterion(dimensions: DimData[]) {
  return dimensions
    .flatMap((d) => d.criteria
      .filter((c) => !c.completed)
      .map((c) => ({ ...c, dimKey: d.key, dimLabelEn: d.labelEn, dimLabelEl: d.labelEl })))
    .sort((a, b) => b.weight - a.weight)[0];
}
