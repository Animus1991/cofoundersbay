import { ReactNode } from 'react';

// RoleProvider now wraps the whole app from the root layout — see
// apps/web/src/app/layout.tsx. Previously this route-group layout was the
// only place RoleProvider existed, so `useRole()` (and its real, API-backed
// primaryRole) was unavailable outside /dashboard/*, forcing components
// like SideNav to fall back to a stale, coarser role string from
// localStorage. Nesting a second RoleProvider here would just trigger a
// redundant /api/roles/dashboard-context fetch on every dashboard visit.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
