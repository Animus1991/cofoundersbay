/**
 * The demo's investors beyond its cast, defined once.
 *
 * They used to be a list inside /investors with ids no other part of the
 * demo knew ("sample-inv-2"), so their Profile and Message buttons were
 * disabled: there was no profile to open and no inbox to write to. Now
 * /investors lists them, /profiles/<id> shows them and /messages?to=<id>
 * opens a conversation with them, all from this one list. The people and
 * firms are invented; none names a real fund or company.
 */

export type DemoInvestorType = 'angel_investor' | 'vc' | 'vc_scout' | 'syndicate' | 'cvc' | 'family_office';

export type DemoInvestor = {
  id: string;
  userId: string;
  displayName: string;
  /** Where they are based, for their profile; `geographies` is where they invest. */
  location: string;
  investorType: DemoInvestorType;
  firmName?: string;
  firmRole?: string;
  thesisSummary: string;
  industries: string[];
  stages: string[];
  checkSizeMin: number;
  checkSizeMax: number;
  geographies: string[];
  isVerified: boolean;
  isActivelyScouting: boolean;
  portfolioCount: number;
  viewCount: number;
  dealsThisYear: number;
};

export const DEMO_INVESTORS: DemoInvestor[] = [
  {
    id: 'inv-irini-kosta', userId: 'user-irini-kosta', displayName: 'Irini Kosta', location: 'Athens, Greece',
    investorType: 'angel_investor', firmName: 'Kosta Angels', firmRole: 'Founding partner',
    thesisSummary: 'AI-native tools that remove human bottlenecks from B2B workflows.',
    industries: ['AI/ML', 'Developer tools', 'B2B SaaS'], stages: ['pre-seed', 'seed'],
    checkSizeMin: 25_000, checkSizeMax: 150_000, geographies: ['Greece', 'EU'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 24, viewCount: 1842, dealsThisYear: 6,
  },
  {
    id: 'inv-michalis-theodorou', userId: 'user-michalis-theodorou', displayName: 'Michalis Theodorou', location: 'Nicosia, Cyprus',
    investorType: 'vc', firmName: 'Levant Capital', firmRole: 'Principal',
    thesisSummary: 'B2B SaaS with strong net revenue retention and a clear expansion path.',
    industries: ['B2B SaaS', 'FinTech', 'Digital health'], stages: ['seed', 'series-a'],
    checkSizeMin: 500_000, checkSizeMax: 3_000_000, geographies: ['Greece', 'Cyprus', 'UK'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 45, viewCount: 3210, dealsThisYear: 12,
  },
  {
    id: 'inv-helena-brandt', userId: 'user-helena-brandt', displayName: 'Helena Brandt', location: 'London, UK',
    investorType: 'angel_investor', firmRole: 'Independent angel',
    thesisSummary: 'Financial infrastructure: payments, embedded finance and access to credit.',
    industries: ['FinTech', 'Payments', 'Embedded finance'], stages: ['pre-seed', 'seed'],
    checkSizeMin: 10_000, checkSizeMax: 75_000, geographies: ['UK', 'EU'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 18, viewCount: 967, dealsThisYear: 5,
  },
  {
    id: 'inv-andreas-papadopoulos', userId: 'user-andreas-papadopoulos', displayName: 'Andreas Papadopoulos', location: 'Thessaloniki, Greece',
    investorType: 'vc', firmName: 'Meridian Deep Tech Fund', firmRole: 'Partner',
    thesisSummary: 'Deep tech, climate and biotech from Southern Europe with global ambitions.',
    industries: ['Deep tech', 'Climate', 'Biotech'], stages: ['seed', 'series-a'],
    checkSizeMin: 200_000, checkSizeMax: 1_500_000, geographies: ['Greece', 'SE Europe', 'EU'],
    isVerified: true, isActivelyScouting: false, portfolioCount: 31, viewCount: 2104, dealsThisYear: 8,
  },
  {
    id: 'inv-priya-nair', userId: 'user-priya-nair', displayName: 'Priya Nair', location: 'London, UK',
    investorType: 'vc_scout', firmName: 'Scout programme', firmRole: 'Scout',
    thesisSummary: 'Consumer health, mental wellness and longevity at pre-seed.',
    industries: ['Health tech', 'Mental health', 'Wellness'], stages: ['pre-seed', 'seed'],
    checkSizeMin: 100_000, checkSizeMax: 500_000, geographies: ['UK', 'India'],
    isVerified: true, isActivelyScouting: true, portfolioCount: 9, viewCount: 712, dealsThisYear: 3,
  },
  {
    id: 'inv-klaus-weber', userId: 'user-klaus-weber', displayName: 'Klaus Weber', location: 'Munich, Germany',
    investorType: 'family_office', firmName: 'Weber Family Office', firmRole: 'Investment director',
    thesisSummary: 'Capital-efficient SaaS and marketplaces with €500K+ ARR.',
    industries: ['SaaS', 'Marketplaces', 'E-commerce'], stages: ['series-a', 'series-b'],
    checkSizeMin: 1_000_000, checkSizeMax: 5_000_000, geographies: ['DACH', 'EU'],
    isVerified: false, isActivelyScouting: false, portfolioCount: 14, viewCount: 455, dealsThisYear: 2,
  },
];

/** A demo member as the demo's profile and messaging handlers read one. */
export type DemoPerson = {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  role: string;
  avatarUrl: null;
  skillNames: string[];
  industries: string[];
  lookingFor?: string;
  availability?: string;
};

export function demoInvestorPerson(userId: string): DemoPerson | null {
  const inv = DEMO_INVESTORS.find((i) => i.userId === userId || i.id === userId);
  if (!inv) return null;
  return {
    id: inv.id,
    userId: inv.userId,
    displayName: inv.displayName,
    headline: [inv.firmRole, inv.firmName].filter(Boolean).join(' · '),
    bio: inv.thesisSummary,
    location: inv.location,
    role: 'investor',
    avatarUrl: null,
    skillNames: inv.industries.slice(0, 3),
    industries: inv.industries,
    lookingFor: 'founders',
  };
}
