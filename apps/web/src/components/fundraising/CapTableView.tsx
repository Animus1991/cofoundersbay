'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X } from 'lucide-react';
import { CAP_TABLE_KINDS, CAP_TABLE_LIMITS, capTableShares, type CapTableHolder, type CapTableKind } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { bilingualAria } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

const KIND: Record<CapTableKind, { en: string; el: string }> = {
  founder: { en: 'Founder', el: 'Ιδρυτική ομάδα' },
  employee: { en: 'Team', el: 'Ομάδα' },
  investor: { en: 'Investor', el: 'Επενδυτής' },
  pool: { en: 'Option pool', el: 'Option pool' },
  other: { en: 'Other', el: 'Άλλο' },
};

/**
 * Who owns what today, kept with the round. The percentages come from the
 * shares, so they always add up; what a priced round would do to them is the
 * calculator's job, one link away.
 */
export function CapTableView({ holders, onSave }: { holders: CapTableHolder[]; onSave: (next: CapTableHolder[]) => Promise<void> }) {
  const { error: showError } = useToast();
  const { primary } = useLanguagePreference();
  const numbers = primary === 'el' ? 'el-GR' : 'en-GB';
  const percent = (share: number) => `${(share * 100).toLocaleString(numbers, { maximumFractionDigits: 2 })}%`;
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CapTableKind>('founder');
  const [shares, setShares] = useState('');
  const [saving, setSaving] = useState(false);
  const count = Number(shares);
  const valid = name.trim().length > 0 && count > 0 && count <= CAP_TABLE_LIMITS.shares;
  const full = holders.length >= CAP_TABLE_LIMITS.holders;

  const save = async (next: CapTableHolder[]) => {
    setSaving(true);
    try {
      await onSave(next);
      return true;
    } catch (err) {
      showError('Could not save the cap table', err instanceof Error ? err.message : undefined);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || saving || full) return;
    const saved = await save([...holders, { id: `holder-${Date.now().toString(36)}-${holders.length}`, name: name.trim(), kind, shares: count }]);
    if (saved) {
      setName('');
      setShares('');
    }
  };

  return (
    <Card data-cap-table="">
      <CardContent className="space-y-4">
        {holders.length > 0 ? (
          <ul className="divide-y divide-border">
            {capTableShares(holders).map((holder) => (
              <li key={holder.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{holder.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    <BilingualText en={KIND[holder.kind].en} el={KIND[holder.kind].el} compact />
                    {' · '}{holder.shares.toLocaleString(numbers)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{percent(holder.share)}</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save(holders.filter((item) => item.id !== holder.id))}
                  aria-label={bilingualAria(`Remove ${holder.name}`, `Αφαίρεση: ${holder.name}`)}
                  className="shrink-0 rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="icon-xs" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            <BilingualText en="Write who owns what today. Investors ask for this early." el="Γράψτε ποιος κατέχει τι σήμερα. Οι επενδυτές το ζητούν νωρίς." compact wrap />
          </p>
        )}

        <form className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_9rem_auto] sm:items-end" onSubmit={add}>
          <div className="space-y-1.5">
            <Label htmlFor="cap-name"><BilingualText en="Holder" el="Κάτοχος" compact /></Label>
            <Input id="cap-name" value={name} maxLength={CAP_TABLE_LIMITS.name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cap-kind"><BilingualText en="Kind" el="Είδος" compact /></Label>
            <select
              id="cap-kind"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={kind}
              onChange={(event) => setKind(event.target.value as CapTableKind)}
            >
              {CAP_TABLE_KINDS.map((item) => <option key={item} value={item}>{KIND[item][primary === 'el' ? 'el' : 'en']}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cap-shares"><BilingualText en="Shares" el="Μετοχές" compact /></Label>
            <Input id="cap-shares" type="number" min="1" inputMode="numeric" value={shares} onChange={(event) => setShares(event.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={!valid || saving || full}>
            <BilingualText en="Add" el="Προσθήκη" compact />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          <Link href="/builder/calculators" className="underline underline-offset-2 hover:text-foreground">
            <BilingualText en="See what a priced round does to this" el="Δείτε τι κάνει ένας γύρος σε αυτή τη σύνθεση" compact />
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
