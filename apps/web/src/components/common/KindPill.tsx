import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BilingualText } from '@/components/common/BilingualText';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';

/**
 * The small tinted chip that names a catalogue card's family — «Ανάγκη»,
 * «Θέση», «Ευκαιρία», «Πρόγραμμα», «Επενδυτής», «Εκδήλωση» — at the top of
 * the card's content (docs §137, the wave-4 per-family look). One family
 * glyph + one word on the family's flat tint; cards that open on a tinted
 * wash place it over that tint. Compact list rows keep their fact lines.
 */
export function KindPill({
  glyph,
  tone,
  en,
  el,
  className,
}: {
  glyph: CfbGlyphName;
  /** Family tone: people/work→accent, money→success, knowledge→info, events/time→warning. */
  tone: StatusTone;
  en: string;
  el: string;
  className?: string;
}) {
  return (
    <span
      data-kind-pill=""
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium',
        STATUS[tone].chip,
        className,
      )}
    >
      <CfbGlyph name={glyph} className="h-3 w-3" />
      <BilingualText en={en} el={el} compact />
    </span>
  );
}
