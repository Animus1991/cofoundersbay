'use client';

import { useState } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

type Section = { id: string; title: string; content: string };

/**
 * Which text a legal page shows (docs §111). A Greek reader gets the Greek
 * draft and can switch to the English; everyone else gets the English.
 */
export function useLegalText<T extends Section>(sections: readonly T[], greek: Record<string, { title: string; content: string }>) {
  const { primary } = useLanguagePreference();
  const [english, setEnglish] = useState(false);
  const offered = primary === 'el';
  const showingGreek = offered && !english;
  return {
    sections: showingGreek ? sections.map((s) => ({ ...s, ...greek[s.id] })) : sections,
    offered,
    showingGreek,
    toggle: () => setEnglish((v) => !v),
  };
}

/**
 * What the reader is looking at, said plainly above the text. A paraphrase can
 * promise something the English does not, so a Greek draft never stands
 * without this, and the English stays the text that applies until a lawyer has
 * reviewed the Greek.
 */
export function LegalDraftNotice({ offered, showingGreek, onToggle, noun }: {
  offered: boolean;
  showingGreek: boolean;
  onToggle: () => void;
  noun: { en: string; el: string };
}) {
  if (!offered) {
    return (
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
        <BilingualText en={`${noun.en} written in English; the English text is the version that applies.`} el={`${noun.el} γραμμένο στα Αγγλικά· ισχύει το αγγλικό κείμενο.`} keepSecondaryOnMobile wrap />
      </p>
    );
  }
  return (
    <div className="mt-3 max-w-2xl space-y-2 rounded-xl border border-status-warning-border bg-status-warning-bg p-3" role="note" data-legal-draft-notice="">
      <p className="text-sm text-foreground">
        {showingGreek
          ? 'Προσχέδιο μετάφρασης για διευκόλυνσή σας. Δεν το έχει ελέγξει ακόμη δικηγόρος, και μέχρι τότε ισχύει το αγγλικό κείμενο.'
          : 'Βλέπετε το αγγλικό κείμενο, που είναι αυτό που ισχύει.'}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onToggle}>
        {showingGreek ? 'Εμφάνιση αγγλικού κειμένου' : 'Εμφάνιση ελληνικού προσχεδίου'}
      </Button>
    </div>
  );
}
