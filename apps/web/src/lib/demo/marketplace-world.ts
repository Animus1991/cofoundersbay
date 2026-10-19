/**
 * The demo's service providers, defined once.
 *
 * They used to live inside /marketplace with no member behind them, so
 * "Message" and "Request" could only open an outside link, and with none they
 * were disabled on every card. Each now has a member id: the cards open a
 * conversation with them, and the demo's messaging and profile handlers know
 * who they are. The people and firms are invented.
 */

export type DemoProvider = {
  id: string;
  providerName: string;
  /** The member behind the listing: "Message" and "Request" open a conversation with them. */
  providerUserId?: string;
  providerAvatar?: string;
  providerTitle: string;
  title: string;
  description: string;
  category: string;
  specialties: string[];
  pricing: string;
  pricingTier: 'free' | 'paid' | 'custom';
  avgRating: number;
  reviewCount: number;
  clientCount: number;
  responseTime: string;
  location: string;
  isVerified: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  websiteUrl?: string;
  contactUrl?: string;
};

export const DEMO_PROVIDERS: DemoProvider[] = [
  {
    id: '1', providerName: 'Alexandra Kosta', providerUserId: 'user-alexandra-kosta', providerTitle: 'Startup Legal Counsel',
    title: 'Startup Legal Package', description: 'Full legal coverage for early-stage startups: incorporation, term sheets, SAFE notes, IP protection, NDAs, and co-founder agreements.',
    category: 'legal', specialties: ['Incorporation', 'Term Sheets', 'IP', 'SAFE Notes'],
    pricing: 'From €500', pricingTier: 'paid', avgRating: 4.9, reviewCount: 47, clientCount: 82,
    responseTime: '< 24h', location: 'Athens, GR', isVerified: true, isFeatured: true, isAvailable: true,
  },
  {
    id: '2', providerName: 'Mark Thompson', providerUserId: 'user-mark-thompson', providerTitle: 'CFO-as-a-Service',
    title: 'Financial Modeling & Fundraising Prep', description: 'Build investor-grade financial models, cap tables, and fundraising narratives. Former accelerator CFO advising early-stage teams.',
    category: 'finance', specialties: ['Financial Modeling', 'Cap Table', 'Pitch Financials', 'Due Diligence'],
    pricing: 'From €800/mo', pricingTier: 'paid', avgRating: 4.8, reviewCount: 34, clientCount: 61,
    responseTime: '< 48h', location: 'London, UK', isVerified: true, isFeatured: true, isAvailable: true,
  },
  {
    id: '3', providerName: 'Sofia Papadaki', providerUserId: 'user-sofia-papadaki', providerTitle: 'Growth Marketing Strategist',
    title: 'GTM Strategy & Growth Hacking', description: 'Full-funnel growth strategy for B2B SaaS. SEO, paid acquisition, content, and lifecycle marketing. 3x average ARR growth for clients.',
    category: 'marketing', specialties: ['GTM Strategy', 'SEO', 'Paid Ads', 'B2B SaaS'],
    pricing: 'From €600/mo', pricingTier: 'paid', avgRating: 4.7, reviewCount: 28, clientCount: 40,
    responseTime: '< 12h', location: 'Remote', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '4', providerName: 'ByteCraft Studio', providerUserId: 'user-bytecraft-studio', providerTitle: 'Full-Stack Development Agency',
    title: 'MVP Development & Technical Architecture', description: 'From zero to deployed MVP in 6-8 weeks. React/Next.js + Node.js. Technical co-founder level quality without the equity.',
    category: 'development', specialties: ['React', 'Node.js', 'MVP', 'Architecture'],
    pricing: 'From €5K', pricingTier: 'paid', avgRating: 4.6, reviewCount: 19, clientCount: 28,
    responseTime: '< 24h', location: 'Berlin, DE', isVerified: true, isFeatured: true, isAvailable: false,
  },
  {
    id: '5', providerName: 'Pavlos Georgiadis', providerUserId: 'user-pavlos-georgiadis', providerTitle: 'Brand & UX Designer',
    title: 'Brand Identity & Product Design', description: 'End-to-end brand and product design. Logo, design system, UI/UX for web and mobile. Previously led design at 2 unicorns.',
    category: 'design', specialties: ['Brand Identity', 'UI/UX', 'Design Systems', 'Figma'],
    pricing: 'From €1.5K', pricingTier: 'paid', avgRating: 4.9, reviewCount: 63, clientCount: 90,
    responseTime: '< 6h', location: 'Thessaloniki, GR', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '6', providerName: 'Elena Vasilis', providerUserId: 'user-elena-vasilis', providerTitle: 'Startup Strategy Consultant',
    title: 'Business Model & Investor Readiness', description: 'Validate your business model, refine positioning, and prepare for investor conversations. Former VC turned founder advisor.',
    category: 'consulting', specialties: ['Business Model', 'Investor Readiness', 'Strategy', 'Positioning'],
    pricing: 'From €300/session', pricingTier: 'paid', avgRating: 4.8, reviewCount: 41, clientCount: 55,
    responseTime: '< 24h', location: 'Amsterdam, NL', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '7', providerName: 'James Obi', providerUserId: 'user-james-obi', providerTitle: 'Founder & Executive Coach',
    title: 'Founder Coaching & Leadership Development', description: 'ICF-certified executive coach specializing in first-time founders. Clarity, resilience, team leadership, and high-performance habits.',
    category: 'coaching', specialties: ['Executive Coaching', 'Leadership', 'Mindset', 'Team Dynamics'],
    pricing: 'From €150/session', pricingTier: 'paid', avgRating: 5.0, reviewCount: 22, clientCount: 35,
    responseTime: '< 24h', location: 'Remote', isVerified: true, isFeatured: false, isAvailable: true,
  },
  {
    id: '8', providerName: 'Anna Christodoulou', providerUserId: 'user-anna-christodoulou', providerTitle: 'Talent & Recruiting Partner',
    title: 'Technical & Startup Recruiting', description: 'Hire your first 10 engineers and product managers faster. Startup-native recruiting methodology with pre-vetted candidate pipeline.',
    category: 'other', specialties: ['Tech Recruiting', 'Talent Strategy', 'Sourcing', 'Interviews'],
    pricing: 'Custom', pricingTier: 'custom', avgRating: 4.7, reviewCount: 15, clientCount: 22,
    responseTime: '< 48h', location: 'Athens, GR', isVerified: false, isFeatured: false, isAvailable: true,
  },
];

/** A provider as the demo's profile and messaging handlers read a member. */
export function demoProviderPerson(userId: string) {
  const p = DEMO_PROVIDERS.find((x) => x.providerUserId === userId);
  if (!p?.providerUserId) return null;
  return {
    id: `hit-${p.providerUserId}`,
    userId: p.providerUserId,
    displayName: p.providerName,
    headline: p.providerTitle,
    bio: p.description,
    location: p.location,
    role: 'service_provider',
    avatarUrl: null,
    skillNames: p.specialties.slice(0, 3),
    industries: [p.category],
    lookingFor: 'clients',
  };
}
