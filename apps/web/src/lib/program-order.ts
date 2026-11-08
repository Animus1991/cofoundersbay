/**
 * The open ones first (docs §115): a programme running, then one opening for
 * applications, then drafts, finished and archived ones. Programme pages for an
 * organisation, a tenant and the platform use this one order, and a cohort list
 * puts the running cohort first the same way. Sorting with it is stable, so
 * within a state the API's order stays.
 */
const PROGRAM_STATE_RANK: Record<string, number> = { active: 0, upcoming: 1, recruiting: 1, draft: 2, completed: 3, archived: 4 };

export function openFirst(a: { status: string }, b: { status: string }): number {
  return (PROGRAM_STATE_RANK[a.status] ?? 5) - (PROGRAM_STATE_RANK[b.status] ?? 5);
}
