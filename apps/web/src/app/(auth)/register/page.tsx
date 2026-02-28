'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Rocket, Mail, Lock, ArrowRight,
  Briefcase, GraduationCap, TrendingUp, Building2,
  Star, Lightbulb, Globe, Eye, EyeOff,
} from 'lucide-react';
import { register as registerApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROLES = [
  {
    value: 'founder',
    label: 'Founder',
    description: 'Build and lead startups',
    icon: Briefcase,
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Coach and guide teams',
    icon: GraduationCap,
  },
  {
    value: 'investor',
    label: 'Investor',
    description: 'Back early-stage teams',
    icon: TrendingUp,
  },
  {
    value: 'org',
    label: 'Organization',
    description: 'Represent a company',
    icon: Building2,
  },
] as const;

const HERO_STATS = [
  { icon: Star,      value: '10K+',   label: 'Active members' },
  { icon: Lightbulb, value: '3.2K+',  label: 'Startups formed' },
  { icon: Globe,     value: '80+',    label: 'Countries' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<string>('founder');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const passwordStrength = password.length === 0 ? null
    : password.length < 8 ? 'weak'
    : password.length < 12 || !/[0-9]/.test(password) ? 'medium'
    : 'strong';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    submittingRef.current = true;
    setLoading(true);
    try {
      const { user, tokens } = await registerApi({
        email: email.trim().toLowerCase(),
        password,
        role: role as 'founder' | 'mentor' | 'investor' | 'org',
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      router.push('/onboarding');
    } catch (err) {
      submittingRef.current = false;
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('abort')) {
        setError('Cannot reach server — check your connection or try again.');
      } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('conflict')) {
        setError('An account with this email already exists. Try signing in.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — hero visual */}
      <div className="hidden bg-hero-gradient lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center px-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 animate-pulse-glow">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Start your journey
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create your signal-rich profile and get matched with the right people for your startup journey.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {HERO_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl bg-secondary/30 px-3 py-4 text-center">
                <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-col justify-center overflow-y-auto px-8 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-md animate-fade-in">
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">CoFounderBay</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-muted-foreground">Join the startup ecosystem in under 2 minutes.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="reg-email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="reg-email"
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
              <label htmlFor="reg-password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
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
              {passwordStrength && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {(['weak', 'medium', 'strong'] as const).map((level, i) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength === 'weak' && i === 0 ? 'bg-red-500'
                        : passwordStrength === 'medium' && i <= 1 ? 'bg-amber-500'
                        : passwordStrength === 'strong' ? 'bg-emerald-500'
                        : 'bg-border'
                      }`} />
                    ))}
                  </div>
                  <span className={`text-xs ${
                    passwordStrength === 'weak' ? 'text-red-400'
                    : passwordStrength === 'medium' ? 'text-amber-400'
                    : 'text-emerald-400'
                  }`}>{passwordStrength}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">I am a&hellip;</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-all ${
                        active
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium leading-tight">{r.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{r.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
              {loading ? 'Creating account…' : 'Create account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
