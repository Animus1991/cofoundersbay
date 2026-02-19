// Shared domain types (API + Web)

export type UserRole = 'founder' | 'mentor' | 'investor' | 'org';

export interface UserProfileBase {
  id: string;
  role: UserRole;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export type VisibilityLevel = 'public' | 'connections' | 'private';

export interface ProfileVisibilityRules {
  email?: VisibilityLevel;
  phone?: VisibilityLevel;
  location?: VisibilityLevel;
}

export interface PublicProfile {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  languages: string[] | null;
  avatarUrl: string | null;
  role: UserRole;
  rolePayload: Record<string, unknown> | null;
  skills: { skillId: string; skillName: string; level: string | null }[];
  createdAt: string;
  updatedAt: string;
}
