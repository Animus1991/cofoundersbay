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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

type Review = {
  id: string;
  mentee: string;
  menteeAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  sessionType: string;
  helpful: number;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating ? 'fill-status-warning text-amber-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.menteeAvatar} />
            <AvatarFallback>{review.mentee[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{review.mentee}</span>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} />
                  <Badge variant="secondary" className="text-xs">{review.sessionType}</Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{review.date}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
            <div className="flex items-center gap-4 mt-3">
              {/* Neither had a handler, and reviews have no helpful count or
                  reply field to write - the same as on the provider side. */}
              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled title="Reviews cannot be marked helpful yet">
                <ThumbsUp className="mr-1 icon-sm" aria-hidden="true" />
                Helpful ({review.helpful})
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" disabled title="Replies to reviews are not stored yet">
                <MessageSquare className="mr-1 icon-sm" aria-hidden="true" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MOCK_REVIEWS: Review[] = [
    { id: '1', mentee: 'John Doe', rating: 5, comment: 'Incredibly insightful session! The mentor provided actionable advice that helped us pivot our go-to-market strategy. Highly recommend!', date: 'Mar 20, 2025', sessionType: 'Strategy', helpful: 12 },
    { id: '2', mentee: 'Jane Smith', rating: 5, comment: 'Great mentor with deep industry knowledge. The feedback on our pitch deck was invaluable.', date: 'Mar 18, 2025', sessionType: 'Pitch Review', helpful: 8 },
    { id: '3', mentee: 'Mike Johnson', rating: 4, comment: 'Very helpful session on fundraising. Would have liked more time to discuss term sheets.', date: 'Mar 15, 2025', sessionType: 'Fundraising', helpful: 5 },
    { id: '4', mentee: 'Sarah Williams', rating: 5, comment: 'The mentor helped us identify key metrics we were missing. Our investor conversations have improved significantly.', date: 'Mar 12, 2025', sessionType: 'Metrics', helpful: 15 },
    { id: '5', mentee: 'Tom Brown', rating: 4, comment: 'Good technical advice on our architecture. Would recommend for technical founders.', date: 'Mar 10, 2025', sessionType: 'Technical', helpful: 3 },
  ];

export default function MentorReviewsPage() {
  const { showDemoData } = useDemoData();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  const reviews = showDemoData ? MOCK_REVIEWS : [];

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      !search ||
      r.mentee.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase());
    const matchesRating =
      ratingFilter === 'all' || r.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100,
  }));

  if (!showDemoData && reviews.length === 0) {
    return (
      <AppShell title="Reviews" description="Feedback from your mentoring sessions">
        <EmptyState
          illustration="default"
          title="No reviews yet"
          description="Reviews will appear here after your mentees complete sessions and leave feedback."
          askAiPrompt="I have no mentor reviews yet. What should I do in sessions so mentees leave useful feedback?"
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Reviews" description="Feedback from your mentoring sessions">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{avgRating}</p>
                  <StarRating rating={Math.round(parseFloat(avgRating))} />
                  <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {ratingDistribution.map((item) => (
                    <div key={item.rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{item.rating}</span>
                      <Star className="icon-sm fill-status-warning text-amber-400" />
                      <Progress value={item.percentage} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-6">{item.count}</span>
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
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-xl font-bold">48</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-xl font-bold">92%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Repeat Mentees</p>
                  <p className="text-xl font-bold">15</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Helpful Votes</p>
                  <p className="text-xl font-bold">43</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger aria-label="Rating" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
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
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
