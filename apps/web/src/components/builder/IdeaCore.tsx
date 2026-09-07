'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Save,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeaCoreData {
  problemStatement: string;
  targetAudience: string;
  solution: string;
  uniqueValue: string;
  timing: string;
  assumptions: string[];
  painPoints: string[];
  marketSize: string;
}

interface IdeaCoreProps {
  onSave?: (data: IdeaCoreData) => void;
  initialData?: Partial<IdeaCoreData>;
}

export function IdeaCore({ onSave, initialData }: IdeaCoreProps) {
  const [data, setData] = useState<IdeaCoreData>({
    problemStatement: '',
    targetAudience: '',
    solution: '',
    uniqueValue: '',
    timing: '',
    assumptions: [],
    painPoints: [],
    marketSize: '',
    ...initialData
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    // Calculate completion percentage
    const fields = [
      data.problemStatement,
      data.targetAudience,
      data.solution,
      data.uniqueValue,
      data.timing,
      data.marketSize
    ];
    const completedFields = fields.filter(field => field.trim().length > 0).length;
    setCompletionPercentage((completedFields / fields.length) * 100);
  }, [data]);

  const handleFieldChange = (field: keyof IdeaCoreData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssumptionChange = (index: number, value: string) => {
    const newAssumptions = [...data.assumptions];
    newAssumptions[index] = value;
    setData(prev => ({ ...prev, assumptions: newAssumptions }));
  };

  const addAssumption = () => {
    setData(prev => ({ ...prev, assumptions: [...prev.assumptions, ''] }));
  };

  const removeAssumption = (index: number) => {
    setData(prev => ({ 
      ...prev, 
      assumptions: prev.assumptions.filter((_, i) => i !== index)
    }));
  };

  const handlePainPointChange = (index: number, value: string) => {
    const newPainPoints = [...data.painPoints];
    newPainPoints[index] = value;
    setData(prev => ({ ...prev, painPoints: newPainPoints }));
  };

  const addPainPoint = () => {
    setData(prev => ({ ...prev, painPoints: [...prev.painPoints, ''] }));
  };

  const removePainPoint = (index: number) => {
    setData(prev => ({ 
      ...prev, 
      painPoints: prev.painPoints.filter((_, i) => i !== index)
    }));
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        assumptions: [
          'Target customers are willing to pay for this solution',
          'Market timing is optimal for entry',
          'Technology can solve the core problem effectively',
          'Team can execute the business model'
        ],
        painPoints: [
          'Current solutions are too expensive',
          'Existing tools lack key features',
          'Market underserved by current offerings'
        ]
      }));
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onSave?.(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Idea Core</h2>
            <p className="text-sm leading-snug text-muted-foreground">
              Define the fundamental problem, solution, and market opportunity
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            {completionPercentage.toFixed(0)}% Complete
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="min-h-10"
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Assist
          </Button>
          <Button size="sm" className="min-h-10" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Idea Core Completion</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Problem Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="problem">What problem are you solving?</Label>
                <Textarea
                  id="problem"
                  placeholder="Describe the core problem your target customers face..."
                  value={data.problemStatement}
                  onChange={(e) => handleFieldChange('problemStatement', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="audience">Who are you solving it for?</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Small business owners, Students, Developers..."
                  value={data.targetAudience}
                  onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="market">Market Size</Label>
                <Input
                  id="market"
                  placeholder="e.g., $10M TAM, $2M SAM, $500K SOM"
                  value={data.marketSize}
                  onChange={(e) => handleFieldChange('marketSize', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Solution & Value
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="solution">Your Solution</Label>
                <Textarea
                  id="solution"
                  placeholder="How do you solve this problem?"
                  value={data.solution}
                  onChange={(e) => handleFieldChange('solution', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="unique">Unique Value Proposition</Label>
                <Textarea
                  id="unique"
                  placeholder="What makes your solution unique or better?"
                  value={data.uniqueValue}
                  onChange={(e) => handleFieldChange('uniqueValue', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="timing">Why Now?</Label>
                <Textarea
                  id="timing"
                  placeholder="Why is this the right time for this solution?"
                  value={data.timing}
                  onChange={(e) => handleFieldChange('timing', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.assumptions.map((assumption, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Enter a key assumption..."
                    value={assumption}
                    onChange={(e) => handleAssumptionChange(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeAssumption(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                onClick={addAssumption}
                className="w-full"
              >
                + Add Assumption
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pain Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.painPoints.map((painPoint, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Enter a pain point..."
                    value={painPoint}
                    onChange={(e) => handlePainPointChange(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removePainPoint(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                onClick={addPainPoint}
                className="w-full"
              >
                + Add Pain Point
              </Button>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {isGenerating && (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your idea and generating insights...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
