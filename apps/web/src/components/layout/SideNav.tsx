"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navSections } from './nav-links';

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-fit min-h-[420px] rounded-2xl border border-border/60 bg-card/70 p-4 shadow-glow-sm backdrop-blur lg:block">
      <nav className="space-y-6">
        {navSections.map(({ section, links }) => (
          <div key={section}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {section}
            </p>
            <ul className="mt-4 space-y-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
