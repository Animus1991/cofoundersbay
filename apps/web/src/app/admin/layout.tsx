'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { cn } from '@/lib/utils';
import { LayoutGrid, Building2, KeyRound, Globe, Zap } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin',              label: 'Platform',      icon: LayoutGrid },
  { href: '/admin/tenants',      label: 'Organizations',  icon: Building2 },
  { href: '/admin/sso',          label: 'SSO',            icon: KeyRound },
  { href: '/admin/domains',      label: 'Domains',        icon: Globe },
  { href: '/admin/automations',  label: 'Automations',    icon: Zap },
];

function AdminSubNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-border/50 bg-card/60 px-4">
      <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto w-full min-w-0 max-w-7xl mx-auto">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Icon className="icon-sm" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminSubNav />
      {children}
    </AdminGuard>
  );
}
