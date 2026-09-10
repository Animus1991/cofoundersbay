# Type, spacing and occlusion — per screen class

Fourth audit round. Where `docs/RESPONSIVE_UPGRADE_PLAN.md` covered *layout* per
breakpoint — what reflows, what overflows, what is reachable — this one covers
what the layout is made of: **type size, spacing rhythm, and whether anything
covers anything else**.

Companion to `docs/UPGRADE_PLAN_2026.md` (accessibility, security, tokens) and
`docs/RESPONSIVE_UPGRADE_PLAN.md` (breakpoints and shell).

---

## Method

A production build served against a stub API. A browser probe visited 26 routes
at six viewports (320, 390, 744, 1024, 1440, 1920) and read, from the live DOM:

| Signal | How | Why the source can't tell you |
|---|---|---|
| Occlusion | Pairwise box intersection of text leaves and controls, sorted-sweep, excluding layered UI and inline siblings of one paragraph | Two elements can collide only at one width, from a flex row that couldn't shrink |
| Type inventory | Computed `font-size` on every text leaf | A class name doesn't tell you what resolved after the cascade |
| Control size | Computed `font-size` on every `input`/`select`/`textarea` | iOS zoom depends on the resolved value, not the utility |
| Leading | Computed `line-height ÷ font-size` on wrapped text only | Ratio, not the raw value, is what reads |
| Spacing | Computed gap/padding/margin against the 0.125rem grid | — |
| Scale steps | Widest visible `h1`/`h2`/`h3` per viewport | Whether the scale *moves* is only visible by comparing viewports |

Two probe bugs were found and fixed before any conclusion was drawn, and both
had inflated the first numbers:

- The occlusion pass excluded anything inside an `overflow: hidden/clip`
  ancestor. The app shell wraps all content in `overflow-x-clip`, so it was
  comparing ~3 elements per route instead of ~55. Clipped elements are still
  laid out and can still collide; only *scroll* containers make positions
  incomparable.
- Off-scale spacing was tested as "not a multiple of 4px", which flags
  Tailwind's legitimate half-steps (2, 6, 10, 14px). Against the real 0.125rem
  grid, 5112 "violations" became 177, and all 177 were the browser's own
  `<option>` padding.

---

## What the measurement found

### 1. The type scale never moved

| | count |
|---|--:|
| Fixed `text-*` utilities | **5089** |
| Responsive `sm:`/`md:`/`lg:`/`xl:` type utilities | **16** |
| `<h1>` elements | 91 |
| …with any responsive step | **4** |

A page title rendered at the same size on a 320px phone and a 1920px desktop.
51 of them were `text-xl` — 20px — at every width. The shared `PageHeader`,
which draws the title on every page that uses `AppShell`, was `text-lg`: 18px,
fixed, from 320 to 1920.

Size distribution, all routes and viewports:

| px | token | instances | share |
|--:|---|--:|--:|
| 11 | `2xs` | 503 | 10% |
| 12 | `xs` | 1982 | 39% |
| 14 | `sm` | 1835 | 36% |
| 16 | `base` | 190 | 4% |
| 18+ | `lg`…`7xl` | 579 | 11% |

**85% of every string in the product was 14px or smaller, at every screen
size.** No size was off-token — the earlier normalisation pass held — but the
scale had no vertical dimension.

### 2. Form controls sat under the iOS zoom threshold

44 controls across 9 distinct shapes rendered at 12–14px. Mobile Safari zooms
the entire page when a focused control is under 16px, and the user has to pinch
back out. It is a platform rule, not a preference. The `Input`, `Textarea` and
`SelectTrigger` primitives were all `text-sm`, which is where 23 of 26 probed
routes got theirs.

### 3. One real occlusion

`/builder` at 320 and 390px: the tab strip and the header actions were one
`justify-between` row with no `min-w-0` on either side, so the four triggers
could not shrink and ran underneath the buttons.

| viewport | covered | by | occluded |
|---|---|---|--:|
| 320 | "Team" | New Document | **100%** |
| 320 | "Documents" | Invite | 73% |
| 390 | "Readiness" | New Document | 96% |
| 390 | "Team" | Invite | 60% |

A navigation label that is completely invisible is not a styling issue.

### 4. Non-findings, recorded so they are not re-investigated

- **Leading.** 172 elements measured under a 1.35 line-height ratio, but the
  detector counted any box taller than two line-heights — which includes a
  padded single-line button. The genuinely wrapped 12px prose was ~115
  elements, of which the clamped card descriptions were worth relaxing.
- **Control spacing.** Eight pairs of controls sit 2–5px apart. All are
  segmented controls and filter chips, where a hairline gap is the design and
  the pair reads as one control.
- **Line length.** No line ran past 95 characters. A handful measure under
  30 characters, all short labels in narrow columns.
- **Off-scale spacing.** None. The 177 flagged values are the UA stylesheet's
  1px `<option>` padding.

---

## The scale, after

### Type

| Role | < 640 | ≥ 640 | ≥ 1024 | ≥ 1280 | Reference |
|---|--:|--:|--:|--:|---|
| Page title (`h1`) | 20 | 24 | 24 | **30** | iOS Title3 20pt → Title1 28pt |
| Card title (`h3`) | 16 | 18 | 18 | 18 | Material titleMedium 16sp |
| Page description | **16** | 14 | 14 | 14 | iOS Body 17pt on phones |
| Form controls | **16** | 14 | 14 | 14 | Platform requirement below `sm` |
| Secondary / meta | 12 | 12 | 12 | 12 | Material bodySmall 12sp |
| Badge / counter | 11 | 11 | 11 | 11 | Material labelSmall 11sp |

Body text and controls going *down* from 16px to 14px as the screen grows is
deliberate and is how both mobile platforms and desktop web apps are set: a
phone is read at arm's length on a small panel and needs the larger size, while
a desktop can carry more density at a greater viewing distance.

`sm` (640px) is the control threshold because the zoom behaviour is an iPhone
one — the widest iPhone viewport is 430px, and phone landscape tops out under
640px. iPad Safari renders at a desktop-class viewport and does not auto-zoom,
so tablets keep the design's density.

### Spacing rhythm — `PageHeader`

| | < 640 | ≥ 640 | ≥ 1024 |
|---|---|---|---|
| Padding | `px-4 py-3` | `px-5 py-4` | `px-6 py-5` |
| Title ↔ description | 4px | 2px | 2px |
| Title block ↔ actions | 12px, stacked | 16px, inline | 16px, inline |

The header also goes inline at `sm` rather than `lg`: a tablet in portrait was
stacking a title and two buttons it had 676px of room to sit side by side.

---

## Changes

| Where | Change | Reach |
|---|---|--:|
| `layout/AppShell.tsx` `PageHeader` | Title `text-xl sm:text-2xl xl:text-3xl`; description `text-base sm:text-sm`; stepped padding; inline from `sm`; `min-w-0` | every page using `AppShell` |
| 86 page-level `<h1>` | Current size kept as the mobile step, larger steps added above | 86 |
| `ui/input.tsx`, `ui/textarea.tsx`, `ui/select.tsx` | `text-base sm:text-sm` | 3 primitives |
| `app/globals.css` | Base rule: form controls 16px below `sm` | ~38 raw controls that bypass the primitives |
| `ui/card.tsx` `CardTitle` | `text-base sm:text-lg` | every card |
| `builder/BuilderWorkspace.tsx` | Tabs and actions on separate rows below `sm`; `min-w-0` / `shrink-0` | 1 |
| `pitch/[id]/page.tsx` | Slide title `text-3xl sm:text-4xl lg:text-5xl` | 1 |
| 19 clamped 12px descriptions | `leading-relaxed` | 17 files |

The base CSS rule carries `!important` deliberately: a Tailwind text utility on
the element outranks an element selector, and that utility is exactly what is
being corrected. It is scoped to one media query and one element set.

---

## Result

| Signal | Before | After |
|---|--:|--:|
| Occluded content, 320 + 390px | 8 pairs | **0** |
| Occluded content, 744 – 1920px | 0 | **0** |
| Form controls under 16px on phones | 44 | **0** |
| Page titles with a responsive step | 4 / 91 | **91 / 91** |
| Responsive type utilities in the codebase | 16 | **160** |
| Page title at 1920px | 18–20px | **30px** |
| Page description on a phone | 14px | **16px** |
| Horizontal overflow, all 9 viewports | 0 | **0** |
| Unreachable clipped content | 0 | **0** |
| WCAG 2.5.8 target-size failures | 0 | **0** |
| Routes rendering under a partial-payload API | 147 / 147 | **147 / 147** |
| axe WCAG 2 A/AA suite | 66 tests | **70 tests, 0 failing** |

Two of the new tests are regressions for this round: form controls must be at
least 16px on phone viewports, and no laid-out element may occlude another. The
occlusion test excludes layered UI and inline fragments sharing one paragraph —
without that second exclusion it fires on the landing hero, where 72px display
type on `leading-none` gives adjacent line boxes a 20px overlap that no reader
ever sees.

---

## Limits

- Six viewports, 26 routes for the type probe; the crash and layout gates cover
  all 147.
- "Occlusion" is box intersection. Two elements that overlap without either
  hiding anything legible — a decorative rule behind a label — are excluded by
  the layering rule rather than judged.
- The 11px and 12px steps are kept. They are metadata, badges and counters,
  inside Material's 11sp `labelSmall` and iOS's 11pt `caption2`, and WCAG sets
  no minimum font size.
- Reading comfort is asserted through measurable proxies — size, leading,
  measure, target size, occlusion. Whether a screen *feels* right at a glance
  is not something this method claims to have tested.
