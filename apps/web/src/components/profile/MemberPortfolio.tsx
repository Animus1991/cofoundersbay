'use client';

import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMemberPortfolio } from '@/lib/portfolio';
import { qk } from '@/lib/query-keys';
import { PortfolioList } from './PortfolioList';

/** A member's work on their profile: nothing at all when they have added none. */
export function MemberPortfolio({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: qk('public-profile', userId, 'portfolio'),
    queryFn: () => getMemberPortfolio(userId),
    staleTime: 5 * 60_000,
    retry: 0,
  });
  if (!data?.items.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle><BilingualText en="Portfolio" el="Χαρτοφυλάκιο" compact /></CardTitle>
      </CardHeader>
      <CardContent>
        <PortfolioList items={data.items} />
      </CardContent>
    </Card>
  );
}
