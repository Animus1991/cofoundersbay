'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Rocket, Mail, Lock, ArrowRight, Users, Zap, Shield, Eye, EyeOff } from 'lucide-react';
import { login } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HERO_POINTS = [
  { icon: Users, text: 'Connect with 10,000+ founders & investors' },
  { icon: Zap,   text: 'AI-matched to your exact startup stage' },
  { icon: Shield, text: 'Verified profiles, private by default' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    if (!email.trim() || !password) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { user, tokens } = await login({ email: email.trim().toLowerCase(), password });
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      // Redirect to dashboard — it will auto-redirect to /onboarding if profile incomplete
      router.push('/');
    } catch (err) {
      submittingRef.current = false;
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('abort')) {
        setError('Cannot reach server — check your connection or try again.');
      } else if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError('Incorrect email or password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — form */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-md animate-fade-in">
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">CoFounderBay</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to continue building your network.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@startup.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* Right — hero visual */}
      <div className="hidden bg-hero-gradient lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center px-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 animate-pulse-glow">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Your next co-founder is waiting
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join a thriving community of founders, investors, and startup professionals.
          </p>
          <div className="mt-10 space-y-4 text-left">
            {HERO_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-secondary/30 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
