'use client';

import { ReactNode } from 'react';
import { RoleProvider } from '@/contexts/RoleContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      {children}
    </RoleProvider>
  );
}
