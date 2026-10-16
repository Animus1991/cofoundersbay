'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, Clock, Globe, DollarSign, Video, Users, Edit, Save, RefreshCw, Plus, X, ChevronDown,
} from 'lucide-react';
import { useStoredUser } from '@/hooks/useStoredUser';
import { PersonVerifiedBadge } from '@/components/commitments/PersonVerifiedBadge';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/useSession';
import { getMeProfile, getMentorDashboardStats, getMyMentorListing, saveMyMentorListing, type MentorListing } from '@/lib/api';
import { useFormDraft } from '@/lib/form-draft';
import { FormDraftNotice } from '@/components/common/FormDraftNotice';
import { centsToDollars, dollarsToCents, pickOptions, readFlag, readNumber, snapToStep } from '@/lib/listing-form';
import { qk, queryKeys } from '@/lib/query-keys';
import { useDemoData } from '@/contexts/DemoDataContext';
import { mentorDemoRating } from '@/lib/demo/mentor-world';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualInline } from '@/lib/i18n/format';
import { CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';

import { pressableProps } from '@/lib/pressable';
const INDUSTRIES = [
  'SaaS', 'Fintech', 'Healthtech', 'Edtech', 'Deep Tech', 'AI/ML',
  'E-commerce', 'Marketplace', 'Web3/Crypto', 'Climate Tech', 'AgriTech',
  'Developer Tools', 'Enterprise Software', 'Consumer Apps', 'Hardware',
];

const STARTUP_STAGES = ['Pre-idea', 'Idea', 'Validation', 'MVP', 'Early Revenue', 'Growth', 'Scale'];

const EXPERTISE_AREAS = [
  'Product Strategy', 'Fundraising', 'Go-to-Market', 'Team Building', 'Leadership',
  'Technical Architecture', 'Sales', 'Marketing', 'Operations', 'Finance', 'Legal',
  'Customer Development', 'Partnerships', 'International Expansion', 'Hiring',
];

const SESSION_FORMATS = ['video', 'in_person', 'async'];
const YEARS_STEPS = [1, 2, 3, 5, 7, 10, 15, 20];
const HOURS_STEPS = [1, 2, 3, 5, 8, 10, 15, 20];
const DURATION_STEPS = [15, 30, 45, 60, 90, 120];

/** "20+" is the last step of the years select; the API stores 20. */
const yearsToOption = (n: number | null | undefined) => {
  const step = typeof n === 'number' ? snapToStep(n, YEARS_STEPS) : null;
  return step === null ? '5' : step === 20 ? '20+' : String(step);
};
const stepToOption = (n: number | null | undefined, steps: readonly number[], fallback: string) => {
  const step = typeof n === 'number' ? snapToStep(n, steps) : null;
  return step === null ? fallback : String(step);
};

export default function MentorProfilePage() {
  // The preview's check is the real verification, not a constant.
  const me = useStoredUser();
  const { hasSession, mounted } = useSession();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  // Chips start empty for a listing that was never saved: a mentor's
  // industries are theirs to name, not ours to preselect.
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [sessionFormats, setSessionFormats] = useState<string[]>(['video']);
  const [isFree, setIsFree] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExp, setYearsExp] = useState('5');
  const [sessionDuration, setSessionDuration] = useState('30');
  const [hoursPerWeek, setHoursPerWeek] = useState('5');
  const [tagInput, setTagInput] = useState('');

  const { data: profile } = useQuery({
    queryKey: queryKeys.me.profile(),
    queryFn: getMeProfile,
    enabled: hasSession && mounted,
  });

  // The header said "4.9 (12 reviews)" for every mentor. It reads the rating
  // the mentor dashboard reads: the stats endpoint, or in the showcase the
  // reviews /mentor/reviews lists.
  const { showDemoData } = useDemoData();
  const { data: stats } = useQuery({
    queryKey: qk('mentorships', 'dashboard', 'mentor'),
    queryFn: getMentorDashboardStats,
    enabled: hasSession && mounted,
    retry: 0,
  });
  const demoRating = showDemoData ? mentorDemoRating() : null;
  const ratingValue = stats?.averageRating ?? demoRating?.average ?? null;
  const ratingNote = demoRating ? ` (${demoRating.count} reviews)` : '';

  const displayName = profile?.profile?.displayName ?? 'Mentor';
  const avatarUrl = profile?.profile?.avatarUrl;

  function toggleChip(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }

  // The saved listing fills the form once; later refetches leave edits alone.
  const listing = useQuery({
    queryKey: qk('mentors', 'listing', 'me'),
    queryFn: getMyMentorListing,
    enabled: hasSession && mounted,
    retry: 0,
  });
  const filledFromSaved = useRef(false);
  useEffect(() => {
    if (filledFromSaved.current || !listing.isFetched) return;
    filledFromSaved.current = true;
    const saved: MentorListing | null | undefined = listing.data;
    if (!saved) return;
    setHeadline(saved.headline ?? '');
    setBio(saved.bio ?? '');
    setSelectedIndustries(saved.industries ?? []);
    setSelectedStages(saved.startupStages ?? []);
    setSelectedExpertise(saved.skills ?? []);
    if (saved.sessionFormats?.length) setSessionFormats(saved.sessionFormats);
    if (typeof saved.isFree === 'boolean') setIsFree(saved.isFree);
    setHourlyRate(centsToDollars(saved.hourlyRate));
    if (typeof saved.isAcceptingRequests === 'boolean') setIsAccepting(saved.isAcceptingRequests);
    setYearsExp(yearsToOption(saved.yearsExperience));
    setSessionDuration(stepToOption(saved.sessionDuration, DURATION_STEPS, '30'));
    setHoursPerWeek(stepToOption(saved.hoursPerWeek, HOURS_STEPS, '5'));
  }, [listing.isFetched, listing.data]);

  // The assistant's draft (draft_mentor_listing) lands after the saved
  // values, so it is what the mentor reviews; nothing is saved until Save.
  const draft = useFormDraft(
    'mentor_listing',
    (f) => {
      if (typeof f.headline === 'string') setHeadline(f.headline.slice(0, 120));
      if (typeof f.bio === 'string') setBio(f.bio);
      const industries = pickOptions(typeof f.industries === 'string' ? f.industries : undefined, INDUSTRIES);
      if (industries.length) setSelectedIndustries(industries);
      const stages = pickOptions(typeof f.stages === 'string' ? f.stages : undefined, STARTUP_STAGES);
      if (stages.length) setSelectedStages(stages);
      const expertise = pickOptions(typeof f.expertise === 'string' ? f.expertise : undefined, EXPERTISE_AREAS);
      if (expertise.length) setSelectedExpertise(expertise);
      const formats = pickOptions(typeof f.sessionFormats === 'string' ? f.sessionFormats : undefined, SESSION_FORMATS);
      if (formats.length) setSessionFormats(formats);
      const hours = readNumber(f.hoursPerWeek);
      if (hours !== null) setHoursPerWeek(stepToOption(hours, HOURS_STEPS, hoursPerWeek));
      const duration = readNumber(f.sessionDuration);
      if (duration !== null) setSessionDuration(stepToOption(duration, DURATION_STEPS, sessionDuration));
      const years = readNumber(f.yearsExperience);
      if (years !== null) setYearsExp(yearsToOption(years));
      const free = readFlag(f.isFree);
      const rate = readNumber(f.hourlyRateUsd);
      if (free !== null) setIsFree(free);
      if (rate !== null && rate > 0) {
        setHourlyRate(String(rate));
        if (free === null) setIsFree(false);
      }
    },
    // Before mount the session is unknown: waiting keeps the saved values from landing on top of the draft.
    mounted && (!hasSession || listing.isFetched),
  );

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveMyMentorListing({
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        industries: selectedIndustries,
        startupStages: selectedStages,
        skills: selectedExpertise,
        // The directory's text search reads this line.
        expertiseSummary: selectedExpertise.join(', ') || null,
        sessionFormats: sessionFormats.filter((f): f is 'video' | 'in_person' | 'async' => SESSION_FORMATS.includes(f)),
        isFree,
        hourlyRate: isFree ? null : dollarsToCents(hourlyRate),
        isAcceptingRequests: isAccepting,
        yearsExperience: yearsExp === '20+' ? 20 : Number(yearsExp),
        sessionDuration: Number(sessionDuration),
        hoursPerWeek: Number(hoursPerWeek),
      });
      await queryClient.invalidateQueries({ queryKey: qk('mentors') });
      draft.dismiss();
      success('Mentor listing saved', 'Founders searching for mentors see these details.');
    } catch (err) {
      error('Could not save your mentor listing', err instanceof Error ? err.message : 'Try again in a moment.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!mounted) {
    return (
      <AppShell showHelp>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showHelp
      actions={
        <>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="mr-2 icon-sm animate-spin" aria-hidden="true" /> : <Save className="mr-2 icon-sm" aria-hidden="true" />}
            <BilingualText en="Save Profile" el="Αποθήκευση προφίλ" compact />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <FormDraftNotice filled={draft.filled} prompt={draft.prompt} onDismiss={draft.dismiss} />
        {/* Preview Card */}
        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardContent className="space-y-3">
            {/* The preview reads like a person's card elsewhere: the circle,
                the name over the headline, and the facts on its edge. */}
            <CardHead
              mark={(
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              titleAs="h2"
              title={(
                <span className="inline-flex flex-wrap items-center gap-2">
                  {displayName}
                  <PersonVerifiedBadge userId={me?.id ?? ''} />
                </span>
              )}
              subtitle={headline || <BilingualText en="Add your headline below…" el="Προσθέστε τον τίτλο σας παρακάτω…" compact />}
              aside={<Badge variant="secondary" className="text-xs"><BilingualText en="Mentor" el="Μέντορας" compact /></Badge>}
            />
            <FactLine
              items={[
                <span key="rating" data-keep-icon="" className="inline-flex items-center gap-1">
                  <Star className="icon-sm text-status-warning" aria-hidden="true" />
                  {ratingValue != null
                    ? <BilingualText en={`${ratingValue.toFixed(1)}${ratingNote}`} el={`${ratingValue.toFixed(1)}${demoRating ? ` (${demoRating.count} αξιολογήσεις)` : ''}`} compact />
                    : <BilingualText en="No reviews yet" el="Καμία αξιολόγηση ακόμη" compact />}
                </span>,
                <BilingualText key="len" en={`${sessionDuration} min sessions`} el={`Συνεδρίες ${sessionDuration} λεπτών`} compact />,
                <BilingualText key="hours" en={`${hoursPerWeek}h/week`} el={`${hoursPerWeek} ώρες/εβδομάδα`} compact />,
                <span key="price" className={cn(isFree && 'text-status-success')}>
                  {isFree ? <BilingualText en="Free" el="Δωρεάν" compact /> : <BilingualText en={`$${hourlyRate}/hr`} el={`$${hourlyRate}/ώρα`} compact />}
                </span>,
              ]}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="basics">
          <TabsList className="w-full sm:grid sm:grid-cols-3">
            <TabsTrigger value="basics"><BilingualText en="Basics" el="Βασικά" compact /></TabsTrigger>
            <TabsTrigger value="expertise"><BilingualText en="Expertise" el="Εξειδίκευση" compact /></TabsTrigger>
            <TabsTrigger value="pricing"><BilingualText en="Pricing & Formats" el="Τιμές & μορφές" compact /></TabsTrigger>
          </TabsList>

          {/* Basics */}
          <TabsContent value="basics" className="space-y-4">
            <Card>
              <CardHeader><CardTitle><BilingualText en="About You" el="Σχετικά με εσάς" compact /></CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentor-headline"><BilingualText en="Headline" el="Τίτλος" compact /></Label>
                  <Input
                    id="mentor-headline"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder={bilingualInline('e.g. Serial founder & GTM advisor | 2x exits', 'π.χ. Ιδρυτής πολλών εταιρειών και σύμβουλος GTM | 2 exits')}
                    maxLength={120}
                  />
                  <p className="text-xs text-muted-foreground"><BilingualText en={`${headline.length}/120 characters`} el={`${headline.length}/120 χαρακτήρες`} compact /></p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentor-bio"><BilingualText en="Mentoring Bio" el="Βιογραφικό καθοδήγησης" compact /></Label>
                  <Textarea
                    id="mentor-bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder={bilingualInline("Describe your mentoring style, what you offer, and what kinds of founders you work best with…", "Περιγράψτε το στυλ καθοδήγησής σας, τι προσφέρετε και με ποιους ιδρυτές δουλεύετε καλύτερα…")}
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="yearsExp"><BilingualText en="Years of Experience" el="Χρόνια εμπειρίας" compact /></Label>
                    <Select value={yearsExp} onValueChange={setYearsExp}>
                      <SelectTrigger id="yearsExp" aria-label="Years of Experience"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '5', '7', '10', '15', '20+'].map(v => (
                          <SelectItem key={v} value={v}><BilingualText en={`${v} year${v !== '1' ? 's' : ''}`} el={`${v} ${v === '1' ? 'έτος' : 'έτη'}`} compact /></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursPerWeek"><BilingualText en="Hours Available / Week" el="Διαθέσιμες ώρες / εβδομάδα" compact /></Label>
                    <Select value={hoursPerWeek} onValueChange={setHoursPerWeek}>
                      <SelectTrigger id="hoursPerWeek" aria-label="Hours Available / Week"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '5', '8', '10', '15', '20'].map(v => (
                          <SelectItem key={v} value={v}><BilingualText en={`${v}h/week`} el={`${v} ώρες/εβδομάδα`} compact /></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-medium"><BilingualText en="Accepting New Mentees" el="Δέχεται νέους καθοδηγούμενους" compact /></p>
                    <p className="text-xs text-muted-foreground"><BilingualText en="Toggle visibility in mentee search" el="Εμφάνιση στην αναζήτηση καθοδηγούμενων" wrap /></p>
                  </div>
                  <Switch checked={isAccepting} onCheckedChange={setIsAccepting} aria-label="Accepting New Mentees" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expertise */}
          <TabsContent value="expertise" className="space-y-4">
            <Card>
              <CardHeader><CardTitle><BilingualText en="Industries" el="Κλάδοι" compact /></CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => toggleChip(selectedIndustries, setSelectedIndustries, ind)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedIndustries.includes(ind)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle><BilingualText en="Startup Stages" el="Στάδια startup" compact /></CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {STARTUP_STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleChip(selectedStages, setSelectedStages, stage)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedStages.includes(stage)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle><BilingualText en="Expertise Areas" el="Πεδία εξειδίκευσης" compact /></CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_AREAS.map(area => (
                    <button
                      key={area}
                      onClick={() => toggleChip(selectedExpertise, setSelectedExpertise, area)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selectedExpertise.includes(area)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing & Formats */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader><CardTitle><BilingualText en="Session Formats" el="Μορφές συνεδριών" compact /></CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    { value: 'video', label: 'Video Call', labelEl: 'Βιντεοκλήση', desc: 'Google Meet, Zoom, etc.', descEl: 'Google Meet, Zoom κ.λπ.' },
                    { value: 'in_person', label: 'In-Person', labelEl: 'Δια ζώσης', desc: 'Physical meeting at a location', descEl: 'Συνάντηση σε φυσικό χώρο' },
                    { value: 'async', label: 'Async / Written', labelEl: 'Ασύγχρονα / γραπτά', desc: 'Email, voice notes, document feedback', descEl: 'Email, φωνητικά μηνύματα, σχόλια σε έγγραφα' },
                  ].map(f => (
                    <div
                      key={f.value}
                      onClick={() => toggleChip(sessionFormats, setSessionFormats, f.value)}
                      {...pressableProps({ pressed: sessionFormats.includes(f.value) })}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                        sessionFormats.includes(f.value)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-border'
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium"><BilingualText en={f.label} el={f.labelEl} compact /></p>
                        <p className="text-xs text-muted-foreground"><BilingualText en={f.desc} el={f.descEl} wrap /></p>
                      </div>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 transition-all',
                        sessionFormats.includes(f.value) ? 'border-primary bg-primary' : 'border-border'
                      )} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle><BilingualText en="Pricing" el="Τιμολόγηση" compact /></CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-medium"><BilingualText en="Free Mentoring" el="Δωρεάν καθοδήγηση" compact /></p>
                    <p className="text-xs text-muted-foreground"><BilingualText en="Offer sessions at no cost" el="Συνεδρίες χωρίς χρέωση" compact /></p>
                  </div>
                  <Switch checked={isFree} onCheckedChange={setIsFree} aria-label="Free Mentoring" />
                </div>
                {!isFree && (
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate"><BilingualText en="Hourly Rate (USD)" el="Ωριαία αμοιβή (USD)" compact /></Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">$</span>
                      <Input id="hourlyRate"
                        type="number"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(e.target.value)}
                        placeholder="120"
                        className="w-32"
                        min="0"
                      />
                      <span className="text-sm text-muted-foreground"><BilingualText en="per hour" el="την ώρα" compact /></span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration"><BilingualText en="Default Session Duration" el="Προεπιλεγμένη διάρκεια συνεδρίας" compact /></Label>
                  <Select value={sessionDuration} onValueChange={setSessionDuration}>
                    <SelectTrigger id="sessionDuration" aria-label="Default Session Duration" className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[15, 30, 45, 60, 90, 120].map(d => (
                        <SelectItem key={d} value={String(d)}>
                          {d < 60 ? <BilingualText en={`${d} min`} el={`${d} λεπτά`} compact /> : <BilingualText en={`${d / 60}h`} el={`${d / 60} ώρ.`} compact />}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
