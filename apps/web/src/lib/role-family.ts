/**
 * The four families a member's role belongs to.
 *
 * Roles arrive in more spellings than the platform's four ("cofounder",
 * "angel_investor", "vc_scout", "community_manager"). The role badge names
 * the family; matching explains a match by it. One table, so the badge and
 * the reasons under it never disagree about who someone is.
 */
export type RoleFamily = 'founder' | 'mentor' | 'investor' | 'org';

export function roleFamily(raw: string | null | undefined): RoleFamily | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  if (key === 'founder' || key === 'mentor' || key === 'investor' || key === 'org') return key;
  if (key === 'cofounder' || key === 'co_founder' || key === 'technical_talent' || key === 'operator') {
    return 'founder';
  }
  if (key === 'advisor' || key === 'coach') return 'mentor';
  if (key === 'angel' || key === 'angel_investor' || key === 'vc' || key === 'vc_analyst' || key === 'vc_scout') {
    return 'investor';
  }
  if (key === 'organization' || key === 'admin' || key === 'community_manager') return 'org';
  return null;
}

/**
 * The family's name, as the role badge writes it. A list that names someone's
 * role without the badge's chrome reads it from here, so the inbox row and
 * the thread's header beside it call the same person the same thing: the row
 * said "Cofounder" and the header "Founder" (docs §73).
 */
export const ROLE_FAMILY_LABEL: Record<RoleFamily, { en: string; el: string }> = {
  founder: { en: 'Founder', el: 'Ιδρυτής' },
  mentor: { en: 'Mentor', el: 'Μέντορας' },
  investor: { en: 'Investor', el: 'Επενδυτής' },
  org: { en: 'Organization', el: 'Οργανισμός' },
};
