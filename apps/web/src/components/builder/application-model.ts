import type { CfbGlyphName } from '@/components/icons/CfbGlyph';

export interface ApplicationQuestion {
  id: string;
  question: string;
  answer: string;
  maxLength?: number;
  tips?: string;
  required: boolean;
}

export interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;
  descKey?: 'app_yc_desc' | 'app_ts_desc' | 'app_uni_desc' | 'app_grant_desc';
  glyph: CfbGlyphName;
  deadline?: string;
  deadlineKey?: 'app_deadline_rolling' | 'app_deadline_varies';
  website?: string;
  questions: ApplicationQuestion[];
  status: 'draft' | 'in-progress' | 'completed' | 'submitted';
}

export function requiredCompletion(app: { questions: ApplicationQuestion[] }): number {
  const required = app.questions.filter((q) => q.required);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => q.answer.trim().length > 0);
  return Math.round((answered.length / required.length) * 100);
}

export function deriveApplicationStatus(
  app: ApplicationTemplate,
): ApplicationTemplate['status'] {
  if (app.status === 'submitted') return 'submitted';
  const pct = requiredCompletion(app);
  if (pct === 0) return 'draft';
  if (pct === 100) return 'completed';
  return 'in-progress';
}
