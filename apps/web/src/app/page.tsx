export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { DashboardHome } from './DashboardHome';
import { LandingHome } from './LandingHome';

export default async function Home() {
  const cookieStore = await cookies();
  return cookieStore.has('cfb_session') ? <DashboardHome /> : <LandingHome />;
}
