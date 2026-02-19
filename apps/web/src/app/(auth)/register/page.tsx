'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register as registerApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ROLES = [
  { value: 'founder', label: 'Founder' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'investor', label: 'Investor' },
  { value: 'org', label: 'Organization' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('founder');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await registerApi({
        email,
        password,
        role: role as 'founder' | 'mentor' | 'investor' | 'org',
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      router.push('/onboarding');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-radial">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Create account</CardTitle>
            <CardDescription>Join the startup ecosystem in minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@startup.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password (min 8 characters)
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">I am a</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ROLES.map((r) => {
                    const active = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          active
                            ? 'border-primary/60 bg-primary/15 text-primary'
                            : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <p className="font-medium">{r.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.value === 'founder' && 'Build and lead startups'}
                          {r.value === 'mentor' && 'Coach and guide teams'}
                          {r.value === 'investor' && 'Back early-stage teams'}
                          {r.value === 'org' && 'Represent an organization'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
