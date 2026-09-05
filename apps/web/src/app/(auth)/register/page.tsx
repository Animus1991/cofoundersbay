'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register as registerApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OAuthButtons, OAuthDivider } from '@/components/auth/OAuthButtons';
import { Logo, LogoIcon } from '@/components/brand/Logo';
import { useTenant } from '@/components/providers/TenantContext';

const ROLES = [
  {
    value: 'founder',
    label: 'Founder',
    description: 'Build and lead startups',
    badge: 'F',
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Coach and guide teams',
    badge: 'M',
  },
  {
    value: 'investor',
    label: 'Investor',
    description: 'Back early-stage teams',
    badge: 'I',
  },
  {
    value: 'org',
    label: 'Organization',
    description: 'Represent a company',
    badge: 'O',
  },
] as const;

const HERO_STATS = [
  { value: '10K+',  label: 'Active members', accent: 'from-amber-200/50 to-white/0' },
  { value: '3.2K+', label: 'Startups formed', accent: 'from-emerald-200/50 to-white/0' },
  { value: '80+',   label: 'Countries', accent: 'from-sky-200/50 to-white/0' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { activeTenant, branding } = useTenant();
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
        // Store only display data (name, role, avatar) — auth tokens are in httpOnly cookies
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
      {/* Left — hero panel */}
      <div className="hidden bg-hero-gradient lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial pointer-events-none" />
        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-8 flex items-center justify-center">
            {activeTenant?.logoUrl
              ? <img src={activeTenant.logoUrl} alt={activeTenant.name} className="h-16 w-auto object-contain" />
              : <LogoIcon size={72} />}
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            {branding?.heroTitle || (activeTenant ? `Join ${activeTenant.displayName ?? activeTenant.name}` : 'Start your journey')}
          </h2>
          <p className="mt-4 text-white/65 text-base leading-relaxed">
            {branding?.heroSubtitle || (activeTenant?.shortDescription ?? 'Create your signal-rich profile and get matched with the right founders, mentors, and investors.')}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {HERO_STATS.map(({ value, label, accent }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/8 px-3 py-4 text-center backdrop-blur-sm">
                <div className={`mx-auto mb-2 h-2.5 w-10 rounded-full bg-gradient-to-r ${accent}`} />
                <p className="font-display text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/55">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-col justify-center overflow-y-auto px-8 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-md animate-fade-in">
          <Link href="/" className="mb-10 inline-block hover:opacity-80 transition-opacity">
            {activeTenant?.logoUrl
              ? <img src={activeTenant.logoUrl} alt={activeTenant.name} className="h-8 object-contain" />
              : <Logo size="sm" />}
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-muted-foreground">
            {activeTenant
              ? `Join ${activeTenant.displayName ?? activeTenant.name} in under 2 minutes.`
              : 'Join the startup ecosystem in under 2 minutes.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                <span className="mt-0.5 shrink-0 font-semibold">!</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="reg-email" className="text-sm font-medium">Email</label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@startup.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reg-password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
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
                  <span className={`text-xs font-medium ${
                    passwordStrength === 'weak' ? 'text-red-600 dark:text-red-400'
                    : passwordStrength === 'medium' ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                  }`}>{passwordStrength}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium" id="role-label">I am a&hellip;</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="role-label">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      aria-pressed={active}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-all focus-ring ${
                        active
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                          active ? 'bg-primary/15 text-primary' : 'bg-background text-muted-foreground'
                        }`}
                      >
                        {r.badge}
                      </span>
                      <div>
                        <p className="font-medium leading-tight">{r.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{r.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>

            <OAuthDivider />
            <OAuthButtons mode="register" disabled={loading} />
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
