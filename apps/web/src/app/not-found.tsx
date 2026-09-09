import Link from 'next/link';
import { Compass, Home, LifeBuoy, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

const SUGGESTIONS = [
  { href: '/dashboard', label: 'Dashboard', description: 'Your home base', icon: Home },
  { href: '/discover', label: 'Discover', description: 'Find people to work with', icon: Compass },
  { href: '/members', label: 'Members', description: 'Browse the directory', icon: Users },
  { href: '/help', label: 'Help centre', description: 'Guides and support', icon: LifeBuoy },
];

/**
 * Rendered inside the root layout, so it must NOT declare its own
 * <html>/<body> (the previous version did, producing an invalid nested
 * document and bypassing the theme entirely).
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-background bg-hero-radial px-6 py-16"
    >
      <div className="w-full max-w-xl text-center">
        <p className="text-7xl font-bold leading-none tracking-tight text-gradient-primary sm:text-8xl">
          404
        </p>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-pretty">
          The link may be outdated, or the page may have moved. Here are a few places
          that usually have what you&apos;re looking for.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="icon-sm" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/search">
              <Search className="icon-sm" aria-hidden="true" />
              Search the platform
            </Link>
          </Button>
        </div>

        <nav aria-label="Suggested pages" className="mt-10">
          <ul className="grid gap-3 sm:grid-cols-2">
            {SUGGESTIONS.map(({ href, label, description, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="focus-ring flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-emphasis">
                    <Icon className="icon-sm" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
