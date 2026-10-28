'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { MATCH_SCORE_PARTIAL as PARTIAL, MATCH_SCORE_WEIGHTS as WEIGHT, TEAM_SKILLS_FIT as SKILLS } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STARTUP_STAGES } from '@/lib/founder-options';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

type Part = { key: string; max: number; en: string; el: string; howEn: string; howEl: string };

const pts = (share: number, of: number) => Math.floor(of * share);
const pct = (share: number) => Math.round(share * 100);

/**
 * Every part of the number on a match card, with its points (docs §110).
 * Built from the engine's own constants (`MATCH_SCORE_WEIGHTS`,
 * `MATCH_SCORE_PARTIAL`, `TEAM_SKILLS_FIT`), so the page and the score
 * cannot drift apart; a change of weight changes this text.
 */
export function matchScoreParts(): Part[] {
  // The stage names as profile edit offers them, in their order.
  const stagesEn = STARTUP_STAGES.map((s) => s.label).join(', ');
  const stagesEl = STARTUP_STAGES.map((s) => s.labelEl).join(', ');
  return [
    {
      key: 'role', max: WEIGHT.roleComplementarity, en: 'Roles', el: 'Ρόλοι',
      howEn: `Full points for roles that complete each other: a founder with a founder, a mentor or an investor. Between founders, ${pts(PARTIAL.roleNotSought, WEIGHT.roleComplementarity)} when they do not fill what you look for ("Looking for"). ${pts(PARTIAL.roleOther, WEIGHT.roleComplementarity)} for the same or unrelated roles.`,
      howEl: `Πλήρεις πόντοι για ρόλους που συμπληρώνονται: ιδρυτής με ιδρυτή, μέντορα ή επενδυτή. Ανάμεσα σε ιδρυτές, ${pts(PARTIAL.roleNotSought, WEIGHT.roleComplementarity)} όταν δεν καλύπτει αυτό που ψάχνετε («Ψάχνω»). ${pts(PARTIAL.roleOther, WEIGHT.roleComplementarity)} για ίδιους ή άσχετους ρόλους.`,
    },
    {
      key: 'skills', max: WEIGHT.skillsOverlap, en: 'Skills, as a team', el: 'Δεξιότητες, ως ομάδα',
      howEn: `${pct(SKILLS.commonWeight)}% common ground (full at ${SKILLS.sharedForFull} shared skills) and ${pct(SKILLS.addsWeight)}% what they add (full when they bring a family you lack, technical, business or design, or ${SKILLS.addedForFull} new skills). No skills listed: 0.`,
      howEl: `${pct(SKILLS.commonWeight)}% κοινό έδαφος (πλήρες με ${SKILLS.sharedForFull} κοινές δεξιότητες) και ${pct(SKILLS.addsWeight)}% ό,τι προσθέτει (πλήρες όταν φέρνει οικογένεια που σας λείπει, τεχνική, επιχειρηματική ή σχεδιαστική, ή ${SKILLS.addedForFull} νέες δεξιότητες). Χωρίς δεξιότητες: 0.`,
    },
    {
      key: 'stage', max: WEIGHT.stageAlignment, en: 'Stage', el: 'Στάδιο',
      howEn: `Same stage: all ${WEIGHT.stageAlignment}. One stage apart (${stagesEn}): ${pts(PARTIAL.stageAdjacent, WEIGHT.stageAlignment)}.`,
      howEl: `Ίδιο στάδιο: και οι ${WEIGHT.stageAlignment}. Ένα στάδιο απόσταση (${stagesEl}): ${pts(PARTIAL.stageAdjacent, WEIGHT.stageAlignment)}.`,
    },
    {
      key: 'commitment', max: WEIGHT.commitmentAlignment, en: 'Time commitment', el: 'Δέσμευση χρόνου',
      howEn: `The same commitment: all ${WEIGHT.commitmentAlignment}. Both full time or both part time, in different words: ${pts(PARTIAL.commitmentCompatible, WEIGHT.commitmentAlignment)}.`,
      howEl: `Ίδια δέσμευση: και οι ${WEIGHT.commitmentAlignment}. Και οι δύο πλήρους ή και οι δύο μερικής απασχόλησης, με άλλα λόγια: ${pts(PARTIAL.commitmentCompatible, WEIGHT.commitmentAlignment)}.`,
    },
    {
      key: 'place', max: WEIGHT.locationProximity, en: 'Place', el: 'Τοποθεσία',
      howEn: 'The same or a nearby place.',
      howEl: 'Ίδια ή κοντινή τοποθεσία.',
    },
    {
      key: 'recent', max: WEIGHT.recencyBonus, en: 'Recent profile', el: 'Πρόσφατο προφίλ',
      howEn: `Their profile updated in the last 7 days: all ${WEIGHT.recencyBonus}; in the last 30: ${pts(PARTIAL.recentMonth, WEIGHT.recencyBonus)}.`,
      howEl: `Προφίλ ενημερωμένο τις τελευταίες 7 ημέρες: και οι ${WEIGHT.recencyBonus}· τις τελευταίες 30: ${pts(PARTIAL.recentMonth, WEIGHT.recencyBonus)}.`,
    },
  ];
}

/**
 * "How the score works" beside the list's tools, as the AI Studio prototype
 * places it: the six parts of the number, with their points, in one dialog.
 */
export function MatchScoreExplainer({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const parts = matchScoreParts();
  const total = parts.reduce((n, p) => n + p.max, 0);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={bilingualAria('How the score works', 'Πώς βγαίνει το σκορ')}
        className={cn('flex h-10 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground', className)}
        data-score-explainer=""
      >
        <BarChart3 className="icon-sm" aria-hidden="true" />
        <span className="hidden sm:inline"><BilingualText en="How the score works" el="Πώς βγαίνει το σκορ" compact /></span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(88dvh,760px)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle><BilingualText en="How the score works" el="Πώς βγαίνει το σκορ" /></DialogTitle>
            <DialogDescription>
              <BilingualText
                en={`Six parts add up to ${total}, from what the two profiles say. The same number appears on the card, the match page, the comparison and the weekly email.`}
                el={`Έξι μέρη αθροίζονται έως ${total}, από όσα λένε τα δύο προφίλ. Ο ίδιος αριθμός εμφανίζεται στην κάρτα, στη σελίδα του ταιριάσματος, στη σύγκριση και στο εβδομαδιαίο email.`}
                wrap
              />
            </DialogDescription>
          </DialogHeader>
          <dl className="divide-y divide-border/60">
            {parts.map((part) => (
              <div key={part.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 py-2.5">
                <dt className="text-sm font-medium text-foreground"><BilingualText en={part.en} el={part.el} compact wrap /></dt>
                <dd className="row-span-2 self-start text-right text-sm font-semibold tabular-nums text-foreground">
                  <BilingualText en={`up to ${part.max}`} el={`έως ${part.max}`} compact />
                </dd>
                <dd className="text-xs leading-snug text-muted-foreground"><BilingualText en={part.howEn} el={part.howEl} wrap /></dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-snug text-muted-foreground">
            <BilingualText
              en="Not in the number: photos, age, gender or anything the two profiles do not say. Your working-style answers are shown beside a match as agreement, never added to it."
              el="Δεν μετρούν στον αριθμό: φωτογραφίες, ηλικία, φύλο ή οτιδήποτε δεν λένε τα δύο προφίλ. Οι απαντήσεις για τον τρόπο εργασίας εμφανίζονται δίπλα σε ένα ταίριασμα ως συμφωνία, χωρίς να προστίθενται."
              wrap
            />
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
