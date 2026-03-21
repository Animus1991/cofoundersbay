'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle, ArrowLeft, Search, ChevronDown, ChevronRight,
  User, Users, MessageCircle, Shield, CreditCard, Settings,
  Compass, GraduationCap, Briefcase, Mail, ExternalLink,
  BookOpen, Zap, Heart, Flag, Bell, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  faqs: FAQItem[];
};

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    description: 'New to CoFounderBay? Start here.',
    faqs: [
      {
        question: 'What is CoFounderBay?',
        answer: 'CoFounderBay is a platform designed to help entrepreneurs find co-founders, mentors, and collaborators. We use AI-powered matching to connect you with people who complement your skills and share your vision.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click "Get Started" on the homepage and follow the registration process. You can sign up with email or use social login (Google, LinkedIn, GitHub). After registration, complete your profile to start getting matched.',
      },
      {
        question: 'Is CoFounderBay free to use?',
        answer: 'CoFounderBay offers a free tier with core features including profile creation, basic matching, and messaging. Premium features like advanced analytics, priority matching, and unlimited connections are available with paid plans.',
      },
      {
        question: 'How does the matching algorithm work?',
        answer: 'Our AI analyzes your profile, skills, experience, goals, and preferences to find compatible matches. We consider factors like complementary skills, shared values, work style compatibility, and startup stage alignment.',
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile & Account',
    icon: User,
    description: 'Managing your profile and settings.',
    faqs: [
      {
        question: 'How do I complete my profile?',
        answer: 'Go to Profile > Edit Profile to add your bio, skills, experience, and preferences. A complete profile significantly improves your match quality. Aim for at least 80% completion for best results.',
      },
      {
        question: 'Can I have multiple roles (founder, mentor, investor)?',
        answer: 'Yes! You can indicate multiple roles in your profile. This helps us show you relevant opportunities and connections for each role you play in the ecosystem.',
      },
      {
        question: 'How do I change my email or password?',
        answer: 'Go to Settings > Account to update your email address or change your password. For security, you\'ll need to verify your current password before making changes.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. This action is permanent and will remove all your data. You can also request data export before deletion to keep a copy of your information.',
      },
    ],
  },
  {
    id: 'matching',
    title: 'Matching & Connections',
    icon: Heart,
    description: 'Finding and connecting with others.',
    faqs: [
      {
        question: 'How do I find potential co-founders?',
        answer: 'Use the Discover page to browse profiles, or check your Matches page for AI-recommended connections. You can filter by role, skills, location, and startup stage to find the right people.',
      },
      {
        question: 'What does the compatibility score mean?',
        answer: 'The compatibility score (0-100%) indicates how well you might work together based on complementary skills, shared values, and aligned goals. Higher scores suggest stronger potential partnerships.',
      },
      {
        question: 'How do I send a connection request?',
        answer: 'Click "Connect" on any profile to send a request. Include a personalized message explaining why you\'d like to connect. The other person can accept or decline your request.',
      },
      {
        question: 'Can I save profiles to review later?',
        answer: 'Yes! Use the Shortlist feature to save interesting profiles. Click the bookmark icon on any profile to add it to your shortlist for easy access later.',
      },
    ],
  },
  {
    id: 'messaging',
    title: 'Messaging',
    icon: MessageCircle,
    description: 'Communicating with connections.',
    faqs: [
      {
        question: 'How do I message someone?',
        answer: 'You can message anyone you\'re connected with. Go to Messages or click the message icon on their profile. For non-connections, send a connection request first.',
      },
      {
        question: 'Can I send attachments in messages?',
        answer: 'Yes, you can attach files, images, and documents to your messages. Click the attachment icon in the message composer to upload files.',
      },
      {
        question: 'How do I know if someone read my message?',
        answer: 'Read receipts show when your message has been delivered and read. Look for the checkmark icons next to your messages.',
      },
      {
        question: 'Can I block or report someone?',
        answer: 'Yes. Click the menu icon in any conversation to report or block a user. Blocked users cannot message you or see your profile. Reports are reviewed by our moderation team.',
      },
    ],
  },
  {
    id: 'mentoring',
    title: 'Mentoring',
    icon: GraduationCap,
    description: 'Finding and working with mentors.',
    faqs: [
      {
        question: 'How do I find a mentor?',
        answer: 'Visit the Mentoring page to browse available mentors. Filter by expertise, industry, and availability. View their profiles to learn about their background and book a session.',
      },
      {
        question: 'How do I become a mentor?',
        answer: 'Update your profile to indicate you\'re available for mentoring. Set your expertise areas, availability, and optionally your hourly rate. Mentees can then discover and book sessions with you.',
      },
      {
        question: 'How do mentoring sessions work?',
        answer: 'After booking, you\'ll receive a confirmation with session details. Sessions can be conducted via video call (we integrate with popular tools) or in-person. Take notes during sessions to track progress.',
      },
      {
        question: 'Can I cancel or reschedule a session?',
        answer: 'Yes, you can cancel or reschedule sessions from the Mentoring page. Please provide at least 24 hours notice when possible to respect everyone\'s time.',
      },
    ],
  },
  {
    id: 'communities',
    title: 'Communities & Groups',
    icon: Users,
    description: 'Joining and participating in groups.',
    faqs: [
      {
        question: 'How do I join a community?',
        answer: 'Browse communities on the Groups page. Click "Join" on any public community. Some communities require approval from admins before you can join.',
      },
      {
        question: 'Can I create my own community?',
        answer: 'Yes! Click "Create Group" on the Groups page. Set up your community with a name, description, and privacy settings. Invite members and start discussions.',
      },
      {
        question: 'How do community discussions work?',
        answer: 'Communities have discussion threads where members can post topics, share updates, and engage with each other. You can also create polls and share resources.',
      },
      {
        question: 'What are community events?',
        answer: 'Community admins can create events for members. These can be virtual meetups, workshops, or in-person gatherings. RSVP to events to get reminders and updates.',
      },
    ],
  },
  {
    id: 'milestones',
    title: 'Milestones & Progress',
    icon: Flag,
    description: 'Tracking your startup journey.',
    faqs: [
      {
        question: 'What are milestones?',
        answer: 'Milestones help you track important goals and achievements in your startup journey. Create milestones for product launches, funding rounds, team growth, and other key events.',
      },
      {
        question: 'How do I create a milestone?',
        answer: 'Go to the Milestones page and click "New Milestone". Add a title, description, due date, and category. You can also assign collaborators and set priority levels.',
      },
      {
        question: 'Can I share milestones with my team?',
        answer: 'Yes! Add collaborators to milestones to share progress. Collaborators can update status, add notes, and track progress together.',
      },
      {
        question: 'How do milestone notifications work?',
        answer: 'You\'ll receive notifications for upcoming deadlines, status changes, and collaborator updates. Customize notification preferences in Settings.',
      },
    ],
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    icon: Shield,
    description: 'Keeping your account safe.',
    faqs: [
      {
        question: 'Who can see my profile?',
        answer: 'By default, your profile is visible to other CoFounderBay members. You can adjust visibility settings in Settings > Privacy to control what information is shown.',
      },
      {
        question: 'How is my data protected?',
        answer: 'We use industry-standard encryption for data in transit and at rest. We never sell your personal information. See our Privacy Policy for full details.',
      },
      {
        question: 'Can I enable two-factor authentication?',
        answer: 'Yes! Go to Settings > Security to enable 2FA. We support authenticator apps and SMS verification for added account security.',
      },
      {
        question: 'How do I report a security issue?',
        answer: 'Email security@cofounderbay.com with details of any security concerns. We take all reports seriously and will respond promptly.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Subscriptions',
    icon: CreditCard,
    description: 'Managing your subscription.',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay via invoice.',
      },
      {
        question: 'How do I upgrade my plan?',
        answer: 'Go to Settings > Billing to view available plans and upgrade. Your new features will be available immediately after payment.',
      },
      {
        question: 'Can I cancel my subscription?',
        answer: 'Yes, you can cancel anytime from Settings > Billing. You\'ll retain access to premium features until the end of your billing period.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer a 14-day money-back guarantee for new subscriptions. Contact support@cofounderbay.com for refund requests.',
      },
    ],
  },
];

function FAQAccordion({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left hover:text-primary transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 pr-8">
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());

  const toggleFAQ = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`;
    setOpenFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredCategories = faqCategories.map((category) => ({
    ...category,
    faqs: category.faqs.filter(
      (faq) =>
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.faqs.length > 0);

  const displayCategories = selectedCategory
    ? filteredCategories.filter((c) => c.id === selectedCategory)
    : filteredCategories;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to CoFounderBay</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/terms">
              <Button variant="ghost" size="sm" className="text-xs">Terms</Button>
            </Link>
            <Link href="/privacy">
              <Button variant="ghost" size="sm" className="text-xs">Privacy</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
          <p className="text-muted-foreground mb-6">Find answers to common questions and learn how to use CoFounderBay</p>
          
          {/* Search */}
          <div className="mx-auto max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs"
            >
              All Topics
            </Button>
            {faqCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs gap-1.5"
              >
                <category.icon className="h-3 w-3" />
                {category.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        {displayCategories.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No results found</h2>
            <p className="text-sm text-muted-foreground mb-4">Try a different search term or browse all topics</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {displayCategories.map((category) => (
              <Card key={category.id} className="border-border/60">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-border/60">
                    {category.faqs.map((faq, index) => (
                      <FAQAccordion
                        key={index}
                        faq={faq}
                        isOpen={openFAQs.has(`${category.id}-${index}`)}
                        onToggle={() => toggleFAQ(category.id, index)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 rounded-xl border border-border/60 bg-muted/30 p-8 text-center">
          <Mail className="mx-auto h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Still need help?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:support@cofounderbay.com">
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
            </a>
            <Link href="/messages">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link href="/terms" className="group">
            <Card className="h-full border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <h3 className="font-medium text-foreground mb-1">Terms of Service</h3>
                <p className="text-xs text-muted-foreground">Read our terms and conditions</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/privacy" className="group">
            <Card className="h-full border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 text-center">
                <Shield className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <h3 className="font-medium text-foreground mb-1">Privacy Policy</h3>
                <p className="text-xs text-muted-foreground">Learn how we protect your data</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/settings" className="group">
            <Card className="h-full border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 text-center">
                <Settings className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <h3 className="font-medium text-foreground mb-1">Account Settings</h3>
                <p className="text-xs text-muted-foreground">Manage your preferences</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CoFounderBay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
