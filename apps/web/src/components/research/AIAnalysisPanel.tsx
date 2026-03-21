'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles, Brain, Tag, Lightbulb, GitBranch, AlertCircle, Loader2, X, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { analyzeResearchBoard, type ResearchBoardAnalysis } from '@/lib/api';

interface AIAnalysisPanelProps {
  boardId: string;
  onClose: () => void;
  onApplyTags?: (tags: string[]) => void;
}

function Section({ icon: Icon, title, items, color = 'text-primary', defaultOpen = true }: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('h-3.5 w-3.5', color)} />
          <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <ul className="p-3 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
              <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', color.replace('text-', 'bg-'))} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConnectionItem({ conn }: { conn: { from: string; to: string; reason: string } }) {
  return (
    <li className="flex flex-col gap-0.5 py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className="text-primary">{conn.from}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-primary">{conn.to}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{conn.reason}</p>
    </li>
  );
}

export function AIAnalysisPanel({ boardId, onClose, onApplyTags }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<ResearchBoardAnalysis | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeResearchBoard(boardId),
    onSuccess: (data) => setAnalysis(data.analysis),
  });

  const handleAnalyze = useCallback(() => {
    analyzeMutation.mutate();
  }, [analyzeMutation]);

  return (
    <div className="flex flex-col w-full max-w-sm bg-card border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">AI Board Analysis</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '520px' }}>
        {!analysis && !analyzeMutation.isPending ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary/70" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Analyze your research board</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI will identify themes, extract insights, suggest connections, and highlight gaps in your research.
              </p>
            </div>
            <Button onClick={handleAnalyze} className="gap-2 w-full">
              <Sparkles className="h-4 w-4" />
              Run Analysis
            </Button>
          </div>
        ) : analyzeMutation.isPending ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
              <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Analyzing your board…</p>
              <p className="text-xs text-muted-foreground">Identifying themes, insights, and connections</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="p-4 space-y-3">
            {/* Summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Summary</p>
              <p className="text-sm leading-relaxed text-foreground/90">{analysis.summary}</p>
            </div>

            <Section icon={Tag} title="Key Themes" items={analysis.themes} color="text-blue-500" />
            <Section icon={Lightbulb} title="Insights" items={analysis.insights} color="text-yellow-500" />
            <Section icon={AlertCircle} title="Research Gaps" items={analysis.gaps} color="text-orange-500" defaultOpen={false} />

            {/* Connections */}
            {analysis.connections.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30">
                  <GitBranch className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Connections</span>
                </div>
                <ul className="px-3">
                  {analysis.connections.map((conn, i) => <ConnectionItem key={i} conn={conn} />)}
                </ul>
              </div>
            )}

            {/* Suggested Tags */}
            {analysis.suggestedTags.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Suggested Tags</span>
                  </div>
                  {onApplyTags && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-primary hover:text-primary/80 px-2"
                      onClick={() => onApplyTags(analysis.suggestedTags)}
                    >
                      Apply all
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.suggestedTags.map((tag, i) => (
                    <span key={i} className="text-xs bg-secondary border rounded-full px-2 py-0.5 cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {analyzeMutation.isError && (
          <div className="p-4">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Analysis failed. Please try again.</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {analysis && (
        <div className="px-4 py-3 border-t bg-card/60 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">AI-powered analysis</span>
          <Button variant="ghost" size="sm" onClick={handleAnalyze} disabled={analyzeMutation.isPending} className="gap-1.5 h-7 text-xs">
            <RefreshCw className="h-3 w-3" />
            Re-analyze
          </Button>
        </div>
      )}
    </div>
  );
}
