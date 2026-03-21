'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Building2, MapPin, Globe, Mail, Calendar, Users,
  Briefcase, GraduationCap, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOrgOpportunities, getOrgCohorts, getOrgMembers, type OrgProfile, type OpportunityItem, type CohortItem, type OrgMember } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { AppShell } from '@/components/layout/AppShell';

interface OrgContentProps {
  org: OrgProfile;
  slug: string;
}

export function OrgContent({ org, slug }: OrgContentProps) {
  const { data: opportunitiesData, isLoading: oppsLoading } = useQuery({
    queryKey: ['org-opportunities', slug],
    queryFn: () => getOrgOpportunities(slug),
  });

  const { data: cohortsData, isLoading: cohortsLoading } = useQuery({
    queryKey: ['org-cohorts', slug],
    queryFn: () => getOrgCohorts(slug),
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', slug],
    queryFn: () => getOrgMembers(slug),
  });

  const opportunities: OpportunityItem[] = opportunitiesData?.opportunities ?? [];
  const cohorts: CohortItem[] = cohortsData?.cohorts ?? [];
  const members: OrgMember[] = membersData?.members ?? [];

  return (
    <AppShell>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-20 w-20 shrink-0 ring-2 ring-border">
              <AvatarImage src={org.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-semibold">
                {org.name?.[0]?.toUpperCase() ?? 'O'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
                {org.tagline && (
                  <p className="text-base text-muted-foreground mt-1">{org.tagline}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {org.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{org.location}</span>
                  </div>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span>{(() => { try { return new URL(org.website).hostname; } catch { return org.website; } })()}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span>{org.email}</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Joined {formatRelativeTime(org.createdAt)}</span>
                </div>
              </div>

              {org.description && (
                <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                  {org.description}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-8 px-4 text-xs font-medium gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Follow
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-4 text-xs font-medium gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Opportunities', value: org._count.opportunities },
            { label: 'Programs', value: org._count.cohorts },
            { label: 'Members', value: org._count.members },
            { label: 'Events', value: org._count.events },
          ].map(({ label, value }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="pt-5 pb-4 text-center">
                <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="h-9">
            <TabsTrigger value="opportunities" className="text-sm gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Opportunities
              {opportunities.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{opportunities.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="programs" className="text-sm gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Programs
              {cohorts.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{cohorts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="members" className="text-sm gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Members
              {members.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{members.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="about" className="text-sm gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Opportunities */}
          <TabsContent value="opportunities" className="space-y-3">
            {oppsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-5">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">No opportunities yet</h3>
                  <p className="text-xs text-muted-foreground">Check back soon.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {opportunities.map((opp) => (
                  <Card key={opp.id} className="group hover:border-border transition-all duration-150">
                    <CardContent className="pt-5 pb-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {opp.title}
                          </h3>
                          <Badge
                            variant={opp.isActive ? 'default' : 'secondary'}
                            className="shrink-0 text-xs h-5"
                          >
                            {opp.isActive ? 'Active' : 'Closed'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {opp.type} {opp.location ? `· ${opp.location}` : ''}
                        </p>
                        {opp.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{opp.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(opp.createdAt)}
                          </span>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-3">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Programs */}
          <TabsContent value="programs" className="space-y-3">
            {cohortsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-5">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : cohorts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">No programs yet</h3>
                  <p className="text-xs text-muted-foreground">Check back soon.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cohorts.map((cohort) => (
                  <Card key={cohort.id} className="group hover:border-border transition-all duration-150">
                    <CardContent className="pt-5 pb-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {cohort.name}
                          </h3>
                          <Badge
                            variant={cohort.isActive ? 'default' : 'secondary'}
                            className="shrink-0 text-xs h-5"
                          >
                            {cohort.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {cohort.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{cohort.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {cohort._count.members} members
                          </span>
                          {cohort.capacity && <span>Cap: {cohort.capacity}</span>}
                          {cohort.startDate && (
                            <span>Starts {new Date(cohort.startDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members */}
          <TabsContent value="members" className="space-y-3">
            {membersLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : members.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">No members yet</h3>
                  <p className="text-xs text-muted-foreground">Members will appear here when they join programs.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <Card key={member.id} className="group hover:border-border transition-all duration-150">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={member.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {member.displayName?.[0]?.toUpperCase() ?? 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <a
                            href={`/profiles/${member.id}`}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {member.displayName}
                          </a>
                          {member.headline && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{member.headline}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {member.cohortName}
                            </Badge>
                            {member.location && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-2.5 w-2.5" />
                                {member.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* About */}
          <TabsContent value="about">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">About {org.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {org.mission && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mission</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">{org.mission}</p>
                  </div>
                )}
                {org.industry && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Industry</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {org.industry.split(',').map((ind: string) => (
                        <Badge key={ind.trim()} variant="secondary" className="text-xs">{ind.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {org.focus && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Focus Areas</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {org.focus.split(',').map((f: string) => (
                        <Badge key={f.trim()} variant="outline" className="text-xs">{f.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {org.size && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Size</h3>
                    <p className="text-sm text-foreground/80">{org.size}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
