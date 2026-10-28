'use client';

import { useId } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { YourPagesManager } from '@/components/dashboard/YourPages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { useUsageProfile } from '@/hooks/useUsageProfile';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { clearUsageHistory, setUsageEnabled } from '@/lib/usage-profile';

/**
 * Settings › Your pages: what the platform counts about how the reader moves
 * around, the switch that stops it, and the same manager the homes open
 * (docs §107). The counts never leave this device; clearing them keeps the
 * reader's pins, because those are choices, not history.
 */
export function YourPagesSettingsCard() {
  const switchId = useId();
  const sayOne = useBilingualString();
  const { success } = useToast();
  const { ready, store, known } = useUsageProfile();

  return (
    <Card id="your-pages" className="scroll-mt-16 shadow-sm border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg">
          <BilingualText en="Your pages and shortcuts" el="Οι σελίδες σας και συντομεύσεις" compact />
        </CardTitle>
        <CardDescription>
          <BilingualText
            en="Your homes, the command palette and G then 1–6 open the pages you pin and use most. The assistant can suggest quicker ways from the same counts."
            el="Οι αρχικές, η παλέτα εντολών και το G και μετά 1–6 ανοίγουν τις σελίδες που καρφιτσώνετε και χρησιμοποιείτε περισσότερο. Ο βοηθός προτείνει πιο σύντομους δρόμους από τις ίδιες μετρήσεις."
            wrap
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div className="flex items-start justify-between gap-4">
          <label htmlFor={switchId} className="min-w-0 flex-1 space-y-0.5">
            <span className="block text-sm font-medium text-foreground">
              <BilingualText en="Count the pages I open" el="Μέτρηση των σελίδων που ανοίγω" compact wrap />
            </span>
            <span className="block text-xs text-muted-foreground">
              <BilingualText
                en="On this device only, for 30 days: which pages, how often, and from where. Never whose profile or which conversation."
                el="Μόνο σε αυτή τη συσκευή, για 30 ημέρες: ποιες σελίδες, πόσο συχνά και από πού. Ποτέ ποιανού το προφίλ ή ποια συνομιλία."
                wrap
              />
            </span>
          </label>
          <Switch
            id={switchId}
            checked={ready ? store.enabled : true}
            disabled={!ready}
            onCheckedChange={(on) => {
              setUsageEnabled(on);
              success(on ? sayOne('Counting is on.', 'Η μέτρηση είναι ενεργή.') : sayOne('Counting is off. Your pins stay.', 'Η μέτρηση σταμάτησε. Οι καρφιτσωμένες σελίδες μένουν.'));
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!ready || !known}
            onClick={() => {
              clearUsageHistory();
              success(sayOne('What was counted is cleared. Your pins stay.', 'Οι μετρήσεις διαγράφηκαν. Οι καρφιτσωμένες σελίδες μένουν.'));
            }}
          >
            <BilingualText en="Clear what was counted" el="Διαγραφή των μετρήσεων" compact />
          </Button>
          {!known && ready ? (
            <span className="text-xs text-muted-foreground">
              <BilingualText en="Nothing counted yet." el="Δεν έχει μετρηθεί τίποτα ακόμη." compact />
            </span>
          ) : null}
        </div>
        <YourPagesManager />
      </CardContent>
    </Card>
  );
}
