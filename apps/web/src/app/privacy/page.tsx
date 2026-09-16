'use client';

import Link from 'next/link';
import { Shield, ArrowLeft, Eye, Database, Lock, Globe, UserCheck, Mail, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LAST_UPDATED = 'March 20, 2026';

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    icon: Shield,
    content: `CoFounderBay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

Please read this Privacy Policy carefully. By using CoFounderBay, you consent to the data practices described in this policy. If you do not agree with the terms of this Privacy Policy, please do not access the Platform.`,
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    icon: Database,
    content: `We collect information in several ways:

**Information You Provide:**
• Account information (name, email, password)
• Profile information (bio, skills, experience, location)
• Communication content (messages, posts, comments)
• Payment information (processed by secure third-party providers)
• Feedback and correspondence

**Information Collected Automatically:**
• Device information (browser type, operating system)
• Usage data (pages visited, features used, time spent)
• IP address and approximate location
• Cookies and similar tracking technologies

**Information from Third Parties:**
• Social login providers (Google, LinkedIn, GitHub)
• SSO identity providers (for organization accounts)
• Analytics and advertising partners`,
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    icon: Eye,
    content: `We use collected information to:

• Provide, maintain, and improve the Platform
• Create and manage your account
• Facilitate connections and matches between users
• Send notifications and updates
• Respond to inquiries and provide support
• Analyze usage patterns and optimize performance
• Detect and prevent fraud and abuse
• Comply with legal obligations
• Personalize your experience
• Send marketing communications (with your consent)

We process your data based on legitimate interests, contractual necessity, legal obligations, and your consent where applicable.`,
  },
  {
    id: 'information-sharing',
    title: '4. Information Sharing',
    icon: Globe,
    content: `We may share your information with:

**Other Users:**
• Profile information you choose to make public
• Messages and content you share with other users
• Connection and collaboration information

**Service Providers:**
• Cloud hosting and infrastructure providers
• Analytics and monitoring services
• Payment processors
• Email and communication services
• Customer support tools

**Legal and Safety:**
• To comply with legal obligations
• To protect our rights and property
• To prevent fraud or illegal activity
• In response to lawful requests by authorities

**Business Transfers:**
• In connection with mergers, acquisitions, or asset sales

We do not sell your personal information to third parties.`,
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    icon: Lock,
    content: `We implement appropriate technical and organizational measures to protect your information:

• Encryption of data in transit (TLS/SSL)
• Encryption of sensitive data at rest
• Regular security assessments and audits
• Access controls and authentication
• Employee training on data protection
• Incident response procedures

While we strive to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    id: 'your-rights',
    title: '6. Your Rights',
    icon: UserCheck,
    content: `Depending on your location, you may have the following rights:

**Access:** Request a copy of your personal data
**Correction:** Request correction of inaccurate data
**Deletion:** Request deletion of your data
**Portability:** Receive your data in a portable format
**Restriction:** Request restriction of processing
**Objection:** Object to certain processing activities
**Withdrawal:** Withdraw consent at any time

To exercise these rights, contact us at privacy@cofounderbay.com or use the settings in your account.

We will respond to requests within 30 days or as required by applicable law.`,
  },
  {
    id: 'cookies',
    title: '7. Cookies and Tracking',
    icon: Settings,
    content: `We use cookies and similar technologies to:

• Remember your preferences and settings
• Authenticate your sessions
• Analyze usage and performance
• Provide personalized content

**Types of Cookies:**
• Essential cookies (required for functionality)
• Analytics cookies (help us improve the Platform)
• Preference cookies (remember your choices)

You can manage cookie preferences through your browser settings or our cookie consent tool. Disabling certain cookies may affect Platform functionality.`,
  },
  {
    id: 'data-retention',
    title: '8. Data Retention',
    icon: Database,
    content: `We retain your information for as long as:

• Your account is active
• Necessary to provide our services
• Required by legal obligations
• Needed for legitimate business purposes

When you delete your account:
• Profile information is removed within 30 days
• Messages may be retained for the other party
• Some data may be retained for legal compliance
• Anonymized data may be retained for analytics

You can request data deletion by contacting us or using account settings.`,
  },
  {
    id: 'international',
    title: '9. International Transfers',
    icon: Globe,
    content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place:

• Standard contractual clauses
• Adequacy decisions
• Binding corporate rules where applicable

By using the Platform, you consent to the transfer of your information to countries that may have different data protection laws than your jurisdiction.`,
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    icon: Shield,
    content: `CoFounderBay is not intended for users under 18 years of age. We do not knowingly collect personal information from children.

If we learn that we have collected information from a child under 18, we will take steps to delete that information promptly.

If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    icon: Settings,
    content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.

For significant changes, we will:
• Notify you via email
• Display a prominent notice on the Platform
• Require acknowledgment where appropriate

Your continued use of the Platform after changes constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    icon: Mail,
    content: `If you have questions about this Privacy Policy or our data practices, contact us:

**Email:** privacy@cofounderbay.com
**Data Protection Officer:** dpo@cofounderbay.com

**Mailing Address:**
CoFounderBay Privacy Team
[Address]

We aim to respond to all inquiries within 30 days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="icon-sm" />
            <span className="text-sm font-medium">Back to CoFounderBay</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/terms">Terms of Service</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/help">Help Center</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary-accessible" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Privacy at a Glance</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Database, label: 'Data Collection', desc: 'We collect only what we need' },
              { icon: Lock, label: 'Security', desc: 'Your data is encrypted' },
              { icon: UserCheck, label: 'Your Rights', desc: 'Access, correct, delete' },
              { icon: Trash2, label: 'No Selling', desc: 'We never sell your data' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary-accessible" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <section.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{section.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-12">
          {sections.map((section) => (
            <Card key={section.id} id={section.id} className="scroll-mt-20 border-border/60">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary-accessible" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground pt-1">{section.title}</h2>
                </div>
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                  <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 rounded-xl border border-border/60 bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Your privacy matters to us. If you have any questions, please don't hesitate to reach out.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/terms">Read Terms of Service</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/settings">Manage Privacy Settings</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CoFounderBay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
