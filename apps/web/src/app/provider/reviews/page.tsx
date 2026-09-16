'use client';

import { useState } from 'react';
import {
  Star,
  Search,
  Filter,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/common/EmptyState';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

type Review = {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientCompany?: string;
  service: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  response?: string;
};

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.clientAvatar} />
            <AvatarFallback>{review.clientName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.clientName}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < review.rating
                            ? 'fill-status-warning text-status-warning'
                            : 'text-muted-foreground/30'
                        )} aria-hidden="true" />
                    ))}
                  </div>
                </div>
                {review.clientCompany && (
                  <p className="text-sm text-muted-foreground">{review.clientCompany}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{review.date}</span>
            </div>

            <Badge variant="secondary" className="mt-2 text-xs">
              {review.service}
            </Badge>

            <p className="text-sm mt-2">{review.comment}</p>

            {review.response && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
                <p className="text-xs font-medium text-muted-foreground mb-1">Your Response</p>
                <p className="text-sm">{review.response}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <ThumbsUp className="mr-1 icon-sm" />
                Helpful ({review.helpful})
              </Button>
              {!review.response && (
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <MessageSquare className="mr-1 icon-sm" />
                  Respond
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MOCK_REVIEWS: Review[] = [
    {
      id: '1',
      clientName: 'Sarah Williams',
      clientCompany: 'TechStart Inc',
      service: 'Startup Legal Package',
      rating: 5,
      comment: 'Excellent service! The legal documents were thorough and delivered ahead of schedule. Highly recommend for any startup.',
      date: '1 week ago',
      helpful: 12,
      response: 'Thank you so much for your kind words, Sarah! It was a pleasure working with TechStart.',
    },
    {
      id: '2',
      clientName: 'Tom Brown',
      clientCompany: 'GreenTech Co',
      service: 'Financial Model Creation',
      rating: 5,
      comment: 'Quick turnaround and great quality. The financial model was exactly what we needed for our investor meetings.',
      date: '2 weeks ago',
      helpful: 8,
    },
    {
      id: '3',
      clientName: 'Lisa Martinez',
      clientCompany: 'DataFlow',
      service: 'Contract Review',
      rating: 4,
      comment: 'Good work overall. The contract review was detailed and caught several issues we had missed. Minor delay in delivery.',
      date: '3 weeks ago',
      helpful: 5,
      response: 'Thank you for your feedback, Lisa. We apologize for the delay and have improved our processes.',
    },
    {
      id: '4',
      clientName: 'Mike Johnson',
      clientCompany: 'HealthPulse',
      service: 'Startup Legal Package',
      rating: 5,
      comment: 'Professional and knowledgeable. Made the incorporation process smooth and stress-free.',
      date: '1 month ago',
      helpful: 15,
    },
  ];

export default function ProviderReviewsPage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');

  const reviews = showDemoData ? MOCK_REVIEWS : [];
  const filteredReviews = reviews.filter(
    (r) =>
      !search ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.service.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100,
  }));

  if (!showDemoData && reviews.length === 0) {
    return (
      <AppShell title="Reviews" description="See what clients are saying about your services">
        <EmptyState
          illustration="default"
          title="No client reviews yet"
          description="Reviews will appear here once clients rate your completed service engagements."
          askAiPrompt="I have no client reviews yet. What should I do in inquiries and projects so reviews start appearing?"
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Reviews" description="See what clients are saying about your services">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < Math.round(avgRating)
                            ? 'fill-status-warning text-status-warning'
                            : 'text-muted-foreground/30'
                        )} aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reviews.length} reviews
                  </p>
                </div>
                <div className="flex-1 space-y-1">
                  {ratingDistribution.map((dist) => (
                    <div key={dist.rating} className="flex items-center gap-2">
                      <span className="text-xs w-3">{dist.rating}</span>
                      <Star className="icon-sm fill-status-warning text-status-warning" />
                      <Progress value={dist.percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-6">
                        {dist.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-xl font-bold">{reviews.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                  <p className="text-xl font-bold text-status-warning">
                    {reviews.filter((r) => r.rating === 5).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-xl font-bold">
                    {Math.round((reviews.filter((r) => r.response).length / reviews.length) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Helpful Votes</p>
                  <p className="text-xl font-bold">
                    {reviews.reduce((acc, r) => acc + r.helpful, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {filteredReviews.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="font-medium">No reviews found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
