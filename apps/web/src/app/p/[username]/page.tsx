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
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import { getPublicProfile, getEndorsementsForUser, type PublicProfile, type EndorsementItem } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { BilingualText } from '@/components/common/BilingualText';
import { MainLandmark } from '@/components/layout/AppShell';

function deriveProfileFields(profile: PublicProfile) {
  const rp = (profile.rolePayload ?? {}) as Record<string, unknown>;
  const nameParts = (profile.displayName ?? '').trim().split(' ');
  const firstName = nameParts[0] ?? 'User';
  const lastName = nameParts.slice(1).join(' ') || '';
  const skills = (profile.skills ?? []).map((s) => s.skillName ?? s.skillId);
  const interests = (rp.interests as string[] | undefined) ?? [];
  const experience = (rp.experience as Array<{ title: string; company: string; period: string; description?: string }> | undefined) ?? [];
  const education = (rp.education as Array<{ degree: string; school: string; year?: string }> | undefined) ?? [];
  const achievements = (rp.achievements as string[] | undefined) ?? [];
  const connectionsCount = rp.connectionsCount as number | undefined;
  const projectsCount = rp.projectsCount as number | undefined;
  const lookingFor = (rp.lookingFor as string[] | undefined) ?? [];
  const isVerified = Boolean(rp.isVerified ?? rp.verified);
  const isAvailable = Boolean(rp.isAvailable ?? rp.available ?? rp.openToOpportunities);
  const website = (rp.website ?? rp.websiteUrl) as string | undefined;
  const linkedin = (rp.linkedin ?? rp.linkedinUrl) as string | undefined;
  const twitter = (rp.twitter ?? rp.twitterUrl) as string | undefined;
  const github = (rp.github ?? rp.githubUrl) as string | undefined;
  const joinedAt = new Date(profile.createdAt);
  return { firstName, lastName, skills, interests, experience, education, achievements, lookingFor, isVerified, isAvailable, website, linkedin, twitter, github, joinedAt, connectionsCount, projectsCount };
}

function EndorsementCard({ endorsement }: { endorsement: EndorsementItem }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-muted-foreground italic">"{endorsement.content}"</p>
      {endorsement.skill && (
        <Badge variant="secondary" className="mt-2 text-xs">
          {endorsement.skill}
        </Badge>
      )}
      <div className="flex items-center gap-3 mt-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={endorsement.fromUser?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm">
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
        <div key={i} className="rounded-lg border border-border p-4">
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

function ProfilePageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardContent className="pt-6"><div className="flex gap-6"><Skeleton className="h-28 w-28 rounded-full shrink-0" /><div className="flex-1 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /><Skeleton className="h-4 w-32" /></div></div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><div className="flex flex-wrap gap-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}</div></CardContent></Card>
        </div>
        <div className="space-y-4">
          <Card><CardContent className="pt-6"><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="text-center"><Skeleton className="h-8 w-12 mx-auto mb-1" /><Skeleton className="h-3 w-16 mx-auto" /></div>)}</div></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-20" /></CardHeader><CardContent><div className="flex flex-wrap gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}</div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: qk('public-profile', username),
    queryFn: () => getPublicProfile(username),
    staleTime: 60_000,
    retry: 1,
    enabled: !!username,
  });

  const derived = profile ? deriveProfileFields(profile) : null;

  const { data: endorsementsData, isLoading: endorsementsLoading } = useQuery({
    queryKey: qk('endorsements', profile?.userId),
    queryFn: () => getEndorsementsForUser(profile!.userId),
    enabled: !!profile?.userId,
    staleTime: 60_000,
  });

  const endorsements = endorsementsData?.endorsements ?? [];

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" aria-label="CoFounderBay home">
              <Logo size="sm" />
            </Link>
          </div>
        </header>
        <ProfilePageSkeleton />
      </div>
    );
  }

  if (isError || !profile || !derived) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Users className="icon-xl text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground"><BilingualText en="Profile not found" el="Το προφίλ δεν βρέθηκε" compact /></h2>
          <p className="text-muted-foreground"><BilingualText en="This profile doesn&apos;t exist or may have been removed." el="Αυτό το προφίλ δεν υπάρχει ή έχει αφαιρεθεί." wrap /></p>
          <Button variant="outline" asChild>
            <Link href="/discover"><BilingualText en="Browse Profiles" el="Περιήγηση προφίλ" compact /></Link>
          </Button>
        </div>
      </div>
    );
  }

  const { firstName, lastName, skills, interests, experience, education, achievements, lookingFor, isVerified, isAvailable, website, linkedin, twitter, github, joinedAt } = derived;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="CoFounderBay home">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login"><BilingualText en="Sign In" el="Σύνδεση" compact /></Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register"><BilingualText en="Join Free" el="Εγγραφή δωρεάν" compact /></Link>
            </Button>
          </div>
        </div>
      </header>

      <MainLandmark className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-20 w-20 shrink-0">
                    <AvatarImage src={profile.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary-accessible">
                      {firstName[0]}{lastName[0] || firstName[1] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl xl:text-3xl font-semibold text-foreground">
                          {firstName} {lastName}
                        </h1>
                        {isVerified && (
                          <CheckCircle2 className="icon-md text-primary-accessible" />
                        )}
                        <RoleBadge role={profile.role} />
                      </div>
                      <p className="text-muted-foreground mt-1">{profile.headline ?? ''}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {profile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="icon-sm" />
                          {profile.location}
                        </span>
                      )}
                      {profile.timezone && (
                        <span className="flex items-center gap-1">
                          <Clock className="icon-sm" />
                          {profile.timezone}
                        </span>
                      )}
                      {profile.role && (
                        <span className="flex items-center gap-1 capitalize">
                          <Briefcase className="icon-sm" />
                          {profile.role}
                        </span>
                      )}
                    </div>

                    {isAvailable && (
                      <Badge className="bg-status-success-bg text-status-success border-status-success-border">
                        <Zap className="icon-sm mr-1" />
                        <BilingualText en="Open to Opportunities" el="Ανοιχτός/ή σε ευκαιρίες" compact />
                      </Badge>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button className="gap-2" asChild>
                        <Link href={`/register?action=message&user=${username}`}>
                          <MessageSquare className="icon-sm" />
                          <BilingualText en="Message" el="Μήνυμα" compact />
                        </Link>
                      </Button>
                      <Button variant="outline" className="gap-2" asChild>
                        <Link href={`/register?action=connect&user=${username}`}>
                          <UserPlus className="icon-sm" />
                          <BilingualText en="Connect" el="Σύνδεση" compact />
                        </Link>
                      </Button>
                      {/* Had no handler. */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Share profile"
                        onClick={() => {
                          const url = window.location.href;
                          if (navigator.share) void navigator.share({ url }).catch(() => {});
                          else void navigator.clipboard?.writeText(url);
                        }}
                      >
                        <Share2 className="icon-sm" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base"><BilingualText en="About" el="Σχετικά" compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {(profile.bio ?? '').split('\n\n').map((p, i) => (
                    <p key={i} className="text-muted-foreground">{p}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Looking For */}
            {lookingFor.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="icon-md text-primary-accessible" />
                    <BilingualText en="Looking For" el="Αναζητά" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {lookingFor.map((role) => (
                      <Badge key={role} variant="outline" className="bg-primary/5 border-primary/15 text-primary-accessible">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="icon-md" />
                  <BilingualText en="Experience" el="Εμπειρία" compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {experience.map((exp, i) => (
                  <div key={i} className={cn(i > 0 && 'pt-6 border-t border-border')}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Briefcase className="icon-md text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>
                        {exp.description && <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            )}

            {/* Education */}
            {education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="icon-md" />
                  <BilingualText en="Education" el="Εκπαίδευση" compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <GraduationCap className="icon-md text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.school}</p>
                      {edu.year && <p className="text-xs text-muted-foreground">{edu.year}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            )}

            {/* Endorsements / Testimonials */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="icon-md text-status-warning" />
                    <BilingualText en="Endorsements" el="Συστάσεις" compact />
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                    <Link href={`/register?action=endorse&user=${username}`}>
                      <PenLine className="icon-sm" />
                      <BilingualText en="Write Endorsement" el="Γράψτε σύσταση" compact />
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
                    <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      <BilingualText en="No endorsements yet" el="Δεν υπάρχουν συστάσεις ακόμα" compact />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be the first to endorse {firstName}
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
                {/* Label and figure on one row: three centred columns did not
                    fit this sidebar ("ConnectionsProjects" ran together). */}
                <dl className="divide-y divide-border/50 text-sm">
                  {[
                    { label: 'Connections', value: derived?.connectionsCount ?? '—' },
                    { label: 'Projects', value: derived?.projectsCount ?? '—' },
                    { label: 'Endorsements', value: endorsementsLoading ? '—' : endorsements.length },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="font-semibold tabular-nums text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base"><BilingualText en="Skills" el="Δεξιότητες" compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {skills.length === 0 && <p className="text-sm text-muted-foreground"><BilingualText en="No skills listed" el="Δεν έχουν καταχωριστεί δεξιότητες" compact /></p>}
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base"><BilingualText en="Interests" el="Ενδιαφέροντα" compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {interests.length === 0 && <p className="text-sm text-muted-foreground"><BilingualText en="No interests listed" el="Δεν έχουν καταχωριστεί ενδιαφέροντα" compact /></p>}
                  {interests.map((interest) => (
                    <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="icon-md text-status-warning" />
                    <BilingualText en="Achievements" el="Επιτεύγματα" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {achievements.map((achievement, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Award className="icon-sm text-status-warning shrink-0" />
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
                <CardTitle className="text-base"><BilingualText en="Links" el="Σύνδεσμοι" compact /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!website && !linkedin && !twitter && !github && (
                  <p className="text-sm text-muted-foreground"><BilingualText en="No links added" el="Δεν έχουν προστεθεί σύνδεσμοι" compact /></p>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="icon-sm" />
                    <span className="truncate">{website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="icon-sm ml-auto shrink-0" />
                  </a>
                )}
                {linkedin && (
                  <a href={linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="icon-sm" />
                    <span>LinkedIn</span>
                    <ExternalLink className="icon-sm ml-auto shrink-0" />
                  </a>
                )}
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Twitter className="icon-sm" />
                    <span>Twitter / X</span>
                    <ExternalLink className="icon-sm ml-auto shrink-0" />
                  </a>
                )}
                {github && (
                  <a href={github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="icon-sm" />
                    <span>GitHub</span>
                    <ExternalLink className="icon-sm ml-auto shrink-0" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Member Since */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="icon-sm" />
                  <span>Member since {joinedAt.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold text-foreground mb-2">
                  Want to connect with {firstName}?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join CoFounderBay to message and connect with founders like {firstName}.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/register">Join CoFounderBay Free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLandmark>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CoFounderBay. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground transition-colors"><BilingualText en="Terms" el="Όροι" compact /></Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors"><BilingualText en="Privacy" el="Απόρρητο" compact /></Link>
            <Link href="/help" className="hover:text-foreground transition-colors"><BilingualText en="Help" el="Βοήθεια" compact /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
