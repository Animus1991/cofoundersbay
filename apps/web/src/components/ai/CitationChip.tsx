import Link from 'next/link';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BilingualText } from '@/components/common/BilingualText';
import type { CopilotCitation } from '@/lib/copilot-types';
import { cn } from '@/lib/utils';

/**
 * The data behind an answer, as GitHub Copilot lists its references: a
 * labelled row under the reply, one entry per thing read, each with the glyph
 * of its kind and a link to the page that owns it. Muted text, not a tinted
 * pill - a source is a fact about the answer, not a state.
 */
const GLYPH: Record<CopilotCitation['type'], CfbGlyphName> = {
  person: 'profile',
  match: 'matches',
  conversation: 'messages',
  notification: 'bell',
  graph: 'people',
  route: 'default',
  event: 'calendar',
  milestone: 'flag',
  job: 'briefcase',
  group: 'community',
  endorsement: 'award',
  opportunity: 'briefcase',
  session: 'mentor',
  research: 'research',
  workspace: 'builder',
  update: 'update',
};

export function CitationChip({ citation }: { citation: CopilotCitation }) {
  const className = 'inline-flex min-w-0 max-w-full items-center gap-1 text-2xs text-muted-foreground';
  const body = (
    <>
      <CfbGlyph name={GLYPH[citation.type] ?? 'default'} className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{citation.label}</span>
    </>
  );

  if (citation.href) {
    return (
      <Link href={citation.href} className={cn(className, 'hover:text-foreground hover:underline')}>
        {body}
      </Link>
    );
  }

  return <span className={className}>{body}</span>;
}

export function CitationList({ citations }: { citations: CopilotCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-2 border-t border-border/60 pt-2" data-citations="">
      <p className="type-caption text-muted-foreground">
        <BilingualText en={`Read from (${citations.length})`} el={`Διάβασε από (${citations.length})`} compact />
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {citations.map((c) => (
          <li key={`${c.type}-${c.id}`} className="min-w-0" data-keep-icon="">
            <CitationChip citation={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
