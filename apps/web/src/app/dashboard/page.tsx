'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { Loader2 } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';

export default function DashboardRouter() {
  const router = useRouter();
  const { primaryRole, isLoading } = useRole();

  useEffect(() => {
    if (isLoading) return;

    // Every member's first page is /home (docs §119); their role's dashboard stays
    // one link away, as Overview in the sidebar. Platform staff keep the console.
    const roleRoutes: Record<string, string> = {
      aspiring_founder: '/home',
      existing_founder: '/home',
      cofounder_candidate: '/home',
      technical_talent: '/home',
      business_operator: '/home',
      mentor: '/home',
      advisor: '/home',
      coach: '/home',
      course_creator: '/home',
      angel_investor: '/home',
      vc_scout: '/home',
      vc_analyst: '/home',
      syndicate_manager: '/home',
      incubator_admin: '/home',
      accelerator_admin: '/home',
      university_admin: '/home',
      venture_studio_admin: '/home',
      service_provider: '/home',
      legal_partner: '/home',
      finance_advisor: '/home',
      recruiter: '/home',
      platform_admin: '/admin/dashboard',
    };

    const targetRoute = (primaryRole && roleRoutes[primaryRole]) || '/home';
    router.replace(targetRoute);
  }, [primaryRole, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="icon-xl animate-spin text-primary-accessible" />
        <p className="text-sm text-muted-foreground">
          <BilingualText en="Opening your dashboard…" el="Άνοιγμα του πίνακά σας…" compact />
        </p>
      </div>
    </div>
  );
}
