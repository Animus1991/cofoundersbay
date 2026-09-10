'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, MoreVertical, AlertTriangle, Bookmark, Send,
  Clock, TrendingUp, CheckCircle, Info, Brain, Zap, MessageCircle, ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  getMatchVs, recordMatchFeedback, recordBehavioralSignal, sendConnectionRequest,
  saveToShortlist, removeFromShortlist, getShortlistIds,
  type MatchVsResult, type MatchVsBreakdownItem, type MatchVsFrictionPoint, type MatchVsStrength,
} from '@/lib/api';

// ── Section Label — JetBrains Mono, ALL CAPS ─────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {label}
    </p>
  );
}

// ── Factor Row ────────────────────────────────────────────────────────────────

function FactorRow({ item }: { item: MatchVsBreakdownItem }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {item.label}
        </span>
        <span className="text-2xs font-semibold tabular-nums text-foreground"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {item.score}%
        </span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden bg-border">
        <div
          className="h-1 rounded-full transition-all duration-700"
          style={{ width: `${item.score}%`, background: item.color }}
        />
      </div>
    </div>
  );
}

// ── Compatibility Badge ───────────────────────────────────────────────────────

function CompatBadge({ label }: { label: string }) {
  const icon = label.toLowerCase().includes('vision') ? (
    <Brain className="icon-sm" />
  ) : (
    <Zap className="icon-sm" />
  );
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded"
      style={{
        background: 'rgba(34,211,238,0.08)',
        border: '1px solid rgba(34,211,238,0.2)',
        color: '#22D3EE',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
      }}>
      {icon}
      {label}
    </div>
  );
}

// ── Trait Chip ────────────────────────────────────────────────────────────────

function TraitChip({ item }: { item: MatchVsStrength }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-card">
      <span style={{ color: '#4ADE80', fontSize: 10 }}>■</span>
      <span className="text-2xs font-medium text-foreground"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {item.label}
      </span>
    </div>
  );
}

// ── Friction Icon helper ───────────────────────────────────────────────────────

function FrictionIcon({ icon }: { icon: string }) {
  const cls = "h-5 w-5";
  if (icon === 'schedule') return <Clock className={cls} />;
  if (icon === 'trending_up') return <TrendingUp className={cls} />;
  return <AlertTriangle className={cls} />;
}

// ── Friction Points — single unified card with dividers ───────────────────────

function FrictionSection({ points }: { points: MatchVsFrictionPoint[] }) {
  if (points.length === 0) return null;
  return (
    <div className="rounded-lg overflow-hidden border"
      style={{ background: 'rgba(251,146,60,0.05)', borderColor: 'rgba(251,146,60,0.2)' }}>
      {points.map((point, i) => (
        <div key={point.title}>
          <div className="flex gap-3 p-4">
            <div className="shrink-0 mt-0.5" style={{ color: '#FB923C' }}>
              <FrictionIcon icon={point.icon} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-sm font-semibold leading-none" style={{ color: '#FB923C' }}>
                {point.title}
              </span>
              <span className="text-sm text-foreground leading-relaxed">{point.description}</span>
            </div>
          </div>
          {i < points.length - 1 && (
            <div className="mx-4" style={{ height: 1, background: 'rgba(251,146,60,0.13)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Work Style — smooth SVG line chart ────────────────────────────────────────

function WorkStyleLineChart({ data }: { data: MatchVsResult['workStyle'] }) {
  const { axes, source, target } = data;
  const n = axes.length;
  const W = 300, H = 160;
  const PAD = { top: 14, bottom: 30, left: 10, right: 10 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const xAt = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
  const yAt = (v: number) => PAD.top + cH - (Math.min(Math.max(v, 0), 100) / 100) * cH;

  const smoothPath = (vals: number[]) => {
    if (!vals.length) return '';
    if (vals.length === 1) return `M ${xAt(0)} ${yAt(vals[0])}`;
    const pts = vals.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` C ${cpx} ${pts[i - 1][1]}, ${cpx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line key={pct} x1={PAD.left} y1={yAt(pct)} x2={W - PAD.right} y2={yAt(pct)}
            stroke="rgba(107,114,128,0.15)" strokeWidth={1} />
        ))}
        {/* Source line */}
        <path d={smoothPath(source)} fill="none" stroke="#4ADE80" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Target line */}
        <path d={smoothPath(target)} fill="none" stroke="#22D3EE" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Source dots */}
        {source.map((v, i) => (
          <circle key={`s${i}`} cx={xAt(i)} cy={yAt(v)} r={4} fill="#4ADE80" />
        ))}
        {/* Target dots */}
        {target.map((v, i) => (
          <circle key={`t${i}`} cx={xAt(i)} cy={yAt(v)} r={4} fill="#22D3EE" />
        ))}
        {/* X-axis labels */}
        {axes.map((axis, i) => (
          <text key={axis} x={xAt(i)} y={H - 6} textAnchor="middle" fontSize={9}
            fill="rgba(107,114,128,0.7)"
            fontFamily="'JetBrains Mono', monospace">
            {axis}
          </text>
        ))}
      </svg>
      <div className="flex justify-center gap-6 mt-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="w-5 h-0.5 rounded-full" style={{ background: '#4ADE80' }} />
          You
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="w-5 h-0.5 rounded-full" style={{ background: '#22D3EE' }} />
          Match
        </div>
      </div>
    </div>
  );
}

// ── Donut Score ───────────────────────────────────────────────────────────────

function DonutScore({ score }: { score: number }) {
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#333333" strokeWidth={10} />
        {/* Score arc — rotated so 0% starts at top */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22D3EE" strokeWidth={10}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transformOrigin: '50px 50px', transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold tabular-nums leading-none"
          style={{ color: '#22D3EE', fontSize: 22, fontFamily: "'JetBrains Mono', monospace" }}>
          {score}%
        </span>
        <span className="uppercase tracking-wider mt-0.5"
          style={{ color: 'var(--muted-foreground)', fontSize: 9, fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace" }}>
          MATCH
        </span>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="px-4 py-8 space-y-6">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const targetUserId = params?.userId as string;
  const [shortlisted, setShortlisted] = useState(false);

  // Fetch whether this user is already in shortlist
  useQuery({
    queryKey: ['shortlist', 'ids'],
    queryFn: getShortlistIds,
    staleTime: 60_000,
    onSuccess: (d: { ids: string[] }) => {
      setShortlisted(d.ids.includes(targetUserId));
    },
  } as any);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['match-vs', targetUserId],
    queryFn: () => getMatchVs(targetUserId),
    enabled: !!targetUserId,
  });

  const connectMutation = useMutation({
    mutationFn: (msg: string) => sendConnectionRequest({ receiverId: targetUserId, message: msg }),
    onSuccess: () => {
      addToast({ title: 'Collaboration request sent', type: 'success' });
      recordBehavioralSignal({ signalType: 'connection_request', targetId: targetUserId, targetType: 'user', value: 2 }).catch(() => {});
    },
    onError: () => addToast({ title: 'Could not send request', type: 'error' }),
  });

  const handleShortlist = async () => {
    const nextState = !shortlisted;
    setShortlisted(nextState);
    try {
      if (nextState) {
        await saveToShortlist(targetUserId);
        recordBehavioralSignal({ signalType: 'shortlist', targetId: targetUserId, targetType: 'user', value: 1 }).catch(() => {});
      } else {
        await removeFromShortlist(targetUserId);
      }
      addToast({ title: nextState ? 'Saved to shortlist' : 'Removed from shortlist', type: 'info' });
    } catch {
      setShortlisted(!nextState);
      addToast({ title: 'Could not update shortlist', type: 'error' });
    }
  };

  const handlePropose = () => {
    connectMutation.mutate('Hi, I came across your profile and I think we could be a strong match. I would love to connect and explore potential collaboration.');
    recordMatchFeedback({ targetUserId, feedback: 'accepted', connectionStarted: true }).catch(() => {});
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <PageSkeleton />
        </div>
      </AppShell>
    );
  }

  // The whole render below dereferences these unconditionally, so a 200
  // with a partial body has to take the same path as an outright failure.
  if (isError || typeof data?.overall !== 'number' || !data.sourceProfile || !data.targetProfile) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Info className="icon-xl text-muted-foreground" />
          <p className="text-muted-foreground">Could not load compatibility data.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </AppShell>
    );
  }

  const { overall, breakdown, badges, sharedStrengths, frictionPoints, workStyle, targetProfile, sourceProfile } = data;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto pb-28">

        {/* ── Header bar ─────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="icon-md text-foreground" />
          </button>
          <span className="text-sm font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Compatibility Analysis
          </span>
          <button
            className="p-1.5 -mr-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="icon-md text-foreground" />
          </button>
        </div>

        {/* ── Hero section ───────────────────────────────────────────────────── */}
        <div className="bg-muted/30 border-b border-border px-6 py-8">
          {/* Space-around row: source · score · target */}
          <div className="flex items-start justify-around">
            {/* Source user */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 rounded-lg ring-2 ring-border">
                <AvatarImage src={sourceProfile.avatarUrl ?? undefined} alt={sourceProfile.displayName} />
                <AvatarFallback className="rounded-lg text-base font-semibold bg-muted">
                  {sourceProfile.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold text-foreground max-w-[88px] text-center leading-tight truncate">
                  {sourceProfile.displayName}
                </span>
                <span className="text-2xs text-muted-foreground capitalize"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {sourceProfile.role}
                </span>
              </div>
            </div>

            {/* Donut score — center */}
            <DonutScore score={overall.score} />

            {/* Target user — accent ring */}
            <div className="flex flex-col items-center gap-3">
              <Link href={`/profiles/${targetProfile.id}`}>
                <Avatar className="h-20 w-20 rounded-lg ring-2 transition-opacity hover:opacity-90" style={{ '--tw-ring-color': '#22D3EE' } as React.CSSProperties}>
                  <AvatarImage src={targetProfile.avatarUrl ?? undefined} alt={targetProfile.displayName} />
                  <AvatarFallback className="rounded-lg text-base font-semibold" style={{ background: 'rgba(34,211,238,0.12)', color: '#22D3EE' }}>
                    {targetProfile.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold text-foreground max-w-[88px] text-center leading-tight truncate">
                  {targetProfile.displayName}
                </span>
                <span className="text-2xs text-muted-foreground capitalize"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {targetProfile.role}
                </span>
                <Link href={`/profiles/${targetProfile.id}`}
                  className="flex items-center gap-0.5 text-2xs mt-0.5 transition-colors"
                  style={{ color: '#22D3EE' }}>
                  <ExternalLink className="h-2.5 w-2.5" />
                  View profile
                </Link>
              </div>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="flex flex-col items-center gap-1.5 mt-4">
            <span className="text-2xs text-muted-foreground"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {overall.confidence}% CONFIDENCE
            </span>
            <div className="w-28 h-0.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-muted-foreground/60 transition-all duration-1000"
                style={{ width: `${overall.confidence}%` }} />
            </div>
          </div>

          {/* Compatibility badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {badges.map(b => <CompatBadge key={b} label={b} />)}
            </div>
          )}
        </div>

        {/* ── Content sections ───────────────────────────────────────────────── */}
        <div className="px-4 space-y-8 pt-6">

          {/* 01. CORE COMPATIBILITY */}
          <div className="space-y-3">
            <SectionLabel label="01. CORE COMPATIBILITY" />
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              {breakdown.map(item => <FactorRow key={item.key} item={item} />)}
            </div>
          </div>

          {/* 02. SHARED STRENGTHS */}
          {sharedStrengths.length > 0 && (
            <div className="space-y-3">
              <SectionLabel label="02. SHARED STRENGTHS" />
              <div className="flex flex-wrap gap-2">
                {sharedStrengths.map(s => <TraitChip key={s.label} item={s} />)}
              </div>
            </div>
          )}

          {/* 03. POTENTIAL FRICTION POINTS */}
          {frictionPoints.length > 0 && (
            <div className="space-y-3">
              <SectionLabel label="03. POTENTIAL FRICTION POINTS" />
              <FrictionSection points={frictionPoints} />
            </div>
          )}

          {/* 04. WORK STYLE OVERLAP */}
          <div className="space-y-3">
            <SectionLabel label="04. WORK STYLE OVERLAP" />
            <div className="bg-card border border-border rounded-lg p-4">
              <WorkStyleLineChart data={workStyle} />
            </div>
          </div>

          {/* 05. WHY THIS MATCH */}
          {data.reasons.length > 0 && (
            <div className="space-y-3">
              <SectionLabel label="05. WHY THIS MATCH" />
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                {data.reasons.map(r => (
                  <div key={r} className="flex items-start gap-2.5">
                    <CheckCircle className="icon-sm mt-0.5 shrink-0" style={{ color: '#4ADE80' }} />
                    <span className="text-sm text-muted-foreground leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Sticky action bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border px-4 py-3">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="gap-1.5 text-sm"
            onClick={handleShortlist}
          >
            <Bookmark className={`icon-sm ${shortlisted ? 'fill-current text-amber-400' : ''}`} />
            {shortlisted ? 'Saved' : 'Shortlist'}
          </Button>
          <Link href={`/messages?to=${targetUserId}`} className="contents">
            <Button variant="outline" className="gap-1.5 text-sm w-full">
              <MessageCircle className="icon-sm" />
              Message
            </Button>
          </Link>
          <Button
            className="gap-1.5 font-bold text-black text-sm"
            style={{ background: '#22D3EE' }}
            onClick={handlePropose}
            disabled={connectMutation.isPending}
          >
            <Send className="icon-sm" />
            Collaborate
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
