'use client';

import { StatusText } from '@/components/common/StatusText';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Lock,
  AlertCircle,
  Eye,
  MessageSquare,
  Edit3,
  Loader2,
  ExternalLink,
  Calendar,
  User,
  Rocket,
} from 'lucide-react';
import { cn, errorStatus } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { BilingualText } from '@/components/common/BilingualText';
import { MainLandmark } from '@/components/layout/AppShell';
import { CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { TOP_BANNER_STACK } from '@/components/layout/useTopBannerHeight';
import { useStoredUser } from '@/hooks/useStoredUser';

type Pair = { en: string; el: string };

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShareLinkValidation {
  requiresPassword: boolean;
  permissions: 'view' | 'comment' | 'suggest' | 'edit';
  label?: string;
  expiresAt?: string;
  documentId?: string;
  workspaceId?: string;
}

interface SharedDocument {
  id: string;
  title: string;
  type: string;
  description?: string;
  content: Record<string, unknown>;
  status: string;
  completionPercent: number;
  version: number;
  updatedAt: string;
  workspace?: {
    name: string;
    startupName?: string;
    stage?: string;
    industry?: string;
  };
  owner?: {
    displayName: string;
    avatarUrl?: string;
  };
}

// ── Permission badge ──────────────────────────────────────────────────────────

function PermissionBadge({ permission }: { permission: string }) {
  const meta = {
    view:    { label: 'View Only', labelEl: 'Μόνο προβολή',  color: 'text-muted-foreground bg-muted border-border',    icon: Eye },
    comment: { label: 'Can Comment', labelEl: 'Σχόλια', color: 'text-status-info bg-status-info-bg border-status-info-border',   icon: MessageSquare },
    suggest: { label: 'Can Suggest', labelEl: 'Προτάσεις', color: 'text-status-accent bg-status-accent-bg border-status-accent-border', icon: Edit3 },
    edit:    { label: 'Can Edit', labelEl: 'Επεξεργασία',   color: 'text-status-success bg-status-success-bg border-status-success-border', icon: Edit3 },
  }[permission] ?? { label: permission, labelEl: permission, color: 'bg-muted', icon: Eye };

  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn('text-xs flex items-center gap-1', meta.color)}>
      <Icon className="h-2.5 w-2.5" />
      <BilingualText en={meta.label} el={meta.labelEl} compact />
    </Badge>
  );
}

// ── Document type label ───────────────────────────────────────────────────────

const DOC_TYPE: Record<string, Pair> = {
  idea_core: { en: 'Idea Core', el: 'Πυρήνας ιδέας' },
  business_model_canvas: { en: 'Business Model Canvas', el: 'Καμβάς επιχειρηματικού μοντέλου' },
  market_analysis: { en: 'Market Analysis', el: 'Ανάλυση αγοράς' },
  pitch_deck: { en: 'Pitch Deck', el: 'Pitch deck' },
  mvp_plan: { en: 'MVP Plan', el: 'Σχέδιο MVP' },
  financial_plan: { en: 'Financial Plan', el: 'Οικονομικό σχέδιο' },
  technical_architecture: { en: 'Technical Architecture', el: 'Τεχνική αρχιτεκτονική' },
  prd: { en: 'PRD & User Stories', el: 'PRD και ιστορίες χρηστών' },
  swot_analysis: { en: 'SWOT Analysis', el: 'Ανάλυση SWOT' },
  lean_canvas: { en: 'Lean Canvas', el: 'Lean Canvas' },
  competitive_analysis: { en: 'Competitive Analysis', el: 'Ανάλυση ανταγωνισμού' },
  go_to_market: { en: 'Go-to-Market', el: 'Είσοδος στην αγορά' },
  fundraising_memo: { en: 'Fundraising Memo', el: 'Σημείωμα χρηματοδότησης' },
  product_roadmap: { en: 'Product Roadmap', el: 'Οδικός χάρτης προϊόντος' },
};

/** The document's kind in both languages; an unknown kind keeps its own words. */
function docTypeLabel(type: string): Pair {
  const known = DOC_TYPE[type];
  if (known) return known;
  const words = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { en: words, el: words };
}

/** A list item as words: an object's own text, never its JSON. */
function itemText(item: unknown): string {
  if (typeof item === 'string') return item;
  if (typeof item === 'number') return item.toLocaleString('en-GB');
  if (item && typeof item === 'object') {
    return Object.values(item as Record<string, unknown>)
      .filter((v): v is string | number => typeof v === 'string' || typeof v === 'number')
      .map(String)
      .join(' — ');
  }
  return '';
}

// ── Content renderer ──────────────────────────────────────────────────────────

function DocumentContentView({ content, type }: { content: Record<string, unknown>; type: string }) {
  if (!content || Object.keys(content).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="icon-xl mx-auto mb-2 opacity-30" />
        <p className="text-sm"><BilingualText en="No content available in this version." el="Δεν υπάρχει περιεχόμενο σε αυτή την έκδοση." wrap /></p>
      </div>
    );
  }

  const renderValue = (key: string, val: unknown): React.ReactNode => {
    if (val === null || val === undefined) return null;

    const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase());

    if (typeof val === 'string' && val.trim()) {
      return (
        <div key={key} className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-sm whitespace-pre-wrap">{val}</p>
        </div>
      );
    }
    if (typeof val === 'number') {
      return (
        <div key={key} className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-sm font-medium">{val.toLocaleString('en-GB')}</p>
        </div>
      );
    }
    if (Array.isArray(val) && val.length > 0) {
      return (
        <div key={key} className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <ul className="space-y-1">
            {/* An object in a list printed as JSON ({"name":…}); it reads as
                its words now, and a long list says how much it left out. */}
            {val.slice(0, 10).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm">
                <span className="text-primary-accessible mt-1 shrink-0">•</span>
                {itemText(item)}
              </li>
            ))}
            {val.length > 10 ? (
              <li className="text-xs text-muted-foreground">
                <BilingualText en={`and ${val.length - 10} more`} el={`και ${val.length - 10} ακόμη`} compact />
              </li>
            ) : null}
          </ul>
        </div>
      );
    }
    return null;
  };

  const entries = Object.entries(content).filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-5">
      {entries.map(([k, v]) => renderValue(k, v))}
    </div>
  );
}

/** "17 Mar 2026": the platform's short date. */
const SHORT_DATE: Intl.DateTimeFormatOptions = { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' };

// ── Main Share Page ───────────────────────────────────────────────────────────

export default function SharePage() {
  const sayOne = useBilingualString();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [step, setStep] = useState<'loading' | 'password' | 'loaded' | 'error'>('loading');
  const [linkInfo, setLinkInfo] = useState<ShareLinkValidation | null>(null);
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<Pair | null>(null);
  // Every message is a pair: the page is read by people with no account,
  // in either language, and these were English only.
  const [errorMessage, setErrorMessage] = useState<Pair | null>(null);
  // A read that failed (API down) can be tried again; a refused link cannot.
  const [canRetry, setCanRetry] = useState(false);
  const member = Boolean(useStoredUser()?.id);
  const back = `/share/${encodeURIComponent(token)}`;
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Initial load — check the share token
  useEffect(() => {
    if (!token) return;
    validateToken();
  }, [token]);

  const validateToken = async (pwd?: string) => {
    try {
      const result = await apiRequest<{
        requiresPassword?: boolean;
        permissions: string;
        label?: string;
        expiresAt?: string;
        document?: SharedDocument;
        documentId?: string;
        workspaceId?: string;
      }>(`/api/collab/share/${token}${pwd ? `?password=${encodeURIComponent(pwd)}` : ''}`, {
        method: 'GET',
      });

      if (result.requiresPassword && !pwd) {
        setLinkInfo(result as ShareLinkValidation);
        setStep('password');
        return;
      }

      setLinkInfo(result as ShareLinkValidation);
      if (result.document) {
        setDocument(result.document);
        setStep('loaded');
      } else {
        setStep('error');
        setCanRetry(true);
        setErrorMessage({ en: 'The document\'s content could not be read.', el: 'Το περιεχόμενο του εγγράφου δεν διαβάστηκε.' });
      }
    } catch (err: unknown) {
      const status = errorStatus(err);
      const text = err instanceof Error ? err.message.toLowerCase() : '';
      // The API answers 400 for a missing password, a wrong one, expiry and
      // the view limit. 401/403 stay for older clients.
      if (status === 401 || status === 403 || (status === 400 && text.includes('password'))) {
        setPasswordError(pwd ? { en: 'Incorrect password. Please try again.', el: 'Λάθος κωδικός. Δοκιμάστε ξανά.' } : null);
        setStep('password');
      } else if (status === 400 && text.includes('view limit')) {
        setStep('error');
        setCanRetry(false);
        setErrorMessage({ en: 'This share link has reached its view limit.', el: 'Αυτός ο σύνδεσμος κοινοποίησης έφτασε το όριο προβολών.' });
      } else if (status === 404) {
        setStep('error');
        setCanRetry(false);
        setErrorMessage({ en: 'This share link does not exist or has been revoked.', el: 'Αυτός ο σύνδεσμος κοινοποίησης δεν υπάρχει ή ανακλήθηκε.' });
      } else if (status === 410 || (status === 400 && text.includes('expired'))) {
        setStep('error');
        setCanRetry(false);
        setErrorMessage({ en: 'This share link has expired.', el: 'Αυτός ο σύνδεσμος κοινοποίησης έληξε.' });
      } else {
        // Not the link's fault: the document was not read (docs §92).
        setStep('error');
        setCanRetry(true);
        setErrorMessage({ en: 'The shared document could not be read just now. The link may still be fine.', el: 'Το κοινόχρηστο έγγραφο δεν διαβάστηκε αυτή τη στιγμή. Ο σύνδεσμος μπορεί να είναι εντάξει.' });
      }
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;
    setSubmittingPassword(true);
    setPasswordError(null);
    try {
      await validateToken(password.trim());
    } finally {
      setSubmittingPassword(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <MainLandmark className="min-h-screen bg-background flex items-center justify-center" style={{ paddingTop: TOP_BANNER_STACK }}>
        <div className="text-center">
          <Loader2 className="icon-xl animate-spin mx-auto mb-3 text-primary-accessible" />
          <p className="text-sm text-muted-foreground"><BilingualText en="Loading shared document…" el="Φόρτωση κοινόχρηστου εγγράφου…" compact /></p>
        </div>
      </MainLandmark>
    );
  }

  // ── Password gate ────────────────────────────────────────────────────────────

  if (step === 'password') {
    return (
      <MainLandmark className="min-h-screen bg-background flex items-center justify-center p-4" style={{ paddingTop: TOP_BANNER_STACK }}>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="icon-lg text-muted-foreground" />
              </div>
            </div>
            <CardTitle><BilingualText en="Password Protected" el="Προστατεύεται με κωδικό" compact /></CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {linkInfo?.label ? (
                <BilingualText en={`“${linkInfo.label}” is password protected.`} el={`Το «${linkInfo.label}» προστατεύεται με κωδικό.`} wrap />
              ) : (
                <BilingualText en="This document requires a password to view." el="Για να δείτε το έγγραφο χρειάζεται κωδικός." wrap />
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="share-password"><BilingualText en="Password" el="Κωδικός" compact /></Label>
              <Input
                id="share-password"
                type="password"
                placeholder={sayOne("Enter password…", "Συμπληρώστε κωδικό…")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className={cn(passwordError && 'border-destructive')}
              />
              {passwordError && (
                <p role="alert" className="text-xs text-destructive-accessible"><BilingualText en={passwordError.en} el={passwordError.el} wrap /></p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handlePasswordSubmit}
              disabled={submittingPassword || !password.trim()}
            >
              {submittingPassword && <Loader2 className="icon-sm mr-2 animate-spin" />}
              <BilingualText en="View Document" el="Προβολή εγγράφου" compact />
            </Button>
          </CardContent>
        </Card>
      </MainLandmark>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (step === 'error') {
    return (
      <MainLandmark className="min-h-screen bg-background flex items-center justify-center p-4" style={{ paddingTop: TOP_BANNER_STACK }}>
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive-accessible" />
            <h1 className="font-semibold mb-2">
              {canRetry
                ? <BilingualText en="Shared document" el="Κοινόχρηστο έγγραφο" compact />
                : <BilingualText en="Link Unavailable" el="Ο σύνδεσμος δεν είναι διαθέσιμος" compact />}
            </h1>
            {errorMessage ? (
              <p role="alert" className="text-sm text-muted-foreground mb-4"><BilingualText en={errorMessage.en} el={errorMessage.el} wrap /></p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              {canRetry ? (
                <Button variant="outline" onClick={() => { setStep('loading'); void validateToken(); }}>
                  <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
                </Button>
              ) : null}
              <Button variant={canRetry ? 'ghost' : 'outline'} asChild>
                <Link href="/"><BilingualText en="Go to CoFounderBay" el="Μετάβαση στο CoFounderBay" compact /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </MainLandmark>
    );
  }

  // ── Document view ────────────────────────────────────────────────────────────

  return (
    <MainLandmark className="min-h-screen bg-muted/30" style={{ paddingTop: TOP_BANNER_STACK }}>
      {/* Top bar, under any top banner rather than behind it. */}
      <div className="bg-background border-b sticky z-50" style={{ top: TOP_BANNER_STACK }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* On a phone the name was hidden and the rocket is decoration,
                so the bar began with a bare "/". The name stays; the title
                is the heading right below, so the phone drops it here. */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Rocket className="icon-md text-muted-foreground shrink-0" />
              <span className="font-semibold text-sm">CoFounderBay</span>
            </Link>
            {document && (
              <span className="hidden sm:flex items-center gap-3 min-w-0">
                <span className="text-muted-foreground/40" aria-hidden="true">/</span>
                <span className="text-sm truncate">{document.title}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {linkInfo && <PermissionBadge permission={linkInfo.permissions} />}
            {linkInfo?.expiresAt && (
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <Calendar className="icon-sm" />
                <BilingualText
                  en={`Expires ${new Date(linkInfo.expiresAt).toLocaleDateString('en-GB', SHORT_DATE)}`}
                  el={`Λήγει ${new Date(linkInfo.expiresAt).toLocaleDateString('el-GR', SHORT_DATE)}`}
                  compact
                />
              </span>
            )}
            {/* "Sign In" went to the home page. It signs in and comes back
                here; a member needs none, and while the feedback card below
                offers it, it is said there once (docs §92). */}
            {member || linkInfo?.permissions === 'comment' || linkInfo?.permissions === 'suggest' ? null : (
              <Button size="sm" variant="outline" className="text-xs" asChild>
                <Link href={`/login?redirect=${encodeURIComponent(back)}`}>
                  <ExternalLink className="icon-sm mr-1.5" />
                  <BilingualText en="Sign In" el="Σύνδεση" compact />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {document ? (
          <>
            {/* Document header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {/* "Idea Core" above "Idea Core": the kind is said only
                        when the title does not already say it. */}
                    {docTypeLabel(document.type).en.toLowerCase() === document.title.trim().toLowerCase() ? null : (
                      <Badge variant="secondary" className="text-xs">
                        <BilingualText en={docTypeLabel(document.type).en} el={docTypeLabel(document.type).el} compact />
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize', {
                        'text-status-success': document.status === 'approved',
                        'text-status-info': document.status === 'review',
                        'text-status-warning': document.status === 'in_progress',
                      })}
                    >
                      <StatusText value={document.status} />
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold">{document.title}</h1>
                  {document.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{document.description}</p>
                  )}
                </div>
              </div>

              {/* Workspace info */}
              {document.workspace && (
                // The startup behind the document: its mark and name, the
                // stage and sector under it, the owner at the right.
                <Card>
                  <CardContent>
                    <CardHead
                      mark={(
                        <div data-card-mark="" className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <Rocket className="icon-md" aria-hidden="true" />
                        </div>
                      )}
                      title={document.workspace.startupName ?? document.workspace.name}
                      subtitle={(document.workspace.stage || document.workspace.industry) ? (
                        <FactLine
                          className="text-sm"
                          items={[
                            document.workspace.stage ? <StatusText key="stage" value={document.workspace.stage} /> : null,
                            document.workspace.industry ? <span key="industry" className="inline-block first-letter:uppercase">{document.workspace.industry}</span> : null,
                          ]}
                        />
                      ) : undefined}
                      aside={document.owner ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="icon-sm" aria-hidden="true" />
                          {document.owner.displayName}
                        </span>
                      ) : undefined}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Completion bar */}
              {document.completionPercent > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span><BilingualText en="Completion" el="Ολοκλήρωση" compact /></span>
                    <span>{document.completionPercent}%</span>
                  </div>
                  <Progress value={document.completionPercent} className="h-1.5" />
                </div>
              )}
            </div>

            {/* Document content */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="icon-sm" />
                    <BilingualText en="Document Content" el="Περιεχόμενο εγγράφου" compact />
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    <BilingualText
                      en={`v${document.version} · Updated ${new Date(document.updatedAt).toLocaleDateString('en-GB', SHORT_DATE)}`}
                      el={`v${document.version} · Ενημερώθηκε ${new Date(document.updatedAt).toLocaleDateString('el-GR', SHORT_DATE)}`}
                      compact
                    />
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <DocumentContentView content={document.content} type={document.type} />
              </CardContent>
            </Card>

            {/* View-only notice */}
            {linkInfo?.permissions === 'view' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                <Eye className="icon-sm shrink-0" />
                <BilingualText en="You are viewing this document in read-only mode. To collaborate, request full access from the owner." el="Βλέπετε το έγγραφο μόνο για ανάγνωση. Για συνεργασία, ζητήστε πλήρη πρόσβαση από τον κάτοχο." wrap />
              </div>
            )}

            {/* CTA for authenticated actions */}
            {!member && (linkInfo?.permissions === 'comment' || linkInfo?.permissions === 'suggest') && (
              <Card className="border-primary-muted bg-primary-subtle">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium"><BilingualText en="Want to leave feedback?" el="Θέλετε να αφήσετε σχόλιο;" compact wrap /></p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <BilingualText en="Sign in or create a free account to comment on this document." el="Συνδεθείτε ή δημιουργήστε δωρεάν λογαριασμό για να σχολιάσετε αυτό το έγγραφο." wrap />
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/login?redirect=${encodeURIComponent(back)}`}>
                      <BilingualText en="Sign In" el="Σύνδεση" compact />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        <BilingualText en="Shared via" el="Κοινοποιήθηκε μέσω" compact />{' '}
        <Link href="/" className="text-primary-accessible hover:underline font-medium">
          CoFounderBay
        </Link>{' '}
        <BilingualText en="— Startup Builder Platform" el="— Πλατφόρμα Startup Builder" compact />
      </footer>
    </MainLandmark>
  );
}
