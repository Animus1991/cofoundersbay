'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Save, RefreshCw } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { BUILDER_BTN, BuilderStageHeader, useBuilderPrimaryText } from './BuilderStageChrome';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { bilingualAria } from '@/lib/i18n/format';

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
  const t = useBuilderPrimaryText();
  const [data, setData] = useState<IdeaCoreData>({
    problemStatement: '',
    targetAudience: '',
    solution: '',
    uniqueValue: '',
    timing: '',
    assumptions: [],
    painPoints: [],
    marketSize: '',
    ...initialData,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const fields = [
      data.problemStatement,
      data.targetAudience,
      data.solution,
      data.uniqueValue,
      data.timing,
      data.marketSize,
    ];
    const completedFields = fields.filter((field) => field.trim().length > 0).length;
    setCompletionPercentage((completedFields / fields.length) * 100);
  }, [data]);

  const handleFieldChange = (field: keyof IdeaCoreData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssumptionChange = (index: number, value: string) => {
    const newAssumptions = [...data.assumptions];
    newAssumptions[index] = value;
    setData((prev) => ({ ...prev, assumptions: newAssumptions }));
  };

  const addAssumption = () => {
    setData((prev) => ({ ...prev, assumptions: [...prev.assumptions, ''] }));
  };

  const removeAssumption = (index: number) => {
    setData((prev) => ({
      ...prev,
      assumptions: prev.assumptions.filter((_, i) => i !== index),
    }));
  };

  const handlePainPointChange = (index: number, value: string) => {
    const newPainPoints = [...data.painPoints];
    newPainPoints[index] = value;
    setData((prev) => ({ ...prev, painPoints: newPainPoints }));
  };

  const addPainPoint = () => {
    setData((prev) => ({ ...prev, painPoints: [...prev.painPoints, ''] }));
  };

  const removePainPoint = (index: number) => {
    setData((prev) => ({
      ...prev,
      painPoints: prev.painPoints.filter((_, i) => i !== index),
    }));
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setData((prev) => ({
        ...prev,
        assumptions: [
          'Target customers are willing to pay for this solution',
          'Market timing is optimal for entry',
          'Technology can solve the core problem effectively',
          'Team can execute the business model',
        ],
        painPoints: [
          'Current solutions are too expensive',
          'Existing tools lack key features',
          'Market underserved by current offerings',
        ],
      }));
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onSave?.(data);
  };

  return (
    <div className="space-y-6">
      <BuilderStageHeader
        glyph="spark"
        titleEn={builderEn('tab_idea')}
        titleEl={builderEl('tab_idea')}
        subtitleEn={builderEn('idea_sub')}
        subtitleEl={builderEl('idea_sub')}
        completion={completionPercentage}
        askPrompt="Help me sharpen the Idea Core: problem, audience, solution, unique value, and why now. Draft the weakest empty field first."
        extraActions={
          <>
            <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={generateWithAI} disabled={isGenerating}>
              {isGenerating ? (
                <RefreshCw className="icon-sm mr-2 animate-spin" />
              ) : (
                <CfbGlyph name="spark" className="icon-sm mr-2" />
              )}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_assist')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_assist')}
                compact
              />
            </Button>
            <Button size="sm" className={BUILDER_BTN} onClick={handleSave}>
              <Save className="icon-sm mr-2" />
              <BilingualText en={builderEn('save')} el={builderEl('save')} compact />
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            <BilingualText en={builderEn('tab_idea')} el={builderEl('tab_idea')} compact />{' '}
            <BilingualText en={builderEn('stage_complete')} el={builderEl('stage_complete')} compact />
          </span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-1.5" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CfbGlyph name="target" className="icon-md" />
                <BilingualText en={builderEn('idea_problem_card')} el={builderEl('idea_problem_card')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="problem">
                  <BilingualText en={builderEn('idea_problem_label')} el={builderEl('idea_problem_label')} compact />
                </Label>
                <Textarea
                  id="problem"
                  placeholder={t(builderEn('idea_problem_ph'), builderEl('idea_problem_ph'))}
                  value={data.problemStatement}
                  onChange={(e) => handleFieldChange('problemStatement', e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="audience">
                  <BilingualText en={builderEn('idea_audience')} el={builderEl('idea_audience')} compact />
                </Label>
                <Input
                  id="audience"
                  placeholder={t(builderEn('idea_audience_ph'), builderEl('idea_audience_ph'))}
                  value={data.targetAudience}
                  onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="market">
                  <BilingualText en={builderEn('idea_market')} el={builderEl('idea_market')} compact />
                </Label>
                <Input
                  id="market"
                  placeholder={t(builderEn('idea_market_ph'), builderEl('idea_market_ph'))}
                  value={data.marketSize}
                  onChange={(e) => handleFieldChange('marketSize', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CfbGlyph name="chart" className="icon-md" />
                <BilingualText en={builderEn('idea_solution_card')} el={builderEl('idea_solution_card')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="solution">
                  <BilingualText en={builderEn('idea_solution')} el={builderEl('idea_solution')} compact />
                </Label>
                <Textarea
                  id="solution"
                  placeholder={t(builderEn('idea_solution_ph'), builderEl('idea_solution_ph'))}
                  value={data.solution}
                  onChange={(e) => handleFieldChange('solution', e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="unique">
                  <BilingualText en={builderEn('idea_uvp')} el={builderEl('idea_uvp')} compact />
                </Label>
                <Textarea
                  id="unique"
                  placeholder={t(builderEn('idea_uvp_ph'), builderEl('idea_uvp_ph'))}
                  value={data.uniqueValue}
                  onChange={(e) => handleFieldChange('uniqueValue', e.target.value)}
                  className="min-h-[80px] rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="timing">
                  <BilingualText en={builderEn('idea_why_now')} el={builderEl('idea_why_now')} compact />
                </Label>
                <Textarea
                  id="timing"
                  placeholder={t(builderEn('idea_why_now_ph'), builderEl('idea_why_now_ph'))}
                  value={data.timing}
                  onChange={(e) => handleFieldChange('timing', e.target.value)}
                  className="min-h-[80px] rounded-xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <BilingualText en={builderEn('idea_assumptions')} el={builderEl('idea_assumptions')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.assumptions.map((assumption, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={t(builderEn('idea_assumption_ph'), builderEl('idea_assumption_ph'))}
                    value={assumption}
                    onChange={(e) => handleAssumptionChange(index, e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeAssumption(index)}
                    aria-label={bilingualAria(builderEn('remove'), builderEl('remove'))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAssumption} className={`w-full ${BUILDER_BTN}`}>
                <BilingualText en={builderEn('idea_add_assumption')} el={builderEl('idea_add_assumption')} compact />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <BilingualText en={builderEn('idea_pains')} el={builderEl('idea_pains')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.painPoints.map((painPoint, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={t(builderEn('idea_pain_ph'), builderEl('idea_pain_ph'))}
                    value={painPoint}
                    onChange={(e) => handlePainPointChange(index, e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removePainPoint(index)}
                    aria-label={bilingualAria(builderEn('remove'), builderEl('remove'))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPainPoint} className={`w-full ${BUILDER_BTN}`}>
                <BilingualText en={builderEn('idea_add_pain')} el={builderEl('idea_add_pain')} compact />
              </Button>
            </CardContent>
          </Card>

          {isGenerating && (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="icon-xl mx-auto mb-4 animate-spin text-primary-accessible" />
                <p className="text-sm text-muted-foreground">
                  <BilingualText en={builderEn('ai_analyzing')} el={builderEl('ai_analyzing')} />
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
