'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isPreviewDemo } from '@/lib/preview-demo';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      try {
        if (isPreviewDemo()) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const isDemo = user.email === 'demo@cofounderbay.com';
        setIsAdmin(user.role === 'admin' || user.role === 'platform_admin' || isDemo);
        setIsLoading(false);
      } catch {
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Access Denied</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              You don&apos;t have permission to access the admin dashboard. This area is restricted to administrators only.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => router.push('/')}>
                Go Home
              </Button>
              <Button onClick={() => router.push('/login')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
