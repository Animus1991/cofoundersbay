"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { navSections } from './nav-links';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  // Close sheet when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const roleGradient = {
    founder: 'from-indigo-500 to-purple-500',
    mentor: 'from-cyan-500 to-teal-500',
    investor: 'from-orange-500 to-red-500',
    org: 'from-violet-500 to-indigo-500',
  };

  const userRole = user?.role as keyof typeof roleGradient;
  const gradient = roleGradient[userRole] || roleGradient.founder;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        {/* Header with gradient */}
        <div className={cn('relative h-32 bg-gradient-to-br p-6', gradient)}>
          <div className="absolute inset-0 bg-black/20" />
          <SheetHeader className="relative z-10">
            <SheetTitle asChild>
              <Logo size="sm" inverted />
            </SheetTitle>
          </SheetHeader>
          
          {user && (
            <div className="relative z-10 mt-4 flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white font-semibold">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[160px]">
                  {user.email}
                </p>
                <p className="text-xs text-white/70 capitalize">{user.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation links grouped by section */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {navSections
            .filter((s) => s.section !== 'Account')
            .map(({ section, links }) => (
            <div key={section}>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section}
              </p>
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={`${section}-${href}`}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 transition-transform', active && 'scale-110')} />
                    {label}
                    {active && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-border/60 p-4 space-y-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
              >
                <User className="h-5 w-5" />
                My Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex-1">
                <Button variant="secondary" className="w-full">Sign in</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button className="w-full">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
