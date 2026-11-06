'use client';

import { X } from 'lucide-react';
import { RailAction, RailOptions } from '@/components/layout/RailParts';
import { CMT } from '@/lib/i18n/strings-commitments';
import { BilingualText } from '@/components/common/BilingualText';
import {
  CHIP_KEYS,
  CHIP_LABEL,
  NO_CHIPS,
  activeChipCount,
  applyChips,
  type CardChips,
} from '@/lib/need-card-wall';
import type { useNeedCardWall } from './useNeedCardWall';

export type NeedCardWall = ReturnType<typeof useNeedCardWall>;

/**
 * The need cards' own filters, drawn with the rail's anatomy so the whole
 * page has one filtering surface (the wall used to carry a second, chip-row
 * UI of its own under its heading). Four groups - category, place, stage,
 * commitment - each offering only choices that would show a card, with the
 * count. Hidden over a failed read or an empty board: chips that narrow
 * nothing promise a control that is not there.
 */
export function NeedCardChips({
  wall,
  chips,
  onChipsChange,
}: {
  /** The page's own `useNeedCardWall` result, so the rail's choices are the same options the assistant's controls offer. */
  wall: NeedCardWall;
  chips: CardChips;
  onChipsChange: (chips: CardChips) => void;
}) {
  if (!wall.ready || wall.isError || wall.board.length === 0) return null;
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <p className="px-2.5 text-xs font-medium text-muted-foreground">
        <BilingualText en={`${CMT.needs_cards.en} only`} el={`Μόνο ${CMT.needs_cards.el.toLowerCase()}`} compact />
      </p>
      {CHIP_KEYS.map((key) => (
        <RailOptions
          key={key}
          title={CHIP_LABEL[key].en}
          titleEl={CHIP_LABEL[key].el}
          value={chips[key]}
          onChange={(v) => onChipsChange({ ...chips, [key]: v })}
          options={[
            { value: '', en: 'Any', el: 'Οποιοδήποτε', count: applyChips(wall.board, chips, key).length },
            ...wall.options[key].map((o) => ({ value: o.value, en: o.en, el: o.el, count: o.count })),
          ]}
        />
      ))}
      {activeChipCount(chips) > 0 ? (
        <RailAction icon={X} en="Clear card filters" el="Καθαρισμός φίλτρων καρτών" onClick={() => onChipsChange(NO_CHIPS)} />
      ) : null}
    </div>
  );
}
