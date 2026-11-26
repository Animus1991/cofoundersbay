import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HeaderBandSkeleton } from '@/components/layout/HeaderBandSkeleton';

/**
 * The route's loading echo in the shape of the page that follows: the shared
 * header band, the search, the category strip and the card grid the page
 * draws while its list loads. It used to print a header of its own,
 * "Marketplace · Discover tools and resources to grow your startup", a title
 * and a line the page does not have, which changed under the reader as the
 * page arrived (§162).
 */
export default function MarketplaceLoading() {
  return (
    <div className="space-y-6 pb-10">
      <HeaderBandSkeleton />
      <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="card-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
