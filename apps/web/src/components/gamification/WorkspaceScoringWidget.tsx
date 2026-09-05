import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, MessageSquare, Zap } from 'lucide-react';
import { useWorkspaceScoring } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WorkspaceScoringWidgetProps {
  workspaceId: string;
}

export function WorkspaceScoringWidget({ workspaceId }: WorkspaceScoringWidgetProps) {
  const { readiness, momentum, myContribution, mentorMetrics, isLoading } = useWorkspaceScoring(workspaceId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Workspace Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Workspace Scoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Readiness Score */}
        {readiness && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Readiness Score</span>
              </div>
              <Badge variant={getScoreBadgeVariant(readiness.score)}>
                {readiness.score}/100
              </Badge>
            </div>
            <Progress value={readiness.score} className="h-2" />
            
            {/* Dimension breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <ScoreDimension label="Problem" score={readiness.problemClarity} />
              <ScoreDimension label="Solution" score={readiness.solutionClarity} />
              <ScoreDimension label="Market" score={readiness.marketUnderstanding} />
              <ScoreDimension label="Product" score={readiness.productDefinition} />
              <ScoreDimension label="Team" score={readiness.teamCompleteness} />
              <ScoreDimension label="Execution" score={readiness.executionReadiness} />
              <ScoreDimension label="Validation" score={readiness.validationScore} />
              <ScoreDimension label="Artifacts" score={readiness.artifactCompleteness} />
            </div>
          </div>
        )}

        {/* Team Momentum */}
        {momentum && (
          <div className="space-y-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Team Momentum</span>
              </div>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {momentum.classification}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Score</div>
                <div className="font-semibold text-lg">{momentum.score}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Velocity</div>
                <div className="font-semibold text-lg">{momentum.velocity.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Collab</div>
                <div className="font-semibold text-lg">{(momentum.collaborationDensity * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* My Contribution */}
        {myContribution && (
          <div className="space-y-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">My Contribution</span>
              </div>
              <Badge variant="outline">
                {myContribution.score}/100
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="font-semibold">{myContribution.breakdown.artifactsCreated}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Improved</div>
                <div className="font-semibold">{myContribution.breakdown.artifactsImproved}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Feedback</div>
                <div className="font-semibold">{myContribution.breakdown.feedbackGiven}</div>
              </div>
            </div>
          </div>
        )}

        {/* Mentor Metrics */}
        {mentorMetrics && mentorMetrics.feedbackCount > 0 && (
          <div className="space-y-2 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Mentor Loop</span>
              </div>
              <Badge variant="outline">
                {(mentorMetrics.appliedFeedbackRate * 100).toFixed(0)}% applied
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Received</div>
                <div className="font-semibold">{mentorMetrics.feedbackCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Applied</div>
                <div className="font-semibold">{mentorMetrics.appliedFeedbackCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="font-semibold">{mentorMetrics.unresolvedFeedback}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreDimension({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        'font-medium',
        score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
      )}>
        {score}
      </span>
    </div>
  );
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 70) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}
