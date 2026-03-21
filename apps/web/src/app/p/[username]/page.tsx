'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  MapPin, Globe, Linkedin, Twitter, Github, Mail,
  Calendar, Briefcase, GraduationCap, Award, Users,
  MessageSquare, UserPlus, Share2, ExternalLink, Clock,
  CheckCircle2, Star, Zap, Target, PenLine, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getEndorsementsForUser, type EndorsementItem } from '@/lib/api';

const MOCK_PROFILE = {
  id: 'u1',
  username: 'sarahchen',
  firstName: 'Sarah',
  lastName: 'Chen',
  avatar: undefined,
  role: 'founder',
  headline: 'Serial Entrepreneur | AI/ML Expert | Building the Future of Sustainability',
  bio: `I'm a passionate entrepreneur with 10+ years of experience building technology companies. After a successful exit from my previous startup, I'm now focused on using AI to tackle climate change.

Currently looking for a technical co-founder to join me on my next venture in the CleanTech space. If you're excited about using technology to make a real environmental impact, let's connect!

I believe in building diverse, inclusive teams and creating products that genuinely help people and the planet.`,
  location: 'San Francisco, CA',
  timezone: 'PST (UTC-8)',
  website: 'https://sarahchen.com',
  linkedin: 'https://linkedin.com/in/sarahchen',
  twitter: 'https://twitter.com/sarahchen',
  github: 'https://github.com/sarahchen',
  email: 'sarah@example.com',
  isVerified: true,
  isAvailable: true,
  lookingFor: ['Technical Co-founder', 'CTO', 'Lead Engineer'],
  skills: ['Machine Learning', 'Python', 'Product Strategy', 'Fundraising', 'Team Building', 'Go-to-Market', 'B2B Sales'],
  interests: ['AI/ML', 'Climate Tech', 'Sustainability', 'B2B SaaS', 'Impact Investing'],
  experience: [
    {
      title: 'Founder & CEO',
      company: 'EcoTrack (Current)',
      period: '2024 - Present',
      description: 'Building AI-powered carbon footprint tracking for businesses.',
    },
    {
      title: 'Co-founder & CEO',
      company: 'DataFlow (Acquired)',
      period: '2018 - 2023',
      description: 'Built and scaled a data analytics platform to $10M ARR. Acquired by TechCorp.',
    },
    {
      title: 'Product Manager',
      company: 'Google',
      period: '2014 - 2018',
      description: 'Led product development for Google Cloud AI products.',
    },
  ],
  education: [
    {
      degree: 'MBA',
      school: 'Stanford Graduate School of Business',
      year: '2014',
    },
    {
      degree: 'BS Computer Science',
      school: 'MIT',
      year: '2010',
    },
  ],
  achievements: [
    'Forbes 30 Under 30 (2020)',
    'TechCrunch Disrupt Finalist',
    'Y Combinator W18',
  ],
  // testimonials removed - now fetched from API
  stats: {
    connections: 342,
    projects: 3,
    endorsements: 28,
  },
  joinedAt: new Date('2024-01-15'),
};

function EndorsementCard({ endorsement }: { endorsement: EndorsementItem }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <p className="text-muted-foreground italic">"{endorsement.content}"</p>
      {endorsement.skill && (
        <Badge variant="secondary" className="mt-2 text-xs">
          {endorsement.skill}
        </Badge>
      )}
      <div className="flex items-center gap-3 mt-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={endorsement.fromUser.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {endorsement.fromUser.displayName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm text-foreground">{endorsement.fromUser.displayName}</p>
          {endorsement.relationship && (
            <p className="text-xs text-muted-foreground">{endorsement.relationship}</p>
          )}
          {!endorsement.relationship && endorsement.fromUser.headline && (
            <p className="text-xs text-muted-foreground line-clamp-1">{endorsement.fromUser.headline}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EndorsementsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-border/60 p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const profile = MOCK_PROFILE;

  // Fetch real endorsements from API
  // Note: In production, you'd fetch the user by username first to get their ID
  const { data: endorsementsData, isLoading: endorsementsLoading } = useQuery({
    queryKey: ['endorsements', profile.id],
    queryFn: () => getEndorsementsForUser(profile.id),
    staleTime: 60_000,
  });

  const endorsements = endorsementsData?.endorsements ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-semibold text-foreground">CoFounderBay</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Join Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-28 w-28 shrink-0">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-foreground">
                          {profile.firstName} {profile.lastName}
                        </h1>
                        {profile.isVerified && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                        <RoleBadge role={profile.role} />
                      </div>
                      <p className="text-muted-foreground mt-1">{profile.headline}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {profile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {profile.location}
                        </span>
                      )}
                      {profile.timezone && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {profile.timezone}
                        </span>
                      )}
                    </div>

                    {profile.isAvailable && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        <Zap className="h-3 w-3 mr-1" />
                        Open to Opportunities
                      </Badge>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Connect
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {profile.bio.split('\n\n').map((p, i) => (
                    <p key={i} className="text-muted-foreground">{p}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Looking For */}
            {profile.lookingFor.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Looking For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.lookingFor.map((role) => (
                      <Badge key={role} variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.experience.map((exp, i) => (
                  <div key={i} className={cn(i > 0 && 'pt-6 border-t border-border/60')}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>
                        <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.school}</p>
                      <p className="text-xs text-muted-foreground">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Endorsements / Testimonials */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Endorsements
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                    <Link href={`/register?action=endorse&user=${username}`}>
                      <PenLine className="h-3.5 w-3.5" />
                      Write Endorsement
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {endorsementsLoading ? (
                  <EndorsementsSkeleton />
                ) : endorsements.length > 0 ? (
                  <div className="space-y-4">
                    {endorsements.map((endorsement) => (
                      <EndorsementCard key={endorsement.id} endorsement={endorsement} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No endorsements yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be the first to endorse {profile.firstName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{profile.stats.connections}</div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{profile.stats.projects}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {endorsementsLoading ? '—' : endorsements.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Endorsements</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {profile.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {profile.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-muted-foreground">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{profile.website.replace('https://', '')}</span>
                    <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>Twitter</span>
                    <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                    <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Member Since */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {profile.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold text-foreground mb-2">
                  Want to connect with {profile.firstName}?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join CoFounderBay to message and connect with founders like {profile.firstName}.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/register">Join CoFounderBay Free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 mt-12 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CoFounderBay. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
