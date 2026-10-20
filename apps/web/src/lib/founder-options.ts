/**
 * A founder's match fields, in one place: the stage the startup is at, the
 * time they give it, and who they are looking for.
 *
 * Profile edit offered these and sign-up did not ask, so a new founder was
 * matched on defaults until they found the edit page. The AI Studio
 * prototype asks them in its third onboarding step; ours now does too, from
 * the same lists, so the two can never disagree.
 *
 * Values are what the API stores (`rolePayload.stage`, `.commitment`,
 * `.rolesSought`) and what matching reads (`seekerWants` lower-cases
 * "Co-founder", "CTO" … into the kinds it scores).
 */

export type Option = { value: string; label: string; labelEl: string };

export const STARTUP_STAGES: Option[] = [
  { value: 'idea', label: 'Idea', labelEl: 'Ιδέα' },
  { value: 'mvp', label: 'MVP', labelEl: 'MVP' },
  { value: 'traction', label: 'Traction', labelEl: 'Traction' },
  { value: 'scaling', label: 'Scaling', labelEl: 'Κλιμάκωση' },
];

export const COMMITMENT_LEVELS: (Option & { hint: string; hintEl: string })[] = [
  { value: 'full-time', label: 'Full-time', labelEl: 'Πλήρης απασχόληση', hint: 'This is your main work.', hintEl: 'Είναι η κύρια δουλειά σας.' },
  { value: 'part-time', label: 'Part-time', labelEl: 'Μερική απασχόληση', hint: 'Alongside a job or studies.', hintEl: 'Παράλληλα με δουλειά ή σπουδές.' },
  { value: 'weekends', label: 'Weekends only', labelEl: 'Μόνο Σαββατοκύριακα', hint: 'Weekends only, for now.', hintEl: 'Μόνο Σαββατοκύριακα, προς το παρόν.' },
  { value: 'flexible', label: 'Flexible', labelEl: 'Ευέλικτα', hint: 'It varies from week to week.', hintEl: 'Αλλάζει από εβδομάδα σε εβδομάδα.' },
];

export const LOOKING_FOR_OPTIONS: Option[] = [
  { value: 'Co-founder', label: 'Co-founder', labelEl: 'Συνιδρυτής' },
  { value: 'CTO', label: 'CTO', labelEl: 'CTO' },
  { value: 'Designer', label: 'Designer', labelEl: 'Σχεδιαστής' },
  { value: 'Marketing', label: 'Marketing', labelEl: 'Μάρκετινγκ' },
  { value: 'Sales', label: 'Sales', labelEl: 'Πωλήσεις' },
  { value: 'Operations', label: 'Operations', labelEl: 'Λειτουργίες' },
  { value: 'Other', label: 'Other', labelEl: 'Άλλο' },
];

/** The founder payload from the answers, or undefined when none was given. */
export function founderGoalsPayload(goals: { stage?: string; commitment?: string; lookingFor?: string[] }) {
  const payload: { stage?: string; commitment?: string; rolesSought?: string[] } = {};
  if (goals.stage) payload.stage = goals.stage;
  if (goals.commitment) payload.commitment = goals.commitment;
  if (goals.lookingFor?.length) payload.rolesSought = goals.lookingFor;
  return Object.keys(payload).length ? payload : undefined;
}
