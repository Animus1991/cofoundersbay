'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  MessageSquare,
  Heart,
  Share2,
  ChevronRight,
  Star,
  MapPin,
  Building,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AllianceThemePage() {
  const [activeTab, setActiveTab] = useState('discover');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="alliance-hero relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Alliance Theme Preview</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Connect. Collaborate. Succeed.
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join the premier network for startup founders, investors, and innovators
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-status-info hover:bg-status-info-bg">
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, label: '10,000+', desc: 'Active Members' },
              { icon: Briefcase, label: '5,000+', desc: 'Opportunities' },
              { icon: TrendingUp, label: '$2B+', desc: 'Funding Raised' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-100" />
                <div className="text-3xl font-bold mb-1">{stat.label}</div>
                <div className="text-sm text-blue-100">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'discover', label: 'Discover', icon: Sparkles },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
            { id: 'events', label: 'Events', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-muted-foreground hover:bg-muted '
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-foreground hover:bg-white">Featured</Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0 border-4 border-white -mt-12 relative z-10"></div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">Sarah Johnson</h3>
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-status-warning text-yellow-400" />
                          Pro
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">CEO & Founder at TechVentures</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Users className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    Looking for technical co-founder to build next-gen AI platform. 10+ years in SaaS, 2 successful exits.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {['AI/ML', 'SaaS', 'B2B', 'Series A'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      San Francisco, CA
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      Tech Industry
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Trending Topics</h3>
                <div className="space-y-3">
                  {[
                    { tag: '#AIStartups', count: '2.5K posts' },
                    { tag: '#FundingRound', count: '1.8K posts' },
                    { tag: '#TechCofounder', count: '1.2K posts' },
                    { tag: '#StartupLife', count: '980 posts' },
                  ].map((topic) => (
                    <div
                      key={topic.tag}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-status-info ">{topic.tag}</div>
                        <div className="text-xs text-muted-foreground">{topic.count}</div>
                      </div>
                      <TrendingUp className="h-4 w-4 text-status-success" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <CardContent className="p-6">
                <Sparkles className="h-8 w-8 mb-3" />
                <h3 className="font-bold text-lg mb-2">Upgrade to Pro</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Unlock premium features and connect with top founders
                </p>
                <Button className="w-full bg-white text-status-info hover:bg-status-info-bg">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Startup Pitch Night', date: 'Tomorrow, 6 PM' },
                    { title: 'AI Founders Meetup', date: 'Fri, Dec 20' },
                    { title: 'Investor Networking', date: 'Mon, Dec 23' },
                  ].map((event, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground">{event.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
