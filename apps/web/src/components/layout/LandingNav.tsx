'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';

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
      className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl safe-top"
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
          <Link href="/demo" className="hidden sm:block">
            <Button variant="outline" size="sm">
              Try demo
            </Button>
          </Link>
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="gap-1.5">
              Join free <ArrowRight className="icon-sm" />
            </Button>
          </Link>
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
            <Link href="/demo" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                Try demo
              </Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
