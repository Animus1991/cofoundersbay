'use client';

import { FormEvent, KeyboardEvent, useContext, useEffect, useId, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUp, Check, ChevronDown } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePopupChatOptional } from '@/contexts/PopupChatContext';
import { HOME_ASK, nowStartingPoints, scopedPrompt, slashCommands, type HomeAskAction, type HomeRole } from '@/lib/home-ask';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString, useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { cn } from '@/lib/utils';
import { YourPagesRow } from '@/components/dashboard/YourPages';
import { HomeActionShelf } from '@/components/dashboard/HomeActionShelf';
import { DictationButton } from '@/components/ai/DictationButton';
import { HeroActionsSlot } from '@/components/layout/PageHeaderSlot';
import { SectionSticker } from '@/components/dashboard/SectionSticker';
import { deriveTitleSticker } from '@/lib/title-sticker';
import { getPageMeta } from '@/lib/page-registry';

type Part = { en: string; el: string };

/** Morning from five; before that it is still last night's evening. */
/**
 * What a home action does when run: a prompt goes to the in-page assistant
 * (or `/ai?q=` when this home has none), an href opens its page. Shared with
 * the rail's shortcuts (docs §116/§125), so a chip and a rail row are the
 * same gesture.
 */
export function useHomeAskRun() {
  const { primary } = useLanguagePreference();
  const popup = usePopupChatOptional();
  const router = useRouter();
  const pathname = usePathname();

  function send(question: string) {
    const q = question.trim();
    if (!q) return;
    if (popup && !pathname?.startsWith('/ai')) {
      popup.ask(q);
      return;
    }
    router.push(`/ai?q=${encodeURIComponent(q)}`);
  }

  return function run(action: HomeAskAction) {
    if (action.prompt) send(primary === 'el' ? action.prompt.el : action.prompt.en);
    else if (action.href) router.push(action.href);
  };
}

export function partOfDay(hour: number): Part {
  if (hour >= 5 && hour < 12) return { en: dashboardEn('good_morning'), el: dashboardEl('good_morning') };
  if (hour >= 12 && hour < 17) return { en: dashboardEn('good_afternoon'), el: dashboardEl('good_afternoon') };
  return { en: dashboardEn('good_evening'), el: dashboardEl('good_evening') };
}

/**
 * The top of every home: a greeting, one question box and the jobs the role
 * comes back for.
 *
 * GitHub's dashboard (2026) opens on "Good morning, …" over an "Ask anything"
 * box with a scope picker ("All repositories"), and a row of starting points
 * under it. Ours had the same parts scattered: a quiet greeting sentence, a
 * one-line "Ask about this page" field that looked like every other page's,
 * and the assistant's best openings hidden in buttons further down. Here they
 * are one block, at the top, on every role's home; the page title above it is
 * unchanged.
 *
 * - The box sends to the in-page assistant with this page's context (the same
 *   path as the header's field, which this replaces on a home). Enter sends,
 *   Shift+Enter starts a new line, and Send is off while the box is empty.
 * - The scope is said in the question ("About my matches: …"), so what the
 *   assistant was asked is exactly what the chat shows.
 * - A chip asks the assistant a ready question or opens a page; a chip with a
 *   chevron opens a short menu of them.
 * - What waits right now (intro requests, unread messages, notifications)
 *   leads the row as chips with their counts, each asking the assistant to
 *   deal with it; they come from the same counts as the bell and sidebar.
 * - "/" at the start of the box lists the same starting points as commands,
 *   narrowed as you type (Copilot Chat's slash commands): arrows move, Enter
 *   runs the highlighted one, Escape clears.
 * - Under them, "Your pages": what the reader pinned and opens most, each
 *   with its `G` number (`YourPagesRow`, docs §107).
 */
export function HomeAskHero({ role, name, lead, followUpsDue = 0, showWaiting = true, plain = false, greeting = true, hero = false, band = false, purposeEn, purposeEl }: { /** Off where the page's own title already greets the reader (/home). */ greeting?: boolean; role: HomeRole; name?: string | null; lead?: Part; followUpsDue?: number; /** Off where the page ranks what waits itself (HomeToday). */ showWaiting?: boolean; /** Only the question box: the shortcuts live in the page's tools (docs §116). */ plain?: boolean; /** The Parea method: a solid brand card — greeting, one line, the box, three intents, the role's glyph well (docs §131.2, §133.8). */ hero?: boolean; /** The role overview's own look: a tinted band — the page's title as the overline, greeting, lead, the one-row ask pill (docs §135 A4). */ band?: boolean; /** One short purpose line under the greeting in the hero card. */ purposeEn?: string; purposeEl?: string }) {
  // The first name, as /home greets: the role overviews said «Καλησπέρα,
  // Alex Demo.» with the full name. A title ("Dr.") is not a first name (§166).
  const firstName = (name ?? '').trim().split(/\s+/).find((word) => word && !word.endsWith('.')) ?? '';
  const sayOne = useBilingualString();
  const { primary } = useLanguagePreference();
  const pathname = usePathname();
  const run = useHomeAskRun();
  // Where the page header's tools land in hero mode (docs §133): the AppShell
  // portals them into this corner slot of the card.
  const heroActionsSlot = useContext(HeroActionsSlot);
  const boxId = useId();
  const config = HOME_ASK[role];
  const now = nowStartingPoints({ ...useUnreadCounts(), followUps: followUpsDue });
  const [scopeId, setScopeId] = useState(config.scopes[0]?.id ?? 'all');
  const [value, setValue] = useState('');
  const [part, setPart] = useState<Part | null>(null);
  // The server renders in its own time zone; the greeting waits for the reader's clock.
  useEffect(() => setPart(partOfDay(new Date().getHours())), []);
  const hello = part ?? { en: 'Hello', el: 'Γεια σας' };
  const scope = config.scopes.find((s) => s.id === scopeId) ?? config.scopes[0];
  const [activeCommand, setActiveCommand] = useState(0);
  const commands = slashCommands(config.actions, value);
  const listOpen = commands !== null && commands.length > 0;
  const active = listOpen ? Math.min(activeCommand, commands.length - 1) : -1;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!value.trim()) return;
    // The typed question is an ad-hoc action: same popup-or-/ai path.
    const q = scopedPrompt(value, scope, primary);
    run({ id: 'typed', en: q, el: q, glyph: 'spark', prompt: { en: q, el: q } });
    setValue('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (listOpen && commands) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveCommand((active + step + commands.length) % commands.length);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setValue('');
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        runCommand(commands[active]);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function runCommand(action: HomeAskAction) {
    setValue('');
    setActiveCommand(0);
    run(action);
  }

  // The scope picker. Inside the field's footer in the plain box; on the hero
  // card a quiet pill beside the field, so the field itself stays a single
  // row (docs §133.4, §142).
  const scopeMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={hero
            ? 'h-9 gap-1.5 rounded-full bg-white/15 px-2.5 text-sm font-medium text-primary-foreground hover:bg-white/25 hover:text-primary-foreground sm:px-3.5'
            : 'h-8 gap-1.5 px-2 text-xs text-muted-foreground'}
          aria-label={bilingualAria(`About: ${scope?.en ?? ''}`, `Πλαίσιο: ${scope?.el ?? ''}`)}
          data-testid="home-ask-scope"
        >
          {/* Kept through the labelled-button icon rule in the hero: on a phone
              the glyph is what the pill shows (docs §142). The band does the
              same on a phone, where "Όλη η πλατφόρμα" inside its pill cut the
              placeholder to «Ρωτήστε ή ζη» (docs §147). */}
          {hero ? <span data-keep-icon="" className="inline-flex"><CfbGlyph name="discover" className="icon-sm" /></span> : band ? <span data-keep-icon="" className="inline-flex sm:hidden"><CfbGlyph name="discover" className="icon-sm" /></span> : <CfbGlyph name="discover" className="icon-sm" />}
          <span className={hero || band ? 'max-sm:sr-only' : undefined}><BilingualText en={scope?.en ?? ''} el={scope?.el ?? ''} compact /></span>
          <ChevronDown className={cn('icon-sm', (hero || band) && 'max-sm:hidden')} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={hero ? 'end' : 'start'} data-testid="home-scope-menu">
        {config.scopes.map((s) => (
          <DropdownMenuItem key={s.id} data-testid={`home-scope-${s.id}`} onSelect={() => setScopeId(s.id)} className="gap-2">
            <Check className={cn('icon-sm', s.id === scopeId ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
            <BilingualText en={s.en} el={s.el} compact />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const intentChips = hero ? (
    // One row that scrolls on a phone (the card's edge to edge), where the
    // wrapped chips stacked into three rows and made the card 277px tall
    // (docs §142); from sm they wrap as before.
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0" role="group" aria-label={bilingualAria('Starting points', 'Αφετηρίες')}>
      {config.actions.slice(0, 3).map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => runCommand(action)}
          className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/25"
        >
          <BilingualText en={action.en} el={action.el} compact />
        </button>
      ))}
    </div>
  ) : null;

  const heroBody = (
    <>
      {/* The greeting leads the card as the page's one visible heading — the
          AppShell h1 above it is sr-only in hero mode (docs §132.0). Its line
          also holds the page's tools and Create, language, notifications and
          account (docs §146), and they wrap under it when the card is narrow. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2 id={`${boxId}-title`} hidden={!greeting} className="min-w-0 break-words text-2xl font-semibold text-primary-foreground sm:text-3xl" data-testid="home-greeting">
          <BilingualText
            en={`${hello.en}${firstName ? `, ${firstName}` : ''}.`}
            el={`${hello.el}${firstName ? `, ${firstName}` : ''}.`}
            stacked
            wrap
            secondaryFrom="lg"
          />
        </h2>
        <div
          ref={heroActionsSlot}
          data-hero-actions=""
          className="flex flex-wrap items-center justify-end gap-2 empty:hidden [&_button]:border-white/40 [&_button]:bg-white/15 [&_button]:text-primary-foreground [&_button:hover]:border-white/60 [&_button:hover]:bg-white/25 [&_button:hover]:text-primary-foreground [&_button_.text-foreground]:text-primary-foreground [&_button_.text-muted-foreground]:text-primary-foreground/80"
        />
      </div>
      {purposeEn ? (
        <p className="break-words text-sm text-primary-foreground/90" data-testid="home-hero-purpose">
          <BilingualText en={purposeEn} el={purposeEl ?? purposeEn} compact wrap />
        </p>
      ) : null}
    </>
  );

  // The band's overline repeats the page's title with its sticker: the real
  // h1 is sr-only on these pages, so the band says where the reader is
  // (visible but aria-hidden — one accessible heading, the greeting).
  const bandMeta = band && pathname ? getPageMeta(pathname) : undefined;
  const bandSticker = band && pathname ? deriveTitleSticker(pathname) : undefined;
  const bandBody = (
    <>
      {/* The overline's line also holds the page's tools and the four global
          ones (docs §146). */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {bandMeta ? (
          <p aria-hidden="true" className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-widest text-primary-accessible">
            {bandSticker ? <SectionSticker {...bandSticker} className="h-5 w-5" /> : null}
            <BilingualText en={bandMeta.title} el={bandMeta.titleEl ?? bandMeta.title} compact />
          </p>
        ) : <span />}
        <div ref={heroActionsSlot} data-hero-actions="" className="flex flex-wrap items-center justify-end gap-2 empty:hidden" />
      </div>
      <h2 id={`${boxId}-title`} hidden={!greeting} className="break-words text-xl font-semibold text-foreground sm:text-2xl" data-testid="home-greeting">
        <BilingualText
          en={`${hello.en}${firstName ? `, ${firstName}` : ''}.`}
          el={`${hello.el}${firstName ? `, ${firstName}` : ''}.`}
          stacked
          wrap
          secondaryFrom="lg"
        />
      </h2>
      {lead ? (
        <p className="line-clamp-2 break-words text-sm text-muted-foreground" data-testid="home-band-lead">
          <BilingualText en={lead.en} el={lead.el} compact wrap />
        </p>
      ) : null}
    </>
  );

  const askForm = (
        <form
          data-testid="home-ask-form"
          onSubmit={submit}
          className={hero
            /* The hero field is one row — the pill, the placeholder, send at the
               right end; the scope picker stands beside it (§133.4, §142). */
            ? 'relative flex items-center gap-1 rounded-full border border-input bg-card py-1.5 pe-1.5 ps-4 shadow-sm transition-colors focus-within:border-primary-muted'
            : band
              /* The band's ask pill: same one row, a quieter border, the scope
                 picker as the quiet control at its right (docs §135 A4). */
              ? 'relative flex items-center gap-1 rounded-full border border-border/60 bg-card py-1.5 pe-1.5 ps-4 shadow-sm transition-colors focus-within:border-primary-muted'
              : 'rounded-xl border border-input bg-card shadow-sm transition-colors focus-within:border-primary-muted'}
        >
          <label htmlFor={`${boxId}-box`} className="sr-only">
            <BilingualText en="Ask the assistant" el="Ρωτήστε τον βοηθό" compact />
          </label>
          <textarea
            data-testid="home-ask-input"
            id={`${boxId}-box`}
            value={value}
            onChange={(event) => { setValue(event.target.value); setActiveCommand(0); }}
            onKeyDown={onKeyDown}
            // A textarea keeps the textbox role (combobox is not allowed on
            // it); these three still tie it to the command list.
            aria-controls={listOpen ? `${boxId}-commands` : undefined}
            aria-autocomplete="list"
            aria-activedescendant={listOpen ? `${boxId}-command-${active}` : undefined}
            rows={hero || band ? 1 : 2}
            maxLength={2000}
            // Short enough for a 390px field beside the mic and send buttons:
            // the longer sentence was cut mid-word there (docs §142).
            placeholder={sayOne('Ask, or get something done', 'Ρωτήστε ή ζητήστε κάτι')}
            className={hero || band
              // nowrap: the one-row pill never shows a sliver of a wrapped
              // placeholder line; Shift+Enter still inserts a newline.
              ? 'block h-9 w-full min-w-0 resize-none overflow-hidden whitespace-nowrap bg-transparent py-2 text-sm text-foreground outline-none [scrollbar-width:none] placeholder:text-muted-foreground lg:h-[37px]'
              : 'block max-h-48 min-h-[3.25rem] w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground'}
          />
          {listOpen && commands ? (
            <ul id={`${boxId}-commands`} data-testid="home-command-list" role="listbox" aria-label={bilingualAria('Commands', 'Εντολές')} className={hero || band ? 'absolute inset-x-2 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1' : 'mx-2 mb-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1'}>
              {commands.map((command, index) => (
                <li
                  key={command.id}
                  data-testid={`home-command-${command.id}`}
                  id={`${boxId}-command-${index}`}
                  role="option"
                  aria-selected={index === active}
                  // mousedown, not click: the box keeps its focus.
                  onMouseDown={(event) => { event.preventDefault(); runCommand(command); }}
                  onMouseEnter={() => setActiveCommand(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm',
                    index === active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <BilingualText en={command.en} el={command.el} compact />
                </li>
              ))}
            </ul>
          ) : null}
          {hero || band ? (
            /* One row in hero mode: dictation beside send at the right end
               (docs §107.7-7, §133.4); the scope picker is up with the chips. In
               band mode it is the quiet control at the pill's right (§135 A4). */
            <span className="flex shrink-0 items-center gap-1">
              <DictationButton value={value} onChange={setValue} size="small" />
              {band ? scopeMenu : null}
              <Button
                type="submit"
                data-testid="home-ask-submit"
                size="icon"
                disabled={!value.trim()}
                className="h-9 w-9 shrink-0 rounded-full"
                aria-label={bilingualAria('Send', 'Αποστολή')}
              >
                <ArrowUp className="icon-sm" aria-hidden="true" />
              </Button>
            </span>
          ) : (
            <div className="flex items-center gap-2 px-2 pb-2">
              {scopeMenu}
              {plain ? null : (
                <span className="ml-auto hidden text-2xs text-muted-foreground sm:inline">
                  <BilingualText en="Enter to send · Shift+Enter for a new line · / for commands" el="Enter για αποστολή · Shift+Enter για νέα γραμμή · / για εντολές" compact />
                </span>
              )}
              {/* Dictation on phones sits beside Send (docs §107.7-7, §111). */}
              <span className={cn('ml-auto flex shrink-0 items-center gap-1', !plain && 'sm:ml-0')}>
                <DictationButton value={value} onChange={setValue} size="small" />
                <Button
                  type="submit"
                  data-testid="home-ask-submit"
                  size="icon"
                  disabled={!value.trim()}
                  className="h-8 w-8 shrink-0 rounded-lg"
                  aria-label={bilingualAria('Send', 'Αποστολή')}
                >
                  <ArrowUp className="icon-sm" aria-hidden="true" />
                </Button>
              </span>
            </div>
          )}
        </form>
  );

  return (
    <section
      aria-labelledby={greeting ? `${boxId}-title` : undefined}
      aria-label={greeting ? undefined : bilingualAria('Ask the assistant', 'Ρωτήστε τον βοηθό')}
      className={hero ? 'relative rounded-3xl bg-primary p-4 text-primary-foreground sm:p-7' : band ? 'relative rounded-3xl bg-primary/10 p-4 sm:p-6' : 'space-y-3'}
      data-home-ask={greeting ? 'greeting' : 'box'}
      data-hero={hero || undefined}
      data-band={band || undefined}
      data-testid={`home-${role}-assistant`}
    >
      <div>
        <div className={hero || band ? 'min-w-0 space-y-3' : 'space-y-3'}>
          {hero ? heroBody : band ? bandBody : (
            <p id={`${boxId}-title`} hidden={!greeting} className="break-words text-sm text-muted-foreground" data-testid="home-greeting">
              {/* Without a name the greeting is just the greeting: the homes used
                  to fill in their role word, so a Greek reader met "Καλημέρα,
                  Founder." (docs §70). */}
              <BilingualText
                en={`${hello.en}${firstName ? `, ${firstName}` : ''}.${lead ? ` ${lead.en}` : ''}`}
                el={`${hello.el}${firstName ? `, ${firstName}` : ''}.${lead ? ` ${lead.el}` : ''}`}
                stacked
                wrap
                secondaryFrom="lg"
              />
            </p>
          )}
      {hero ? (
        /* The scope belongs to the question, so it stands beside the field
           (icon-only on a phone); at the end of the chips row it wrapped onto
           a row of its own whenever a role's three starting points were
           long, as the mentor's are (docs §142). */
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">{askForm}</div>
          {scopeMenu}
        </div>
      ) : askForm}

      {hero ? intentChips : band ? null : (
        <>
          {plain ? null : <HomeActionShelf actions={config.actions} now={showWaiting ? now : []} run={run} />}

          {/* The reader's own pages: pinned, then the most opened (docs §107). */}
          {plain ? null : <YourPagesRow />}
        </>
      )}
        </div>
        {/* Neither the hero nor the band carries a figure: the role glyph in
            its round well (§133.8, §135 A4) added nothing to read or do and
            crowded the card (docs §145, §147). */}
      </div>
    </section>
  );
}
