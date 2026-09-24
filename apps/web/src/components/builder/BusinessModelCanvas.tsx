'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BuilderStageHeader, BUILDER_BTN, BUILDER_STAT, BUILDER_STAT_LABEL, useBuilderPrimaryText } from './BuilderStageChrome';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';

interface BMCSection {
  id: keyof BMCData;
  titleKey: 'bmc_partners' | 'bmc_activities' | 'bmc_resources' | 'bmc_value' | 'bmc_rel' | 'bmc_channels' | 'bmc_segments' | 'bmc_costs' | 'bmc_revenue';
  descKey: 'bmc_partners_desc' | 'bmc_activities_desc' | 'bmc_resources_desc' | 'bmc_value_desc' | 'bmc_rel_desc' | 'bmc_channels_desc' | 'bmc_segments_desc' | 'bmc_costs_desc' | 'bmc_revenue_desc';
  glyph: CfbGlyphName;
  content: string;
}

interface BMCData {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

interface BusinessModelCanvasProps {
  onSave?: (data: BMCData) => void;
  initialData?: Partial<BMCData>;
}

const BMC_SECTIONS: Omit<BMCSection, 'content'>[] = [
  { id: 'keyPartners', titleKey: 'bmc_partners', descKey: 'bmc_partners_desc', glyph: 'people' },
  { id: 'keyActivities', titleKey: 'bmc_activities', descKey: 'bmc_activities_desc', glyph: 'flag' },
  { id: 'keyResources', titleKey: 'bmc_resources', descKey: 'bmc_resources_desc', glyph: 'briefcase' },
  { id: 'valuePropositions', titleKey: 'bmc_value', descKey: 'bmc_value_desc', glyph: 'spark' },
  { id: 'customerRelationships', titleKey: 'bmc_rel', descKey: 'bmc_rel_desc', glyph: 'messages' },
  { id: 'channels', titleKey: 'bmc_channels', descKey: 'bmc_channels_desc', glyph: 'discover' },
  { id: 'customerSegments', titleKey: 'bmc_segments', descKey: 'bmc_segments_desc', glyph: 'profile' },
  { id: 'costStructure', titleKey: 'bmc_costs', descKey: 'bmc_costs_desc', glyph: 'wallet' },
  { id: 'revenueStreams', titleKey: 'bmc_revenue', descKey: 'bmc_revenue_desc', glyph: 'chart' },
];

/** Classic Osterwalder canvas. Named areas — not three stretched columns
 *  of `h-full` cards, which overlapped the insights strip below. */
const BMC_AREA: Record<BMCSection['id'], string> = {
  keyPartners: 'lg:[grid-area:partners]',
  keyActivities: 'lg:[grid-area:activities]',
  keyResources: 'lg:[grid-area:resources]',
  valuePropositions: 'lg:[grid-area:value]',
  customerRelationships: 'lg:[grid-area:rel]',
  channels: 'lg:[grid-area:channels]',
  customerSegments: 'lg:[grid-area:segments]',
  costStructure: 'lg:[grid-area:costs]',
  revenueStreams: 'lg:[grid-area:revenue]',
};

export function BusinessModelCanvas({ onSave, initialData }: BusinessModelCanvasProps) {
  const t = useBuilderPrimaryText();
  const [sections, setSections] = useState<BMCSection[]>(
    BMC_SECTIONS.map((section) => ({
      ...section,
      content: initialData?.[section.id] || '',
    })),
  );

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const completedSections = sections.filter((section) => section.content.trim().length > 0).length;
    setCompletionPercentage((completedSections / sections.length) * 100);
  }, [sections]);

  const handleSectionChange = (sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, content } : section)),
    );
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSections((prev) =>
        prev.map((section) => {
          let generatedContent = '';
          switch (section.id) {
            case 'keyPartners':
              generatedContent = 'Technology providers, distribution partners, strategic alliances, suppliers';
              break;
            case 'keyActivities':
              generatedContent = 'Product development, marketing, customer support, sales, partnerships';
              break;
            case 'keyResources':
              generatedContent = 'Technical team, brand IP, customer data, partnerships, funding';
              break;
            case 'valuePropositions':
              generatedContent = 'Time-saving solution, cost reduction, improved efficiency, better user experience';
              break;
            case 'customerRelationships':
              generatedContent = 'Self-service, automated support, community building, personal assistance';
              break;
            case 'channels':
              generatedContent = 'Direct website, app stores, social media, partner networks, content marketing';
              break;
            case 'customerSegments':
              generatedContent = 'Small businesses, startups, enterprise customers, specific user personas';
              break;
            case 'costStructure':
              generatedContent = 'Development costs, marketing expenses, operational overhead, partnership fees';
              break;
            case 'revenueStreams':
              generatedContent = 'Subscription fees, transaction fees, premium features, enterprise licenses';
              break;
          }
          return { ...section, content: generatedContent };
        }),
      );
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    const bmcData: BMCData = sections.reduce((acc, section) => {
      acc[section.id] = section.content;
      return acc;
    }, {} as BMCData);
    onSave?.(bmcData);
  };

  const getConfidenceLevel = (content: string) => {
    if (content.length === 0) return 'low';
    if (content.length < 50) return 'medium';
    return 'high';
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-status-success';
      case 'medium':
        return 'bg-status-warning';
      default:
        return 'bg-muted-foreground/30';
    }
  };

  const renderSection = (section: BMCSection) => {
    const confidence = getConfidenceLevel(section.content);
    return (
      <Card
        key={section.id}
        className={cn('flex min-h-0 min-w-0 flex-col overflow-hidden', BMC_AREA[section.id])}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <CfbGlyph name={section.glyph} className="icon-sm shrink-0 text-muted-foreground" />
              <CardTitle className="truncate text-base">
                <BilingualText en={builderEn(section.titleKey)} el={builderEl(section.titleKey)} compact />
              </CardTitle>
            </div>
            <div className={cn('h-2 w-2 shrink-0 rounded-full', getConfidenceColor(confidence))} />
          </div>
          <p className="text-xs text-muted-foreground">
            <BilingualText en={builderEn(section.descKey)} el={builderEl(section.descKey)} />
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col pt-0">
          <Textarea
            placeholder={t(builderEn('bmc_describe'), builderEl('bmc_describe'))}
            value={section.content}
            onChange={(e) => handleSectionChange(section.id, e.target.value)}
            className="min-h-[80px] flex-1 resize-none rounded-xl"
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <BuilderStageHeader
        glyph="target"
        titleEn={builderEn('bmc_title')}
        titleEl={builderEl('bmc_title')}
        subtitleEn={builderEn('bmc_sub')}
        subtitleEl={builderEl('bmc_sub')}
        completion={completionPercentage}
        askPrompt="Help me fill the Business Model Canvas from my Idea Core. Start with value propositions and customer segments, then partners, channels, and revenue."
        extraActions={
          <>
            <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={generateWithAI} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="spark" className="icon-sm mr-2" />}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_generate')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_generate')}
                compact
              />
            </Button>
            <Button size="sm" className={BUILDER_BTN} onClick={handleSave}>
              <Save className="icon-sm mr-2" />
              <BilingualText en={builderEn('bmc_save')} el={builderEl('bmc_save')} compact />
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            <BilingualText en={builderEn('bmc_complete')} el={builderEl('bmc_complete')} compact />
          </span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-1.5" />
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          'lg:grid-cols-5 lg:grid-rows-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(10rem,auto)]',
          "lg:[grid-template-areas:'partners_activities_value_rel_segments'_'partners_resources_value_channels_segments'_'costs_costs_costs_revenue_revenue']",
        )}
      >
        {sections.map(renderSection)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <BilingualText en={builderEn('bmc_insights')} el={builderEl('bmc_insights')} compact />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
            <div className={cn(BUILDER_STAT, STATUS.info.text)}>
              {sections.filter((s) => getConfidenceLevel(s.content) === 'high').length}
            </div>
            <div className={BUILDER_STAT_LABEL}>
              <BilingualText en={builderEn('bmc_well')} el={builderEl('bmc_well')} compact />
            </div>
          </div>
          <div className="text-center">
            <div className={cn(BUILDER_STAT, STATUS.warning.text)}>
              {sections.filter((s) => getConfidenceLevel(s.content) === 'medium').length}
            </div>
            <div className={BUILDER_STAT_LABEL}>
              <BilingualText en={builderEn('bmc_refine')} el={builderEl('bmc_refine')} compact />
            </div>
          </div>
          <div className="text-center">
            <div className={cn(BUILDER_STAT, STATUS.danger.text)}>
              {sections.filter((s) => getConfidenceLevel(s.content) === 'low').length}
            </div>
            <div className={BUILDER_STAT_LABEL}>
                <BilingualText en={builderEn('bmc_missing')} el={builderEl('bmc_missing')} compact />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
