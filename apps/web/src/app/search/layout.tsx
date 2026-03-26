import { Suspense, ReactNode } from 'react';
import SearchLoading from './loading';

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<SearchLoading />}>{children}</Suspense>;
}
