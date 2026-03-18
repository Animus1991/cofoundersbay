'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Users, Zap, Shield, Eye, EyeOff, Building2 } from 'lucide-react';
import { login, discoverSSOByEmail, getSSOLoginUrl, type SSODiscoveryResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OAuthButtons, OAuthDivider } from '@/components/auth/OAuthButtons';
import { Logo, LogoIcon } from '@/components/brand/Logo';

const HERO_POINTS = [
  { icon: Users, text: 'Connect with 10,000+ founders & investors' },
  { icon: Zap,   text: 'AI-matched to your exact startup stage' },
  { icon: Shield, text: 'Verified profiles, private by default' },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoDiscovery, setSsoDiscovery] = useState<SSODiscoveryResult | null>(null);
  const [checkingSSO, setCheckingSSO] = useState(false);
  const submittingRef = useRef(false);
  const ssoCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for SSO when email changes (debounced)
  const checkSSOForEmail = useCallback(async (emailValue: string) => {
    if (!emailValue.includes('@') || emailValue.split('@')[1]?.length < 3) {
      setSsoDiscovery(null);
      return;
    }

    setCheckingSSO(true);
    try {
      const result = await discoverSSOByEmail(emailValue);
      setSsoDiscovery(result);
    } catch {
      setSsoDiscovery(null);
    } finally {
      setCheckingSSO(false);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Debounce SSO check
    if (ssoCheckTimeoutRef.current) {
      clearTimeout(ssoCheckTimeoutRef.current);
    }
    ssoCheckTimeoutRef.current = setTimeout(() => {
      checkSSOForEmail(value);
    }, 500);
  };

  const handleSSOLogin = () => {
    if (!ssoDiscovery?.provider?.id) return;
    const returnUrl = searchParams.get('returnUrl') || '/';
    window.location.href = getSSOLoginUrl(ssoDiscovery.provider.id, returnUrl);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    if (!email.trim() || !password) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { user } = await login({ email: email.trim().toLowerCase(), password });
      if (typeof window !== 'undefined') {
        // Store only display data (name, role, avatar) — auth tokens are in httpOnly cookies
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
      <main id="main-content" className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-md animate-fade-in">
          <Link href="/" className="mb-10 inline-block hover:opacity-80 transition-opacity">
            <Logo size="sm" />
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
                  onChange={handleEmailChange}
                  required
                  autoComplete="email"
                  placeholder="you@startup.com"
                  className="pl-10"
                />
              </div>
              {checkingSSO && (
                <p className="text-xs text-muted-foreground animate-pulse">Checking organization settings...</p>
              )}
            </div>

            {/* SSO Discovery Banner */}
            {ssoDiscovery?.ssoAvailable && ssoDiscovery.provider && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">
                    {ssoDiscovery.tenant?.name || 'Organization'} SSO detected
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleSSOLogin}
                  className="w-full gap-2"
                  variant="default"
                  style={ssoDiscovery.provider.loginButtonColor ? { backgroundColor: ssoDiscovery.provider.loginButtonColor } : undefined}
                >
                  {ssoDiscovery.provider.logoUrl && (
                    <img src={ssoDiscovery.provider.logoUrl} alt="" className="h-4 w-4" />
                  )}
                  {ssoDiscovery.provider.loginButtonText || 'Continue with SSO'}
                </Button>
                {ssoDiscovery.ssoRequired && !ssoDiscovery.allowPasswordLogin ? (
                  <p className="text-xs text-muted-foreground text-center">
                    Your organization requires SSO login
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Or continue with password below
                  </p>
                )}
              </div>
            )}

            {/* Password section - hidden if SSO is required */}
            {(!ssoDiscovery?.ssoRequired || ssoDiscovery?.allowPasswordLogin) && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!ssoDiscovery?.ssoRequired}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
                  {loading ? 'Signing in…' : 'Sign in'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </>
            )}

            <OAuthDivider />
            <OAuthButtons mode="login" disabled={loading} />
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </main>

      {/* Right — hero panel */}
      <div className="hidden bg-hero-gradient lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center px-12 relative overflow-hidden">
        {/* Subtle radial overlay */}
        <div className="absolute inset-0 bg-hero-radial pointer-events-none" />
        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-8 flex items-center justify-center">
            <LogoIcon size={72} />
          </div>
          <h2 className="font-display text-3xl font-bold text-white">
            Your next co-founder is waiting
          </h2>
          <p className="mt-4 text-white/65 text-base leading-relaxed">
            Join thousands of founders, mentors, and investors building the future together.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {HERO_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/85 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
