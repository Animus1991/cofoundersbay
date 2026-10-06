import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Compass,
  GraduationCap,
  MessageCircle,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Star,
  Zap,
  Target,
  UserCheck,
  Rocket,
  Network,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingNav } from '@/components/layout/LandingNav';
import { BilingualText } from '@/components/common/BilingualText';
import { MainLandmark } from '@/components/layout/AppShell';
import { NeedCard } from '@/components/commitments/NeedCard';
import { LiveStatsGrid, LiveStatsStrip } from '@/components/landing/LiveStats';
import { ORG_FOUNDERS } from '@/lib/demo/org-world';

const FEATURES: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: Compass,
    title: 'Smart matchmaking',
    desc: 'AI-powered discovery surfaces the right co-founders, mentors, and investors based on role, skills, and stage.',
  },
  {
    icon: MessageCircle,
    title: 'Real-time messaging',
    desc: 'Chat directly with anyone in the network. Threads are persistent, searchable, and support file attachments.',
  },
  {
    icon: GraduationCap,
    title: 'Mentoring & sessions',
    desc: 'Book 1:1 sessions with verified mentors. Integrated scheduling, video links, and session notes.',
  },
  {
    icon: Calendar,
    title: 'Events & networking',
    desc: 'Discover meetups, webinars, and demo days. RSVP in one click and add them to your calendar.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & opportunities',
    desc: 'Startups post roles and equity opportunities. Apply directly through your profile.',
  },
  {
    icon: Shield,
    title: 'Trust & safety',
    desc: 'Verified profiles, moderation tools, and privacy controls to keep the community quality high.',
  },
];

const PERSONAS: Array<{
  icon: LucideIcon;
  role: string;
  color: string;
  bg: string;
  headline: string;
  bullets: string[];
}> = [
  {
    icon: Briefcase,
    role: 'Founder',
    color: 'text-primary-accessible',
    bg: 'bg-status-accent-bg border-status-accent-border',
    headline: 'Find your co-founder',
    bullets: [
      'Get matched with complementary skill sets',
      'Showcase traction, vision, and stage',
      'Access mentors and investors in one place',
    ],
  },
  {
    icon: GraduationCap,
    role: 'Mentor',
    color: 'text-status-info',
    bg: 'bg-status-info-bg border-status-info-border',
    headline: 'Scale your impact',
    bullets: [
      'Set availability and get booked instantly',
      'Help vetted founders with real challenges',
      'Build your advisory portfolio',
    ],
  },
  {
    icon: TrendingUp,
    role: 'Investor',
    color: 'text-status-warning',
    bg: 'bg-status-warning-bg border-status-warning-border',
    headline: 'Source deals smarter',
    bullets: [
      'Filter by stage, sector, and geography',
      'See warm intros through shared connections',
      "Track founders you're following",
    ],
  },
  {
    icon: Building2,
    role: 'Accelerator',
    color: 'text-status-accent',
    bg: 'bg-status-accent-bg border-status-accent-border',
    headline: 'Run your cohort',
    bullets: [
      'Organize events and office hours at scale',
      'Connect portfolio founders with mentors',
      'Manage your community in one workspace',
    ],
  },
];

const HOW_IT_WORKS: Array<{ step: number; icon: LucideIcon; title: string; desc: string; color: string }> = [
  {
    step: 1,
    icon: UserCheck,
    title: 'Build your profile',
    desc: 'Complete your guided onboarding. Define your role, expertise, startup stage, work style, and what you\'re looking for in a co-founder or collaborator.',
    color: 'text-primary-accessible bg-status-accent-bg',
  },
  {
    step: 2,
    icon: Target,
    title: 'Get matched intelligently',
    desc: 'Our multi-dimension matching engine scores compatibility across skills, stage, industry, location, values, and goals — with full transparency on why each match appears.',
    color: 'text-status-success bg-status-success-bg',
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Start building together',
    desc: 'Send a connection request, open a private conversation, set shared milestones, and access mentors, investors, and communities — all in one workspace.',
    color: 'text-primary-accessible bg-primary/10',
  },
];

/**
 * The example need card in "One card, three sentences", from the demo world:
 * Harbor is Elena Papadopoulos's startup in Aegean Venture Lab's graduated
 * cohort. Never a real company.
 */
const SAMPLE_NEED_CARD = {
  kind: 'cofounder',
  title: 'Commercial co-founder for Harbor',
  exists: 'Harbor runs a working founder workspace (graph, readiness, builder) with $375K of a $750K seed committed.',
  goal: 'Reach twenty paying founder teams in Athens and close the seed by spring.',
  missing: 'A commercial co-founder who has sold software to founders, studios or programmes.',
  offer: {
    role: 'Co-founder, commercial',
    equity: '8–12%',
    hoursPerWeek: 40,
    scope: 'Own sales, partnerships with programmes and the first commercial hire.',
  },
  category: 'B2B SaaS',
  place: 'Athens, Greece',
  isRemote: false,
  stage: 'building',
  commitment: 'full_time',
  outcome: 'open' as const,
  owner: {
    displayName: ORG_FOUNDERS['user-elena']?.name ?? 'Elena Papadopoulos',
    headline: ORG_FOUNDERS['user-elena']?.headline ?? 'Founder at Harbor',
  },
};

const CARD_STEPS: Array<{ icon: LucideIcon; en: string; el: string; noteEn: string; noteEl: string }> = [
  {
    icon: Target,
    en: 'Say what is missing',
    el: 'Δηλώστε τι λείπει',
    noteEn: 'What exists, the outcome, who is missing — three sentences.',
    noteEl: 'Τι υπάρχει, το αποτέλεσμα, ποιος λείπει — τρεις προτάσεις.',
  },
  {
    icon: MessageCircle,
    en: 'A protected first conversation',
    el: 'Προστατευμένη πρώτη συζήτηση',
    noteEn: 'No phone or email until both sides confirm.',
    noteEl: 'Χωρίς τηλέφωνο ή email έως ότου επιβεβαιώσουν και οι δύο.',
  },
  {
    icon: CheckCircle,
    en: 'Terms in versions, then agreement',
    el: 'Όροι σε εκδόσεις, μετά συμφωνία',
    noteEn: 'Each draft is a version; agreement opens the deal room.',
    noteEl: 'Κάθε πρόχειρο είναι μια έκδοση· η συμφωνία ανοίγει την αίθουσα.',
  },
];

const AFTER_AGREEMENT: Array<{ en: string; el: string }> = [
  { en: 'Readiness', el: 'Ετοιμότητα' },
  { en: 'Milestones', el: 'Ορόσημα' },
  { en: 'Pitch', el: 'Pitch' },
  { en: 'Data room', el: 'Αίθουσα δεδομένων' },
  { en: 'AI next step', el: 'Επόμενο βήμα με AI' },
];

const TESTIMONIALS: Array<{
  name: string; role: string; company: string; avatar: string;
  quote: string; rating: number; tag: string;
}> = [
  {
    name: 'Alexandros Papadopoulos',
    role: 'Founder & CEO',
    company: 'NovaSense.io',
    avatar: 'AP',
    quote: 'I found my technical co-founder within two weeks of joining. The compatibility score wasn\'t just accurate — it explained *why* we\'d work well together. We\'ve been building for 8 months now.',
    rating: 5,
    tag: 'Co-founder Match',
  },
  {
    name: 'Maria Stavridou',
    role: 'Mentor & Angel Investor',
    company: 'Former VP, Workday',
    avatar: 'MS',
    quote: 'CoFounderBay lets me set availability, filter by stage and sector, and only see founders who are genuinely a fit for my expertise. The session booking flow is the smoothest I\'ve used.',
    rating: 5,
    tag: 'Mentor Experience',
  },
  {
    name: 'James Okafor',
    role: 'CTO & Co-founder',
    company: 'GreenLoop Tech',
    avatar: 'JO',
    quote: 'As a technical co-founder looking for a mission-driven startup, the values-based matching was a game changer. I joined a CleanTech company I\'d never have found on LinkedIn.',
    rating: 5,
    tag: 'Co-founder Seeker',
  },
  {
    name: 'Priya Krishnamurthy',
    role: 'Program Director',
    company: 'Athens Innovation Center',
    avatar: 'PK',
    quote: 'We migrated our entire cohort management to CoFounderBay. The tenant workspace, mentor pool, and event system save us hours every week. Our founders love the community features.',
    rating: 5,
    tag: 'Accelerator',
  },
  {
    name: 'Dimitris Lekkas',
    role: 'Seed Investor',
    company: 'Aegean Ventures',
    avatar: 'DL',
    quote: 'The scouting dashboard surfaces early-stage deals I would have completely missed. Pipeline tracking, watchlists, and warm intro paths — everything I need in one clean interface.',
    rating: 5,
    tag: 'Investor Tools',
  },
  {
    name: 'Sofia Hartmann',
    role: 'Founder',
    company: 'Medly Health',
    avatar: 'SH',
    quote: 'From fundraising tracker to pitch deck builder to investor scouting — CoFounderBay replaced four separate tools for me. The profile completion prompts alone helped me land my first VC call.',
    rating: 5,
    tag: 'All-in-one Platform',
  },
];

const PRICING_PLANS: Array<{
  name: string; price: string; period: string; highlight: boolean;
  badge?: string; desc: string; features: string[]; cta: string; href: string;
}> = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    highlight: false,
    desc: 'Everything you need to get started and explore the ecosystem.',
    features: [
      'Full profile with skills & preferences',
      'Up to 10 connection requests/month',
      'Access to mentor directory',
      'Join up to 3 communities',
      'Basic match discovery',
      'Milestone tracker (5 milestones)',
    ],
    cta: 'Start for free',
    href: '/register',
  },
  {
    name: 'Pro',
    price: '€19',
    period: 'per month',
    highlight: true,
    badge: 'Most popular',
    desc: 'For founders and co-founders actively building their startup team.',
    features: [
      'Unlimited connection requests',
      'Priority match placement',
      'Full fundraising toolkit',
      'Unlimited communities & milestones',
      'Startup Builder & Pitch Deck tool',
      'Direct messaging with read receipts',
      'Analytics dashboard',
      'AI Assistant (50 requests/month)',
    ],
    cta: 'Start Pro trial',
    href: '/register?plan=pro',
  },
  {
    name: 'Organization',
    price: 'Custom',
    period: 'per cohort/year',
    highlight: false,
    desc: 'For incubators, accelerators, universities, and innovation hubs.',
    features: [
      'Branded tenant workspace',
      'Program & cohort management',
      'Mentor pool with scheduling',
      'Event management at scale',
      'Advanced analytics & reporting',
      'SSO & domain mapping',
      'API access & webhooks',
      'Dedicated success manager',
    ],
    cta: 'Contact us',
    href: '/contact',
  },
];

// The -400 steps rather than -500: at -500, dimmed by the row's opacity, every
// one of these fell below 4.5:1 on the dark page background.
const TRUSTED_BY: Array<{ name: string; abbr: string; color: string }> = [
  { name: 'Y Combinator',    abbr: 'YC',  color: 'text-status-warning' },
  { name: 'Techstars',       abbr: 'TS',  color: 'text-status-info'   },
  { name: 'EIT Digital',     abbr: 'EIT', color: 'text-status-info'   },
  { name: 'Innovate UK',     abbr: 'IUK', color: 'text-status-success'  },
  { name: 'Google for Startups', abbr: 'GfS', color: 'text-primary-accessible' },
  { name: 'MIT Delta v',     abbr: 'MIT', color: 'text-status-danger'    },
];

/**
 * The Greek beside every string the sections above carry as data. Kept as one
 * map keyed by the English, so the arrays stay readable and a string without
 * an entry still renders (English only) instead of breaking the page.
 */
const LANDING_EL: Record<string, string> = {
  "Smart matchmaking": "Έξυπνες αντιστοιχίσεις",
  "AI-powered discovery surfaces the right co-founders, mentors, and investors based on role, skills, and stage.": "Η ανακάλυψη με AI φέρνει τους σωστούς συνιδρυτές, μέντορες και επενδυτές με βάση ρόλο, δεξιότητες και στάδιο.",
  "Real-time messaging": "Μηνύματα σε πραγματικό χρόνο",
  "Chat directly with anyone in the network. Threads are persistent, searchable, and support file attachments.": "Συνομιλήστε απευθείας με οποιονδήποτε στο δίκτυο. Οι συνομιλίες μένουν, αναζητούνται και δέχονται συνημμένα.",
  "Mentoring & sessions": "Καθοδήγηση & συνεδρίες",
  "Book 1:1 sessions with verified mentors. Integrated scheduling, video links, and session notes.": "Κλείστε συνεδρίες 1:1 με επαληθευμένους μέντορες. Ενσωματωμένος προγραμματισμός, σύνδεσμοι βίντεο και σημειώσεις.",
  "Events & networking": "Εκδηλώσεις & δικτύωση",
  "Discover meetups, webinars, and demo days. RSVP in one click and add them to your calendar.": "Βρείτε meetups, webinars και demo days. Δηλώστε συμμετοχή με ένα κλικ και προσθέστε τα στο ημερολόγιό σας.",
  "Jobs & opportunities": "Θέσεις & ευκαιρίες",
  "Startups post roles and equity opportunities. Apply directly through your profile.": "Οι startups δημοσιεύουν ρόλους και ευκαιρίες equity. Κάντε αίτηση απευθείας από το προφίλ σας.",
  "Trust & safety": "Εμπιστοσύνη & ασφάλεια",
  "Verified profiles, moderation tools, and privacy controls to keep the community quality high.": "Επαληθευμένα προφίλ, εργαλεία εποπτείας και έλεγχοι απορρήτου για μια ποιοτική κοινότητα.",
  "Founder": "Ιδρυτής",
  "Mentor": "Μέντορας",
  "Investor": "Επενδυτής",
  "Accelerator": "Επιταχυντής",
  "Find your co-founder": "Βρείτε τον συνιδρυτή σας",
  "Get matched with complementary skill sets": "Αντιστοιχίσεις με συμπληρωματικές δεξιότητες",
  "Showcase traction, vision, and stage": "Δείξτε traction, όραμα και στάδιο",
  "Access mentors and investors in one place": "Μέντορες και επενδυτές σε ένα σημείο",
  "Scale your impact": "Πολλαπλασιάστε τον αντίκτυπό σας",
  "Set availability and get booked instantly": "Ορίστε διαθεσιμότητα και δεχτείτε κρατήσεις αμέσως",
  "Help vetted founders with real challenges": "Βοηθήστε ελεγμένους ιδρυτές σε πραγματικές προκλήσεις",
  "Build your advisory portfolio": "Χτίστε το συμβουλευτικό σας portfolio",
  "Source deals smarter": "Βρείτε ευκαιρίες πιο έξυπνα",
  "Filter by stage, sector, and geography": "Φίλτρα ανά στάδιο, κλάδο και γεωγραφία",
  "See warm intros through shared connections": "Γνωριμίες μέσα από κοινές επαφές",
  "Track founders you're following": "Παρακολουθήστε τους ιδρυτές που σας ενδιαφέρουν",
  "Run your cohort": "Τρέξτε την κοορτή σας",
  "Organize events and office hours at scale": "Οργανώστε εκδηλώσεις και office hours σε κλίμακα",
  "Connect portfolio founders with mentors": "Συνδέστε τους ιδρυτές του portfolio με μέντορες",
  "Manage your community in one workspace": "Διαχειριστείτε την κοινότητά σας σε έναν χώρο",
  "Build your profile": "Φτιάξτε το προφίλ σας",
  "Complete your guided onboarding. Define your role, expertise, startup stage, work style, and what you're looking for in a co-founder or collaborator.": "Ολοκληρώστε την καθοδηγούμενη ένταξη. Ορίστε ρόλο, εξειδίκευση, στάδιο startup, τρόπο δουλειάς και τι ψάχνετε σε συνιδρυτή ή συνεργάτη.",
  "Get matched intelligently": "Έξυπνες αντιστοιχίσεις",
  "Our multi-dimension matching engine scores compatibility across skills, stage, industry, location, values, and goals — with full transparency on why each match appears.": "Η μηχανή αντιστοίχισης βαθμολογεί τη συμβατότητα σε δεξιότητες, στάδιο, κλάδο, τοποθεσία, αξίες και στόχους — και εξηγεί γιατί εμφανίζεται κάθε αντιστοίχιση.",
  "Start building together": "Ξεκινήστε να χτίζετε μαζί",
  "Send a connection request, open a private conversation, set shared milestones, and access mentors, investors, and communities — all in one workspace.": "Στείλτε αίτημα σύνδεσης, ανοίξτε ιδιωτική συνομιλία, ορίστε κοινά ορόσημα και βρείτε μέντορες, επενδυτές και κοινότητες — όλα σε έναν χώρο.",
  "Active members": "Ενεργά μέλη",
  "Connections made": "Συνδέσεις",
  "Events hosted": "Εκδηλώσεις",
  "Registered Members": "Εγγεγραμμένα μέλη",
  "founders, mentors & investors": "ιδρυτές, μέντορες & επενδυτές",
  "Successful Connections": "Επιτυχημένες συνδέσεις",
  "meaningful introductions made": "ουσιαστικές γνωριμίες",
  "Mentors Available": "Διαθέσιμοι μέντορες",
  "across 40+ industries": "σε 40+ κλάδους",
  "Profile Match Accuracy": "Ακρίβεια αντιστοίχισης",
  "reported by users": "όπως αναφέρουν οι χρήστες",
  "Events Hosted": "Εκδηλώσεις",
  "online & in-person": "διαδικτυακές & δια ζώσης",
  "Partner Organizations": "Συνεργαζόμενοι οργανισμοί",
  "incubators & accelerators": "θερμοκοιτίδες & επιταχυντές",
  "Co-founder Match": "Αντιστοίχιση συνιδρυτή",
  "Mentor Experience": "Εμπειρία μέντορα",
  "Co-founder Seeker": "Αναζήτηση συνιδρυτή",
  "Investor Tools": "Εργαλεία επενδυτή",
  "All-in-one Platform": "Όλα σε μία πλατφόρμα",
  "Free": "Δωρεάν",
  "Organization": "Οργανισμοί",
  "forever": "για πάντα",
  "per month": "τον μήνα",
  "per cohort/year": "ανά κοορτή/έτος",
  "Most popular": "Πιο δημοφιλές",
  "Custom": "Κατά περίπτωση",
  "Everything you need to get started and explore the ecosystem.": "Ό,τι χρειάζεστε για να ξεκινήσετε και να εξερευνήσετε το οικοσύστημα.",
  "Full profile with skills & preferences": "Πλήρες προφίλ με δεξιότητες & προτιμήσεις",
  "Up to 10 connection requests/month": "Έως 10 αιτήματα σύνδεσης/μήνα",
  "Access to mentor directory": "Πρόσβαση στον κατάλογο μεντόρων",
  "Join up to 3 communities": "Συμμετοχή σε έως 3 κοινότητες",
  "Basic match discovery": "Βασική ανακάλυψη αντιστοιχίσεων",
  "Milestone tracker (5 milestones)": "Παρακολούθηση ορόσημων (5 ορόσημα)",
  "Start for free": "Ξεκινήστε δωρεάν",
  "For founders and co-founders actively building their startup team.": "Για ιδρυτές και συνιδρυτές που χτίζουν ενεργά την ομάδα τους.",
  "Unlimited connection requests": "Απεριόριστα αιτήματα σύνδεσης",
  "Priority match placement": "Προτεραιότητα στις αντιστοιχίσεις",
  "Full fundraising toolkit": "Πλήρη εργαλεία χρηματοδότησης",
  "Unlimited communities & milestones": "Απεριόριστες κοινότητες & ορόσημα",
  "Startup Builder & Pitch Deck tool": "Startup Builder & εργαλείο pitch deck",
  "Direct messaging with read receipts": "Μηνύματα με επιβεβαίωση ανάγνωσης",
  "Analytics dashboard": "Πίνακας αναλυτικών",
  "AI Assistant (50 requests/month)": "Βοηθός AI (50 αιτήματα/μήνα)",
  "Start Pro trial": "Δοκιμή Pro",
  "For incubators, accelerators, universities, and innovation hubs.": "Για θερμοκοιτίδες, επιταχυντές, πανεπιστήμια και κόμβους καινοτομίας.",
  "Branded tenant workspace": "Χώρος με την ταυτότητά σας",
  "Program & cohort management": "Διαχείριση προγραμμάτων & κοορτών",
  "Mentor pool with scheduling": "Δεξαμενή μεντόρων με προγραμματισμό",
  "Event management at scale": "Διαχείριση εκδηλώσεων σε κλίμακα",
  "Advanced analytics & reporting": "Προχωρημένα αναλυτικά & αναφορές",
  "SSO & domain mapping": "SSO & αντιστοίχιση τομέων",
  "API access & webhooks": "Πρόσβαση API & webhooks",
  "Dedicated success manager": "Αποκλειστικός υπεύθυνος επιτυχίας",
  "Contact us": "Επικοινωνία",
  "Features": "Δυνατότητες",
  "How it works": "Πώς λειτουργεί",
  "Pricing": "Τιμές",
  "Discover": "Ανακάλυψη",
  "Events": "Εκδηλώσεις",
  "Find a Mentor": "Βρείτε μέντορα",
  "Communities": "Κοινότητες",
  "Startup Jobs": "Θέσεις σε startups",
  "Service Marketplace": "Αγορά υπηρεσιών",
  "Learning Hub": "Κέντρο μάθησης",
  "About us": "Σχετικά με εμάς",
  "Blog": "Blog",
  "Contact": "Επικοινωνία",
  "Privacy Policy": "Πολιτική απορρήτου",
  "Terms of Service": "Όροι χρήσης",
};

function L({ en, wrap }: { en: string; wrap?: boolean }) {
  return <BilingualText en={en} el={LANDING_EL[en]} compact={!wrap} wrap={wrap} />;
}

export function LandingHome() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingTop: 'calc(var(--banner-network, 0px) + var(--banner-demo, 0px))' }}
    >
      <LandingNav />
      <MainLandmark>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-[52px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute inset-0 bg-hero-radial opacity-60" />
        </div>
        <div className="relative mx-auto w-full px-6 py-24 text-center sm:px-8 lg:px-12 xl:px-16">
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-4 py-1.5 text-sm text-primary-accessible">
              <Sparkles className="icon-sm" />
              <BilingualText en="The startup ecosystem, connected" el="Το οικοσύστημα startups, συνδεδεμένο" compact />
            </span>
          </div>

          <h1
            className="animate-fade-in font-display text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '100ms' }}
          >
            Find your{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              co-founder,
            </span>
            <br />
            mentor, or{' '}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              investor
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-3xl animate-fade-in text-lg text-muted-foreground md:text-xl"
            style={{ animationDelay: '200ms' }}
          >
            CoFounderBay connects founders, mentors, investors, and accelerators through smart
            matching, real-time messaging, and curated events. No noise — just quality connections.
          </p>

          <div
            className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: '300ms' }}
          >
            <Button size="lg" className="gap-2 px-8 py-6 text-base" asChild>
              <Link href="/register">
                <BilingualText en="Get started free" el="Ξεκινήστε δωρεάν" compact />
                <ArrowRight className="icon-sm" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="px-6 py-6 text-base text-muted-foreground hover:text-foreground" asChild>
              <Link href="/demo">
                <Play className="icon-sm" />
                <BilingualText en="Try Demo" el="Δοκιμάστε το demo" compact />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm">
            <Link href="/discover" className="text-muted-foreground hover:text-foreground hover:underline">
              <BilingualText en="Explore profiles" el="Εξερευνήστε προφίλ" compact />
            </Link>
          </p>

          <LiveStatsStrip />
        </div>
      </section>

      {/* ── Trusted By ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <BilingualText en="Trusted by founders from leading programs" el="Το εμπιστεύονται ιδρυτές από κορυφαία προγράμματα" wrap />
          </p>
          {/* The row was blanket `opacity-60`, which dropped every label and
              wordmark in it below 4.5:1. The recessive feel now comes from a
              muted text colour instead of dimming real content. */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            {TRUSTED_BY.map(({ name, abbr, color }) => (
              <div key={name} className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className={`font-bold text-lg font-display ${color}`}>{abbr}</span>
                <span className="text-sm text-muted-foreground hidden sm:block">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-border px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-14 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="How it works" el="Πώς λειτουργεί" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="From profile to co-founder in 3 steps" el="Από το προφίλ στον συνιδρυτή σε 3 βήματα" wrap />
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              CoFounderBay removes the guesswork from founder matching with structured profiles,
              explainable scores, and end-to-end collaboration tools.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }, index) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center gap-5 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${color} ring-4 ring-background`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground shadow">
                    {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground"><L en={title} /></h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed"><L en={desc} wrap /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── One card, three sentences ─────────────────────────────────────── */}
      <section id="need-cards" className="border-t border-border px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="Need cards" el="Κάρτες ανάγκης" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="One card, three sentences" el="Μία κάρτα, τρεις προτάσεις" wrap />
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              <BilingualText en="What exists, the outcome, who is missing." el="Τι υπάρχει, το αποτέλεσμα, ποιος λείπει." wrap />
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <Card className="animate-fade-in">
              <CardContent className="p-5 sm:p-6">
                <Badge variant="secondary" className="mb-3 text-2xs"><BilingualText en="Example card" el="Ενδεικτική κάρτα" compact /></Badge>
                <NeedCard card={SAMPLE_NEED_CARD} />
              </CardContent>
            </Card>
            <div className="space-y-6">
              <ol className="space-y-4">
                {CARD_STEPS.map(({ icon: Icon, en, el, noteEn, noteEl }, index) => (
                  <li key={en} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-accessible">
                      <Icon className="icon-sm" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        <span className="tabular-nums text-muted-foreground">{index + 1}. </span>
                        <BilingualText en={en} el={el} compact wrap />
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground"><BilingualText en={noteEn} el={noteEl} wrap /></p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-sm font-medium text-foreground">
                <BilingualText en="The agreement is the threshold, not the ceiling." el="Η συμφωνία είναι το κατώφλι, όχι το ταβάνι." wrap />
              </p>
              <ul className="flex flex-wrap gap-1.5" aria-label="What continues inside">
                {AFTER_AGREEMENT.map(({ en, el }) => (
                  <li key={en} className="rounded-full border border-border px-2.5 py-1 text-2xs text-muted-foreground">
                    <BilingualText en={en} el={el} compact />
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/register">
                  <BilingualText en="See how it works" el="Δείτε πώς λειτουργεί" compact />
                  <ArrowRight className="icon-sm" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Personas ───────────────────────────────────────────────────────── */}
      <section id="roles" className="border-t border-border bg-secondary/20 px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="Roles" el="Ρόλοι" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="Built for every role in the ecosystem" el="Φτιαγμένο για κάθε ρόλο του οικοσυστήματος" wrap />
            </h2>
            <p className="mt-3 text-muted-foreground">
              <BilingualText en="Whether you&apos;re building, advising, investing, or supporting, CoFounderBay works for you." el="Είτε χτίζετε, είτε συμβουλεύετε, επενδύετε ή υποστηρίζετε, το CoFounderBay δουλεύει για εσάς." wrap />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map(({ icon: Icon, role, color, bg, headline, bullets }, index) => (
              <div
                key={role}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Card className={`h-full border ${bg} card-interactive hover-lift`}>
                  <CardHeader className="pb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`icon-md ${color}`} />
                    </div>
                    <Badge variant="outline" className={`mt-2 w-fit border-current text-xs ${color}`}>
                      <L en={role} />
                    </Badge>
                    <CardTitle className="text-base"><L en={headline} /></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className={`mt-0.5 icon-sm shrink-0 ${color}`} />
                        <L en={bullet} wrap />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-border px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="Platform" el="Πλατφόρμα" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="Everything your startup network needs" el="Ό,τι χρειάζεται το δίκτυο της startup σας" wrap />
            </h2>
            <p className="mt-3 text-muted-foreground">
              <BilingualText en="One platform. No scattered tools. From introductions to signed term sheets." el="Μία πλατφόρμα. Χωρίς σκόρπια εργαλεία. Από τις γνωριμίες ως τα υπογεγραμμένα term sheets." wrap />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className="group flex animate-fade-in gap-4 rounded-2xl border border-border bg-card/70 p-5 transition-all duration-300 hover:border-primary/30"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="icon-md text-primary-accessible" />
                </div>
                {/* min-w-0 and a wrapping title: four cards a row leave too little width for both languages on one line. */}
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground"><L en={title} wrap /></h3>
                  <p className="mt-1 text-sm text-muted-foreground"><L en={desc} wrap /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Statistics ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-primary/[0.03] px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="By the numbers" el="Σε αριθμούς" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="A thriving ecosystem" el="Ένα ζωντανό οικοσύστημα" compact />
            </h2>
            <p className="mt-3 text-muted-foreground">
              <BilingualText en="Real impact, real connections, real outcomes — across the global startup community." el="Πραγματικός αντίκτυπος, πραγματικές συνδέσεις, πραγματικά αποτελέσματα — σε όλη την κοινότητα startups." wrap />
            </p>
          </div>
          <LiveStatsGrid />
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="border-t border-border px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="Testimonials" el="Μαρτυρίες" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="Loved by founders, mentors & investors" el="Αγαπημένο από ιδρυτές, μέντορες & επενδυτές" wrap />
            </h2>
            <p className="mt-3 text-muted-foreground">
              <BilingualText en="What founders, mentors and investors use CoFounderBay for." el="Για τι χρησιμοποιούν το CoFounderBay ιδρυτές, μέντορες και επενδυτές." wrap />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TESTIMONIALS.map(({ name, role, company, avatar, quote, rating, tag }, index) => (
              <div
                key={name}
                className="animate-fade-in flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-6 transition-all duration-300 hover:border-primary/20"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="icon-sm fill-status-warning text-status-warning" />
                    ))}
                  </div>
                  <Badge variant="secondary" className="text-xs"><L en={tag} /></Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-accessible">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role} · {company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-border bg-secondary/20 px-6 py-20 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary-accessible border-primary/30"><BilingualText en="Pricing" el="Τιμές" compact /></Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              <BilingualText en="Simple, transparent pricing" el="Απλές, διαφανείς τιμές" compact />
            </h2>
            <p className="mt-3 text-muted-foreground">
              <BilingualText en="Start free. Upgrade when you need more firepower. No hidden fees." el="Ξεκινήστε δωρεάν. Αναβαθμίστε όταν χρειαστείτε περισσότερα. Χωρίς κρυφές χρεώσεις." wrap />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING_PLANS.map(({ name, price, period, highlight, badge, desc, features, cta, href }, index) => (
              <div
                key={name}
                className={`animate-fade-in relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  highlight
                    ? 'border-primary/60 bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]'
                    : 'border-border bg-card/80 hover:border-primary/20'
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-sm">
                    <L en={badge} />
                  </Badge>
                )}
                <div className="mb-5">
                  <h3 className="font-semibold text-lg text-foreground"><L en={name} /></h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-foreground">{price === 'Custom' ? <L en="Custom" /> : price}</span>
                    <span className="text-sm text-muted-foreground">/<L en={period} /></span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground"><L en={desc} wrap /></p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 icon-sm shrink-0 text-status-success" />
                      <L en={f} wrap />
                    </li>
                  ))}
                </ul>
                <Button variant={highlight ? 'default' : 'outline'} className="w-full" asChild>
                  <Link href={href}>
                    <L en={cta} />
                    {highlight && <ArrowRight className="ml-1.5 icon-sm" />}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <BilingualText en="All plans include a 14-day free trial of Pro features. No credit card required." el="Όλα τα πλάνα περιλαμβάνουν δωρεάν δοκιμή 14 ημερών των δυνατοτήτων Pro. Χωρίς πιστωτική κάρτα." wrap />
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section id="cta" className="border-t border-border px-6 py-24 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-3xl text-center animate-fade-in">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Network className="h-7 w-7 text-primary-accessible" />
            </div>
          </div>
          <h2 className="font-display text-4xl font-semibold text-foreground">
            <BilingualText en="Ready to find your people?" el="Έτοιμοι να βρείτε τους ανθρώπους σας;" compact wrap />
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of founders, mentors, and investors already building meaningful
            connections on CoFounderBay. Free to start, no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-10 py-6 text-base shadow-lg shadow-primary/25" asChild>
              <Link href="/register">
                <BilingualText en="Create free account" el="Δημιουργία δωρεάν λογαριασμού" compact />
                <ArrowRight className="icon-sm" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 px-8 py-6 text-base" asChild>
              <Link href="/discover">
                <Users className="icon-sm" />
                <BilingualText en="Browse profiles" el="Περιήγηση προφίλ" compact />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-accessible hover:underline font-medium"><BilingualText en="Sign in" el="Σύνδεση" compact /></Link>
          </p>
        </div>
      </section>

      </MainLandmark>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-secondary/10 px-6 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 mb-10">
            <div className="lg:col-span-2 space-y-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The startup ecosystem platform connecting founders, mentors, investors,
                and accelerators through intelligent matching and real-time collaboration.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="CoFounderBay on Twitter"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Twitter className="icon-sm" aria-hidden="true" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="CoFounderBay on LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Linkedin className="icon-sm" aria-hidden="true" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="CoFounderBay on GitHub"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Github className="icon-sm" aria-hidden="true" />
                </a>
                <a href="https://globe.app" target="_blank" rel="noreferrer" aria-label="The CoFounderBay website"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Globe className="icon-sm" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground"><BilingualText en="Product" el="Προϊόν" compact /></h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '#features',    label: 'Features' },
                  { href: '#how-it-works',label: 'How it works' },
                  { href: '#pricing',     label: 'Pricing' },
                  { href: '/discover',    label: 'Discover' },
                  { href: '/events',      label: 'Events' },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      <L en={label} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground"><BilingualText en="Community" el="Κοινότητα" compact /></h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '/mentoring',   label: 'Find a Mentor' },
                  { href: '/groups',      label: 'Communities' },
                  { href: '/jobs',        label: 'Startup Jobs' },
                  { href: '/marketplace', label: 'Service Marketplace' },
                  { href: '/learning',    label: 'Learning Hub' },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      <L en={label} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground"><BilingualText en="Company" el="Εταιρεία" compact /></h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '/about',   label: 'About us' },
                  { href: '/blog',    label: 'Blog' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms',   label: 'Terms of Service' },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      <L en={label} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} CoFounderBay. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="icon-sm text-primary-accessible" />
              <BilingualText en="Built for founders, by founders" el="Από ιδρυτές, για ιδρυτές" compact />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
