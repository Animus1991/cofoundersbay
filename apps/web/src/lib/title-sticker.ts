import type { ElementType } from 'react';
import { specificGlyphForHref, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { glyphStickerTint, type StickerTint } from '@/components/dashboard/SectionSticker';
import { navLinkForPath } from '@/components/layout/nav-modes';
import { getPageMeta } from '@/lib/page-registry';

export type TitleSticker = { glyph?: CfbGlyphName; icon?: ElementType; tint: StickerTint };

/** The page's registry section names the tint when no glyph does (docs §135 A1). */
const SECTION_STICKER_TINT: Record<string, StickerTint> = {
  Work: 'accent',
  Network: 'accent',
  Explore: 'info',
  Resources: 'info',
  Community: 'warning',
  Communicate: 'warning',
  Account: 'neutral',
  Admin: 'neutral',
  Tenant: 'neutral',
};

/**
 * The title sticker a route derives when the page does not name one: the
 * route's own glyph first (its tint from the glyph's kind), else the icon
 * of the nav entry that owns the path, tinted by the page's registry
 * section. Neither → no sticker. Explicit `titleSticker` props always win;
 * `false` hides.
 */
export function deriveTitleSticker(pathname: string): TitleSticker | undefined {
  const glyph = specificGlyphForHref(pathname);
  if (glyph) return { glyph, tint: glyphStickerTint(glyph) };
  const link = navLinkForPath(pathname);
  if (!link) return undefined;
  const section = getPageMeta(pathname)?.section;
  return { icon: link.icon, tint: (section && SECTION_STICKER_TINT[section]) || 'primary' };
}
