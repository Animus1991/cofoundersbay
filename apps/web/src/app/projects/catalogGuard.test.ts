import { describe, expect, it } from 'vitest';
import {
  DEMO_PROJECTS_ME_ID,
  DEMO_PROJECTS_SEED,
  demoProjectStats,
  getDemoProject,
  isJoinedProject,
  isOwnedProject,
  resolveDemoProjects,
} from '@/lib/projects-demo';

describe('projects catalogue lockstep', () => {
  const projects = resolveDemoProjects();
  const stats = demoProjectStats(projects);

  it('keeps discover counts aligned with the summary strip', () => {
    expect(projects).toHaveLength(3);
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(1);
    expect(stats.openRoles).toBe(7);
    expect(stats.industries).toBe(3);
  });

  it('does not show EcoTrack for every project id', () => {
    expect(getDemoProject('1')?.name).toBe('EcoTrack');
    expect(getDemoProject('2')?.name).toBe('MentorMatch');
    expect(getDemoProject('3')?.name).toBe('HealthSync');
    expect(getDemoProject('missing')).toBeUndefined();
  });

  it('fills My projects / Joined / Starred so those tabs are not always empty', () => {
    const mine = projects.filter((p) => isOwnedProject(p));
    const joined = projects.filter((p) => isJoinedProject(p));
    const starred = projects.filter((p) => p.isStarred);
    expect(mine.map((p) => p.name)).toEqual(['HealthSync']);
    expect(joined.map((p) => p.name)).toEqual(['MentorMatch']);
    expect(starred.map((p) => p.name)).toEqual(['EcoTrack']);
    expect(mine[0]?.founder.id).toBe(DEMO_PROJECTS_ME_ID);
    expect(DEMO_PROJECTS_SEED).toHaveLength(3);
  });
});
