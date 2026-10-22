'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoredUser } from '@/hooks/useStoredUser';

export type WhatsNewAudience = 'founder' | 'investor' | 'mentor' | 'org' | 'provider';

type Item = { href: string; en: string; el: string; hintEn: string; hintEl: string; for: readonly WhatsNewAudience[] };

const ALL: readonly WhatsNewAudience[] = ['founder', 'investor', 'mentor', 'org', 'provider'];

/**
 * What was added in the October 2026 rounds, each with the place to try it.
 * Only what is built and reachable is listed; each audience sees what it
 * can use. The list is fixed copy (not computed from today's date), so it
 * renders the same on the server and in the browser.
 */
const ITEMS: Item[] = [
  // 17–18 October 2026: what the GitHub comparison added, each where it shows
  { href: '/dashboard', en: 'Your next move, first', el: 'Η επόμενη κίνησή σας, πρώτη', hintEn: 'One box at the top of every home: what comes up on the brand tint, what waits on you on the amber one, with one button.', hintEl: 'Ένα πλαίσιο στην κορυφή κάθε αρχικής: ό,τι έρχεται με το χρώμα της πλατφόρμας, ό,τι σας περιμένει με κεχριμπαρί, με ένα κουμπί.', for: ALL },
  { href: '/discover', en: 'Search with qualifiers', el: 'Αναζήτηση με φίλτρα-λέξεις', hintEn: 'Type "role:mentor location:Athens" and press Enter; skill:, industry: and stage: work too, and the examples under the empty field type themselves.', hintEl: 'Γράψτε «ρόλος:μέντορας τόπος:Αθήνα» και πατήστε Enter· δουλεύουν και τα δεξιότητα:, κλάδος:, στάδιο:, και τα παραδείγματα κάτω από το κενό πεδίο γράφονται μόνα τους.', for: ALL },
  { href: '/discover', en: 'Who someone is, on hover', el: 'Ποιος είναι κάποιος, με το ποντίκι στο όνομα', hintEn: 'Rest the pointer on a person’s name for their headline, place and skills; the profile then opens already loaded.', hintEl: 'Αφήστε τον δείκτη σε ένα όνομα για τίτλο, τόπο και δεξιότητες· το προφίλ ανοίγει μετά ήδη φορτωμένο.', for: ALL },
  { href: '/ai', en: 'The assistant: Stop, Copy, sources', el: 'Ο βοηθός: Διακοπή, Αντιγραφή, πηγές', hintEn: 'Stop an answer midway, copy it, see what it read, and switch off "This page" when the question is not about it.', hintEl: 'Σταματήστε μια απάντηση στη μέση, αντιγράψτε τη, δείτε τι διάβασε, και κλείστε το «Αυτή η σελίδα» όταν η ερώτηση δεν την αφορά.', for: ALL },
  { href: '/help', en: 'Ctrl+K: > commands, @ people, / pages', el: 'Ctrl+K: > εντολές, @ άτομα, / σελίδες', hintEn: 'Type a prefix first in the command palette; "?" lists every shortcut.', hintEl: 'Γράψτε πρώτα ένα πρόθεμα στην παλέτα εντολών· το «?» δείχνει όλες τις συντομεύσεις.', for: ALL },
  { href: '/commitments', en: 'A need card’s versions as a timeline', el: 'Οι εκδόσεις μιας κάρτας ανάγκης ως χρονολόγιο', hintEn: 'Open a card: each version says when it changed and which terms moved.', hintEl: 'Ανοίξτε μια κάρτα: κάθε έκδοση λέει πότε άλλαξε και ποιοι όροι κινήθηκαν.', for: ['founder', 'investor', 'mentor'] },
  // 16–17 October 2026
  { href: '/scout', en: 'Co-founder scout', el: 'Ανιχνευτής συνιδρυτών', hintEn: 'Proposes people for your brief, with its reasons and a first note in English or Greek, whichever they read. It never contacts anyone.', hintEl: 'Προτείνει ανθρώπους για το σημείωμά σας, με τους λόγους του και ένα πρώτο μήνυμα στα ελληνικά ή στα αγγλικά, όποια γλώσσα διαβάζει ο άλλος. Δεν επικοινωνεί ποτέ με κανέναν.', for: ['founder'] },
  { href: '/messages', en: 'Search your messages', el: 'Αναζήτηση στα μηνύματα', hintEn: 'Search a conversation and step through every hit, accents ignored, or ask the assistant where you talked about something.', hintEl: 'Αναζητήστε σε μια συζήτηση και μεταβείτε σε κάθε εύρημα, χωρίς να μετρούν οι τόνοι, ή ρωτήστε τον βοηθό πού μιλήσατε για κάτι.', for: ALL },
  { href: '/commitments/new', en: 'Need cards', el: 'Κάρτες ανάγκης', hintEn: 'Say what exists, the outcome and who is missing in three sentences; the conversation stays protected until both confirm.', hintEl: 'Τι υπάρχει, το αποτέλεσμα και ποιος λείπει σε τρεις προτάσεις· η συζήτηση μένει προστατευμένη μέχρι να επιβεβαιώσουν και οι δύο.', for: ['founder'] },
  { href: '/intros', en: 'Warm introductions', el: 'Συστάσεις γνωριμίας', hintEn: 'Ask someone who knows both of you; they decide whether to forward.', hintEl: 'Ζητήστε από κάποιον που γνωρίζει και τους δύο· εκείνος αποφασίζει αν θα προωθήσει.', for: ALL },
  { href: '/updates', en: 'Founder updates', el: 'Ενημερώσεις ιδρυτών', hintEn: 'Follow founders and read their monthly updates; write yours for followers or as a public link.', hintEl: 'Ακολουθήστε ιδρυτές και διαβάστε τις μηνιαίες ενημερώσεις τους· γράψτε τη δική σας για ακολούθους ή ως δημόσιο σύνδεσμο.', for: ['founder', 'investor', 'mentor'] },
  { href: '/discover', en: 'Search in plain words', el: 'Αναζήτηση με απλά λόγια', hintEn: 'Type "co-founder SaaS Athens full-time" and press Enter; the known words become filters.', hintEl: 'Γράψτε «συνιδρυτής SaaS Αθήνα πλήρης απασχόληση» και πατήστε Enter· οι γνωστές λέξεις γίνονται φίλτρα.', for: ALL },
  { href: '/opportunities', en: 'Alerts on new need cards', el: 'Ειδοποιήσεις για νέες κάρτες ανάγκης', hintEn: 'Save the need-card filters and hear about new cards that fit.', hintEl: 'Αποθηκεύστε τα φίλτρα καρτών ανάγκης και μάθετε για νέες κάρτες που ταιριάζουν.', for: ['founder', 'investor', 'mentor'] },
  { href: '/settings#verification', en: 'Verification', el: 'Επαλήθευση', hintEn: 'A work email or Verified on LinkedIn; the badge then shows on your profile and cards.', hintEl: 'Εταιρικό email ή Verified on LinkedIn· το σήμα εμφανίζεται έπειτα στο προφίλ και στις κάρτες σας.', for: ALL },
  { href: '/settings#open-to', en: '"Open to"', el: '«Ανοιχτός/ή σε»', hintEn: 'A private signal for co-founding, advising, investing or mentoring; you choose who may see it.', hintEl: 'Ιδιωτικό σήμα για συνίδρυση, συμβουλευτική, επένδυση ή καθοδήγηση· εσείς επιλέγετε ποιος το βλέπει.', for: ['founder', 'investor', 'mentor'] },
  { href: '/profile/edit', en: 'Import from LinkedIn', el: 'Εισαγωγή από το LinkedIn', hintEn: 'Fill your profile from your LinkedIn data export; nothing is saved until you press Save.', hintEl: 'Συμπληρώστε το προφίλ από το αρχείο εξαγωγής του LinkedIn· τίποτα δεν αποθηκεύεται πριν πατήσετε Αποθήκευση.', for: ALL },
  { href: '/profile', en: 'Skills with evidence', el: 'Δεξιότητες με τεκμήρια', hintEn: 'Link a skill to a milestone, a builder document or an agreed commitment.', hintEl: 'Συνδέστε μια δεξιότητα με ορόσημο, έγγραφο του builder ή συμφωνημένη δέσμευση.', for: ['founder', 'mentor', 'provider'] },
  { href: '/transparency', en: 'Transparency report', el: 'Αναφορά διαφάνειας', hintEn: 'What the safety rules refused and what members reported, per half year.', hintEl: 'Τι απέρριψαν οι κανόνες ασφαλείας και τι ανέφεραν τα μέλη, ανά εξάμηνο.', for: ALL },
  // 8 October 2026
  { href: '/connections', en: 'People you may know', el: 'Ίσως γνωρίζετε', hintEn: 'Suggestions from the roles you are looking for and what you share; each says why. Never from who viewed whom.', hintEl: 'Προτάσεις από τους ρόλους που αναζητάτε και όσα μοιράζεστε· η καθεμία λέει γιατί. Ποτέ από το ποιος είδε ποιον.', for: ALL },
  { href: '/jobs', en: 'Save jobs and listings', el: 'Αποθήκευση θέσεων και καταχωρίσεων', hintEn: 'Save keeps a job or a listing for you; "Saved only" in the filters brings them back. Nobody is told.', hintEl: 'Η Αποθήκευση κρατά μια θέση ή καταχώριση για εσάς· το «Μόνο αποθηκευμένα» στα φίλτρα τις επαναφέρει. Δεν ειδοποιείται κανείς.', for: ALL },
];

// A new round shows the panel again to those who hid the previous one.
const ROUND = '2026-10-18';

export function whatsNewItems(audience: WhatsNewAudience): Item[] {
  return ITEMS.filter((i) => i.for.includes(audience));
}

/** A dismissible card of what is new for this audience, remembered per member in this browser. */
const FIRST_ROWS = 4;

export function WhatsNewPanel({ audience }: { audience: WhatsNewAudience }) {
  const me = useStoredUser();
  const [hidden, setHidden] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const key = `cfb.whatsnew.${ROUND}.${me?.id ?? 'guest'}`;
  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(key) === 'hidden');
    } catch {
      setHidden(false);
    }
  }, [key]);
  if (hidden) return null;
  const items = whatsNewItems(audience);
  // The four newest, then the rest on request: twenty rows were the longest
  // block on every home (about 800px at 1440, 1,800 on a phone), at the foot
  // of a page that is meant as a glance. The rail keeps the whole list
  // (WhatsNewRail), and nothing is dropped here either (docs §70).
  const shown = showAll ? items : items.slice(0, FIRST_ROWS);
  const hide = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(key, 'hidden');
    } catch {
      // storage blocked: hidden for this page view
    }
  };
  // A section card: its title and the line under it, the way out at the
  // right, and rows without a frame of their own, each on the card's axis.
  return (
    <Card aria-labelledby="whats-new-heading">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle id="whats-new-heading">
              <BilingualText en="What’s new" el="Τι νέο υπάρχει" compact />
            </CardTitle>
            <CardDescription>
              <BilingualText en="Added between 7 and 18 October 2026, newest first. Each opens where you can try it." el="Προστέθηκαν από τις 7 έως τις 18 Οκτωβρίου 2026, τα νεότερα πρώτα. Το καθένα ανοίγει εκεί που μπορείτε να το δοκιμάσετε." wrap />
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" className="-mr-2 shrink-0" onClick={hide}>
            <BilingualText en="Hide" el="Απόκρυψη" compact />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul id={`whats-new-${audience}`} className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
          {shown.map((item) => (
            <li key={item.en /* a title: several entries can open the same page */} className="min-w-0">
              <Link href={item.href} className="axis-row block rounded-md py-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="block text-sm font-medium text-foreground"><BilingualText en={item.en} el={item.el} compact /></span>
                <span className="mt-0.5 block text-xs text-muted-foreground"><BilingualText en={item.hintEn} el={item.hintEl} wrap /></span>
              </Link>
            </li>
          ))}
        </ul>
        {items.length > FIRST_ROWS ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 -ml-2"
            aria-expanded={showAll}
            aria-controls={`whats-new-${audience}`}
            onClick={() => setShowAll((open) => !open)}
          >
            {showAll ? (
              <BilingualText en="Show the four newest" el="Μόνο τα τέσσερα νεότερα" compact />
            ) : (
              <BilingualText en={`Show all ${items.length}`} el={`Όλα τα ${items.length}`} compact />
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * What's new as a short list for the page rail, the way GitHub's dashboard
 * keeps "Latest from our changelog" in its right column. Unlike the card, it
 * cannot be hidden: hiding the card used to be the only way to stop seeing
 * it, and then the list was gone for good.
 */
export function WhatsNewRail({ audience, limit = 6 }: { audience: WhatsNewAudience; limit?: number }) {
  const items = whatsNewItems(audience).slice(0, limit);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        <BilingualText en="Added 7–18 October 2026, newest first." el="Προστέθηκαν 7–18 Οκτωβρίου 2026, τα νεότερα πρώτα." wrap />
      </p>
      <ol className="space-y-0.5 border-l border-border pl-3">
        {items.map((item) => (
          <li key={item.en} className="min-w-0">
            <Link href={item.href} className="block rounded-md px-1.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <BilingualText en={item.en} el={item.el} wrap />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
