'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import { TOP_BANNER_STACK } from './useTopBannerHeight';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#roles', label: "Who it's for" },
  { href: '#pricing', label: 'Pricing' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      aria-label="Primary"
      style={{ top: TOP_BANNER_STACK }}
      className="fixed z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl safe-top"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="CoFounderBay home">
          <Logo size="sm" />
        </Link>
        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo" className="hidden sm:block">
              Try demo
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" className="hidden sm:block">
              Log in
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/register">
              Join free <ArrowRight className="icon-sm" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="icon-md" /> : <Menu className="icon-md" />}
          </Button>
        </div>
      </div>
      {open && (
        <div
          id="landing-mobile-nav"
          className="border-t border-border/50 bg-background px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground py-1"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/demo" onClick={() => setOpen(false)}>
                Try demo
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
