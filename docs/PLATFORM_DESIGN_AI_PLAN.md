# CoFounderBay — πλάνο design, συνοχής και AI OS

**Ημερομηνία:** 2026-09-08  
**Κλάδος:** `cursor/ai-os-fullpage-chat-53e0` (βάση: preview UI upgrade · git fetch: τίποτα νεότερο στο remote να γίνει merge)  
**Μέθοδος:** ανάγνωση `apps/web` (**148** `page.tsx` στο App Router, όχι το legacy `cofoundersbay/`), layout, nav, empty states, copilot, preview-api και `apps/api` (graph, shortlist, notifications, AI prefs). Όχι marketing.

Συμπληρώνει το `docs/AI_PLATFORM_UPGRADE_PLAN.md`. Εκείνο παραμένει η πηγή αλήθειας για δεδομένα/tools. Αυτό το έγγραφο καλύπτει **οπτική συνοχή, ροή ανά σελίδα, λειτουργικά κενά**, και τι υλοποιείται τώρα vs τι μένει σκόπιμα εκτός.

Ο χρήστης ζήτησε ρητά σύγχρονο UI σε όλες τις σελίδες. Αυτό **αναιρεί** το παλιό μη-στόχο «μην ξανασχεδιάσεις το visual language». Η παλέτα, τα themes και τα tokens μένουν· αλλάζουν ακτίνες, σκιά, chrome και empty states ώστε κάθε οθόνη να μοιάζει με το ίδιο προϊόν.

---

## 1. Κανόνες ελέγχου (ώστε να μείνει αντικειμενικό)

Κάθε επιφάνεια βαθμολογείται σε τέσσερις άξονες. «Πλήρης» σημαίνει μετρήσιμο, όχι αισθητικό.

| Άξονας | Ερώτηση | Απόδειξη |
|---|---|---|
| **SoT** | Τα δεδομένα προέρχονται από ένα API / ένα React Query key; | Αρχείο + endpoint |
| **AI seam** | Μπορεί ο χρήστης να ρωτήσει το copilot με context της σελίδας χωρίς να χάσει τη ροή; | `Ask AI` → `/ai?q=` ή tool |
| **Chrome** | Ίδιο AppShell, τίτλος, empty state, modal, κουμπί ρήματος; | Component, όχι copy-paste |
| **Honest** | Αν το nav υπόσχεται λειτουργία χωρίς backend, το λέμε ή το κρύβουμε; | Banner / Ask AI / αφαίρεση |

Απαγορεύσεις ελέγχου: δεν εφευρίσκουμε API, δεν στέλνουμε μηνύματα χωρίς confirm, δεν ενώνουμε matching ML με LLM ranking, δεν χάνουμε υπάρχοντα CTA.

---

## 2. Κατάσταση μετά τις φάσεις A–D (τι υπάρχει ήδη)

Υλοποιημένα και δεν ξαναγράφονται:

- Full-page `/ai` + popup `CopilotWorkspace` (ίδια tools).
- Planner + engine χωρίς Ollama: `get_graph`, `search_people`, `get_recommendations`, `send_connection`, `start_or_send_message`, `navigate`.
- `GET /api/graph/me`, `GET/PATCH /api/ai/preferences`.
- `RoleProvider` στο root layout.
- Canonical `query-keys.ts` + notification badge από `useUnreadCounts`.
- Preview demo στο Cloudflare (`/demo`) με mocks.

Ακόμα ανοιχτά (P2–P5 του παλιού πλάνου): canvas/builder/milestone tools, Feed Prisma, calendar SoT, ενιαίο realtime bus, νεκρό `/startups/[id]`, διπλά admin homes, eval suite.

---

## 3. Κατάλογος επιφανειών (σελίδα → εύρημα)

Ομαδοποίηση κατά σκοπό πλατφόρμας: εύρεση συνιδρυτή / δικτύου, εργασία ιδρυτή, ρόλοι, λογαριασμός.

### 3.1 Communicate / AI

| Επιφάνεια | SoT | AI | UI/κενό |
|---|---|---|---|
| `/ai` | Graph + copilot engine | Κέντρο | Chrome πλήρους ύψους· δεν πρέπει να δείχνει δεύτερο Ask AI |
| Popup copilot | Ίδιο engine | Maximize → `/ai` | Κρύβεται σε `/ai` και `/messages` |
| `/messages` | Conversations API | Ask AI από nav, όχι από empty inbox | Full-height· μην διπλασιάζεις hero |
| `/connections` | Connections API | Icon insight ανά accepted· λείπει Ask AI στο empty | Empty Discover CTA υπάρχει |
| `/notifications` | Notifications API | Badge OK· copilot δεν διάβαζε λίστα | Empty «all caught up» χωρίς Ask AI |

### 3.2 Explore (εύρεση ανθρώπων)

| Επιφάνεια | SoT | AI | UI/κενό |
|---|---|---|---|
| `/discover` | Search + recommendations | Κάρτες έχουν Ask AI | Bookmark έκανε μόνο toast — ψεύδος |
| `/matches` | Recommendations | Ask AI μόνο αν το βάλει το chrome | Empty → profile edit |
| `/search` | Search API | Τοπικό EmptyState χωρίς Ask AI | Τρία browse links |
| `/recommendations` | Ίδιο API με matches | Παράλληλη επιφάνεια | Συγχώνευση μακροπρόθεσμα, όχι τώρα |
| `/shortlist` | Shortlist API | Copilot δεν αποθήκευε | Preview POST γύριζε `{ ids }` |
| `/compare` | Profiles | Empty χωρίς Ask AI | |
| `/saved-searches` | Saved searches | Empty χωρίς Ask AI | |
| `/investors` | Directory | AppShell titled | |

### 3.3 Work (ιδρυτής)

| Επιφάνεια | SoT | AI | UI/κενό |
|---|---|---|---|
| `/dashboard/founder` | Profile/VRS/XP + demo widgets | Ίδιο header χωρίς Ask AI | Unread messages hardcoded `3`· query keys legacy |
| `/calendar` | **DEMO_EVENTS** | Κανένα | Add Event χωρίς API |
| `/fundraising` | **MOCK rounds** | Κανένα | Nav υπόσχεται SoT που δεν υπάρχει |
| `/projects` | MOCK | Κανένα | Ίδιο |
| `/feed` | Κλήσεις χωρίς Nest module | — | Κέλυφος |
| `/research`, `/builder`, `/milestones` | Πραγματικά APIs | Τοπικά copilots, όχι κεντρικά tools | P2 |
| `/jobs`, `/events`, `/mentoring`, `/marketplace` | Μικτά | Empty χωρίς Ask AI | Jobs «Post a job» χωρίς route |

### 3.4 Account / settings / admin / ρόλοι

Dashboards mentor/investor/provider/org/admin: AppShell υπάρχει, Ask AI όχι. Investor pipeline/portfolio empty όταν `showDemoData` off. Provider services/reviews empty χωρίς Ask AI. Settings `/settings/ai` ήδη σώζει prefs στο API.

Δεν ξαναγράφουμε 147 routes μία-μία. Ο μοχλός είναι **tokens + AppShell + EmptyState + command palette**. Ό,τι αλλάζει εκεί φαίνεται παντού.

---

## 4. Design system (υλοποίηση τώρα)

Στόχος: πιο γενναιόδωρο, πιο ήρεμο στο μάτι, χωρίς νέα παλέτα.

1. `--radius` 8px → 12px· μαλακότερες σκιές κάρτας· σταθερό radial wash στο `body` (πολύ χαμηλή αδιαφάνεια, δεν σπάει contrast).
2. `AppShell` τίτλος: έξοδος από το βαρύ bordered card· τυπογραφία σελίδας (`text-2xl`) + προαιρετικό **Ask AI** όταν υπάρχει `title` (`askAi={false}` για `/ai`).
3. `EmptyState`: δευτερεύον Ask AI (`askAiPrompt`)· το υπάρχον `action` μένει primary.
4. `Card`: `rounded-2xl`, `border-border/70`.
5. `SideNav` active: `bg-primary/10` pill.
6. `TopBar`: `bg-background/80` + `backdrop-blur-md`.
7. Command palette: Go to AI Assistant, Ask AI…, Shortlist, Matches.
8. Specialized `EmptyStates.tsx`: ίδιο δευτερεύον Ask AI.

Κανόνας 8.7 του παλιού πλάνου ισχύει: **όχι δύο ισότιμα primary**.

---

## 5. Λειτουργικά κενά που κλείνουν τώρα (σχετικά με τον σκοπό)

Σκοπός πλατφόρμας: να βρει ο ιδρυτής συμπληρωματικό άνθρωπο, να συνδεθεί, να κρατήσει shortlist, να δει τι εκκρεμεί, και να το κάνει από το AI.

| Κενό | Διόρθωση | Δεν κάνουμε |
|---|---|---|
| Discover bookmark = toast | `saveToShortlist` + invalidate `['shortlist']` | Νέο bookmark store |
| Copilot δεν βλέπει alerts | Tool `get_notifications` | Mark-all-read χωρίς confirm |
| Copilot δεν αποθηκεύει άτομο | Tool `shortlist_add` (auto + undo μέσω Shortlist) | Confirm modal — είναι αναστρέψιμο |
| Calendar/fundraising δείχνουν demo ως αλήθεια | `SampleDataNotice` + Ask AI | Ψεύτικο calendar API |
| Founder unread = `3` | `useUnreadCounts().messages` | Νέο endpoint |
| Founder query keys | `queryKeys.profileMe` / `connectionsPending` / `xpMe` | Άλλαξε το API |
| Preview shortlist POST | Mutable ids + σωστό POST/DELETE body | |
| Empty σελίδες Explore | `askAiPrompt` σε Matches/Discover/Connections/Search/Jobs/Events/Mentoring/Compare/Saved | |
| Command palette χωρίς `/ai` | Εντολές AI | Νέα shortcuts library |

---

## 6. Λειτουργικά κενά που μένουν (σκόπιμα, με αιτία)

| Κενό | Γιατί όχι τώρα |
|---|---|
| Feed Prisma / αφαίρεση nav | Προϊόντική απόφαση, όχι styling |
| Calendar union Event+Booking+Milestone | Χρειάζεται backend SoT |
| Fundraising/Projects μοντέλα | Νέο domain |
| Canvas/builder ως copilot tools | Φάση E |
| Ενιαίο realtime bus | Υποδομή |
| `/startups/[id]` 404 | Investor routing |
| Συγχώνευση `/matches` + `/recommendations` | UX απόφαση, κίνδυνος regression |
| Jobs create route | Δεν υπάρχει σελίδα· το κουμπί μένει, Ask AI εξηγεί |

---

## 7. Συγχρονισμός δεδομένων (κοινά vs ξεχωριστά)

**Κοινά (πρέπει να συγχρονίζονται):** ταυτότητα, ρόλος, unread messages/intros/notifications, shortlist ids, connection status, match scores. Μετά από write: invalidate τα keys στο `query-keys.ts`.

**Ξεχωριστά (σωστά να μην μοιράζονται):** AI conversation threads ≠ human DMs· research boards ≠ builder documents· investor pipeline ≠ founder fundraising mock· demo overlay (`showDemoData`) ≠ Prisma.

Το AI διαβάζει μόνο κοινά SoT μέσω tools. Δεν «μαντεύει» mock calendar ως αλήθεια· όταν ρωτηθεί για calendar, πλοηγεί και εξηγεί ότι η σελίδα δείχνει δείγμα μέχρι να ενωθούν milestones/sessions.

---

## 8. Ροή ύπαρξης (λογική σειρά οθονών)

```
Onboarding → Profile completeness → Discover/Matches
    → Shortlist (save) → Intro (confirm) → Messages
    → Research/Builder/Milestones (Work)
    → Calendar (σήμερα δείγμα) / Fundraising (δείγμα)
AI είναι παράλληλη ράγα: κάθε βήμα έχει Ask AI ή tool.
```

Το copilot δεν αντικαθιστά τις σελίδες· τις συμπληρώνει. Confirm για μη αναστρέψιμα (intro, πρώτο DM). Undo για shortlist.

---

## 9. Φάσεις αυτού του κύκλου

| Φάση | Περιεχόμενο | Αποδοχή |
|---|---|---|
| **H — Visual chrome** | Tokens, AppShell, Card, nav, empty Ask AI | Κάθε titled σελίδα έχει Ask AI· empty Explore οδηγεί στο `/ai` |
| **I — Honest mocks** | SampleDataNotice σε calendar/fundraising | Ο χρήστης καταλαβαίνει ότι δεν είναι live SoT |
| **J — Copilot +2 tools** | notifications, shortlist_add | «show my notifications» / «save Elena to shortlist» στο preview |
| **K — Cache truth** | Founder keys + unread + Discover save | Bookmark εμφανίζεται στο `/shortlist` |
| **Later E–G** | όπως το παλιό πλάνο | |

---

## 10. Μη-στόχοι αυτού του κύκλου

- Δεν αλλάζουμε primary hue ούτε πετάμε alliance/cofounder themes.
- Δεν αντικαθιστούμε ProfileCard / MatchCard.
- Δεν υλοποιούμε Feed, calendar API, ή builder tools.
- Δεν κάνουμε αυτόνομα DMs.
- Δεν σπάμε το skip-link / preview cookies / Cloudflare `/demo` path.

---

## 11. Υλοποίηση ανά σελίδα (mobile-first, ξεκινώντας από Overview)

Κάθε σελίδα ελέγχεται στο ίδιο πλαίσιο με το §1, **στο πραγματικό viewport κινητού (~390px)** και με ανοιχτό virtual keyboard όπου υπάρχει search. Δεν ξαναγράφουμε όλες τις διαδρομές σε έναν κύκλο.

| Σειρά | Επιφάνεια | Κριτήρια αποδοχής (mobile) | Κατάσταση |
|---|---|---|---|
| **1. Overview** `/dashboard/founder` | Greeting + Ask AI χωρίς οριζόντιο overflow· stats 2×2· banners χωρίς truncate· VRS bars = score όχι weight· demo dates στο μέλλον· command palette πάνω από το πληκτρολόγιο | Ολοκληρώθηκε |
| **2. Readiness** `/readiness` | Header stack + Ask AI· radar ticks χωρίς clip («Funding» όχι «ng Readiness»)· tabs χωρίς κομμένο History· criteria wrap + tap ≥44px· info tap αντί hover tooltip | Ολοκληρώθηκε |
| **3. Startup Builder** `/builder` | Stats 2×2 (όχι 4 ψηλές κάρτες)· inner toolbar wrap (Overview / Documents κάτω από Invite + New Document)· Ask AI στο header και Quick Actions· Create Document modal πάνω από το πληκτρολόγιο· outer tabs με σύντομα labels· sub-editor headers wrap | Ολοκληρώθηκε |
| **4. Analytics** `/analytics` | Period pills + Refresh στην ίδια wrap γραμμή· tabs min-h-10· metric cards 2×2 compact· Weekly Summary 2×2· Ask AI με τα πραγματικά metrics | Ολοκληρώθηκε |
| **5. Pitch Deck** `/builder/pitch-deck` | Header stack + Ask AI· empty state χωρίς h-[500px]· Add Slide grid χωρίς nested 200px scroll· Fill sample από Idea Core (όχι hardcoded CoFounderBay)· Save δημιουργεί pitch_deck artifact· Export honest toast | Ολοκληρώθηκε |
| **6. Discover / Matches** `/discover`, `/matches` | Stats 2×2· tabs/chips min-h-10 + σύντομα labels· search bar χωρίς overflow· Connection/Compatibility dialogs πάνω από το πληκτρολόγιο· MatchCard/list actions wrap· Ask AI με counts | Ολοκληρώθηκε |
| **6c. UI i18n** | Κάθε στοιχείο UI σε κάθε σελίδα + όλα τα sample/demo data μεταφράζονται και στις 9 γλώσσες συστήματος (en, el, es, fr, de, it, pt, zh, ja). Τα ονόματα προσώπων μένουν ως έχουν. | Ολοκληρώθηκε |
| **7. Messages** `/messages` | `fullHeight` messenger· composer πάνω από fixed bottom nav· header χωρίς overflow στα 390px· New Message → `/discover`· empty inbox `EmptyMessages` + Ask AI· intros empty + Ask AI· preview `SampleDataNotice`· Accept/Decline / tabs / composer ≥44px | Ολοκληρώθηκε |
| **8. Profile / Settings** | Compact cover στο κινητό· sticky Save στο `/profile/edit` πάνω από το nav· Settings toggles ≥44px· γλώσσα ήδη chips | Ολοκληρώθηκε (chrome)· φόρμες παραμένουν τα ίδια πεδία API |
| **9. AI** `/ai` | Full-height με inset bottom nav· ορατός τίτλος στο κινητό· composer/starters/thread rows ≥44px | Ολοκληρώθηκε (chrome) |
| **10. Work** | Feed + Fundraising/Calendar ήδη honest mock· Research wrap CTAs· Milestones 2-col stats ήδη | Feed `SampleDataNotice`· Research wrap. Δεν εφευρίσκουμε Feed Prisma |
| **11. Explore** | Marketplace sample notice + List Service → `/provider/services`· Events/Jobs/Mentoring empty ήδη Ask AI· Programs 2×2 stats | Marketplace + notifications empty Ask AI |
| **12. Modals / buttons / tabs** | Dialog top-pin + safe-area σε **όλα** τα `DialogContent`· Sheet close 44px· Tabs `min-h-11`· Button sm/md/icon 44px στο κινητό· Input `h-11` | Ολοκληρώθηκε (καθολικός μοχλός) |

**Ευρήματα Overview από live κινητό (Σεπ 2026):** chips δίπλα στο greeting έσπρωχναν τον τίτλο· «1 connection request wait...» κόβονταν· 4 stat cards σε μία στήλη· `Team (1%)` δίπλα σε bar 50% (το `1%` ήταν **weight**, όχι score)· Startup Readiness bars overflow· milestones/events με due dates Απρ–Μαρ 2026 άρα όλα overdue· command palette κομμένο από Gboard και shortcuts `G H` άσχετα σε touch.

**Ευρήματα Startup Builder από live κινητό:** Completion / Readiness / Completed / Collaborators ήταν τέσσερις ψηλές κάρτες σε μία στήλη· inner tabs (Overview, Documents) στην ίδια γραμμή με Invite + New Document· Create Document modal στο κέντρο, πίσω από το πληκτρολόγιο· Quick Actions χωρίς Ask AI· outer tabs με πλήρη labels («Business Model») που απαιτούν οριζόντιο scroll χωρίς ένδειξη.

**Ευρήματα Analytics από live κινητό:** period pills και full-width Refresh έτρωγαν ύψος· 6 metric cards σε μία στήλη με p-5 και sparkline κάτω δεξιά· Weekly Summary σε μία στήλη με μεγάλο κενό από `card-comfortable` p-6· Network Velocity labels («New Connections») στριμωγμένα σε 3 στήλες· Ask AI generic από το AppShell title, χωρίς τα metrics.

**Ευρήματα Pitch Deck από live κινητό:** toolbar (0 slides / Investor Deck / AI Generate / Export / Save) τύλιγε σε δύο γραμμές· empty Slides card δίπλα σε Add Slide με nested scroll 200px· empty editor `h-[500px]`· χωρίς Ask AI copilot· Save δεν έκανε τίποτα χωρίς activeDocument· Generate γέμιζε πάντα «CoFounderBay» αγνοώντας το Harbor Idea Core.

**Ευρήματα Discover / Matches από κώδικα + viewport 390px:** Explore tabs Search / For You / Top Matches + grid/list στην ίδια γραμμή· chip «Service Providers» μακρύ· search + Filters + Search button σε μία γραμμή· ConnectionRequest κεντραρισμένο πίσω από πληκτρολόγιο. Matches stats μία στήλη κάτω από `sm`· excellent banner CTA δίπλα στο copy· filter chips `h-7`· κουμπί 3-col άχρηστο στο κινητό· MatchCard Pass/Like/Bookmark + Breakdown + Message σε μία γραμμή· CompatibilityModal στο κέντρο· Ask AI generic από τον τίτλο.

**Ευρήματα Language από live κινητό:** η γλώσσα ήταν μόνο Radix Select στο `/settings/ai` με viewport ίσο με το ύψος του trigger — στη μικρή οθόνη φαινόταν μία γραμμή. Στο header υπήρχε Theme («System» είναι θέμα, όχι γλώσσα) αλλά όχι language. Το More sheet δεν είχε picker.

**Διορθώσεις αυτού του κύκλου:** stacked header, wrap chips, 2-col stats, banner CTA κάτω από το copy, απόκρυψη VRS weight, stacked readiness gauge, relative demo dates, Ask AI στο Quick Actions, palette pinned στο top με scroll και footer «Tap a result to go». Builder: stats 2×2, inner toolbar wrap, Ask AI στο header + Quick Actions, modal pinned στο top, σύντομα tab labels, preview sample workspace (όχι 0% kitchen-sink). Analytics: pills + Refresh wrap, compact 2×2 metrics, Weekly Summary 2×2, Ask AI με πραγματικά νούμερα, chart Y-axis χωρίς overflow. Pitch Deck: compact empty state, Add Slide 2-col tap targets, Ask AI + Fill sample από Idea Core, Save δημιουργεί artifact, Export toast. Discover/Matches: 2×2 stats, σύντομα tab/role labels, search stacked, dialogs pinned, card actions wrap, Ask AI με live counts. Language: Globe με κωδικό (EN/ΕΛ) στο header, chips στο More / Settings / AI prefs, Select χωρίς clip. Messages: `AppShell fullHeight` + bottom-nav inset, composer pinned, New Message → Discover, empty/Ask AI, preview honesty. Profile/Settings/AI/Explore: tap ≥44px, sticky save, marketplace/feed honesty. Το κόκκινο «1 Issue» πάνω στο Discover είναι το Next.js **dev error overlay**, όχι προϊόν· δεν το κρύβουμε με CSS.

**Ευρήματα Messages από κώδικα (Σεπ 2026):** το live `/messages` δεν χρησιμοποιούσε `fullHeight` (το loading/gate ναι)· `min-h-[28rem]` χωρίς `flex-1` άφηνε τον composer να μην καρφώνεται· το `MobileBottomNav` είναι `fixed`, οπότε ακόμα και fullHeight main χρειαζόταν `pb-[calc(5.25rem+env(safe-area-inset-bottom))]`. Header 390px: validation + search + disabled Phone/Video overflow. Tabs `h-9`, intro Accept/Decline `h-7`, convo ⋮ hover-only. New Message ήταν no-op (`onNewMessage={() => {}}`). Empty inbox δεν χρησιμοποιούσε `EmptyMessages`. Intros empty χωρίς Ask AI. Validation API δεν καλείται στο preview — δεν εφευρίσκουμε handler.

---

## 12. Κατάλογος 148 σελίδων (App Router) και μοχλός αναβάθμισης

Δεν ξαναγράφουμε 148 routes μία-μία σε έναν κύκλο. **Κάθε σελίδα κληρονομεί** tokens, `AppShell` (Ask AI όταν έχει `title`), `EmptyState` Ask AI, `DialogContent` top-pin, Tabs ≥44px, Button/Input ≥44px στο κινητό, i18n DOM walker. Παρακάτω η απογραφή ώστε να μην υπάρχει παράλειψη ως προς *πού* εφαρμόζεται ο μοχλός vs *τι μένει σκόπιμα* (§6).

### Communicate
`/ai` `/messages` `/connections` `/notifications` `/activity`

### Explore (άνθρωποι / δίκτυο)
`/discover` `/matches` `/matches/[userId]` `/matches/compare` `/search` `/recommendations` `/shortlist` `/compare` `/saved-searches` `/investors` `/members` `/profiles/[userId]` `/p/[username]` `/endorsements` `/referrals`

### Work (ιδρυτής)
`/dashboard` `/dashboard/founder` `/readiness` `/analytics` `/builder` `/builder/pitch-deck` `/builder/applications` `/research` `/research/[boardId]` `/research/canvas` `/milestones` `/milestones/new` `/calendar` `/fundraising` `/projects` `/projects/create` `/projects/[projectId]` `/feed` `/pitch/[id]` `/data-room/[id]` `/coaching` `/learning` `/reputation` `/achievements` `/expert-reviews`

### Explore (αγορά / κοινότητα)
`/events` `/events/create` `/jobs` `/mentoring` `/marketplace` `/programs` `/opportunities` `/groups` `/groups/[groupId]` `/groups/manage` `/groups/moderation` `/invite`

### Account
`/profile` `/profile/edit` `/settings` `/settings/ai` `/settings/billing` `/settings/notifications` `/settings/data-export` `/onboarding` `/demo` `/(auth)/*` `/auth/*` `/privacy` `/terms` `/pricing` `/help` `/api-status` `/themes/alliance` `/share/[token]`

### Role dashboards
Founder ήδη. Mentor: `/dashboard/mentor` `/mentor/*`. Investor: `/dashboard/investor` `/investor/*`. Provider: `/dashboard/provider` `/provider/*`. Org/incubator: `/dashboard/incubator` `/org/*`. Tenant: `/tenant/*`. Admin: `/admin` `/admin/*`.

**Κριτήριο «πλήρης» για ρόλους που δεν είναι founder-primary:** ίδιο chrome (AppShell + Ask AI + tap targets + dialogs + i18n). Δεν αλλάζουμε domain APIs mentor/investor/org σε αυτόν τον κύκλο.

**Git (2026-09-08):** `git fetch` `cursor/ai-os-fullpage-chat-53e0`, `cursor/ui-upgrade-cloudflare-preview-53e0`, `main` — HEAD ήδη ίσο με origin του feature branch· τίποτα να γίνει pull/merge. 29 commits μπροστά από το preview base.

---

## 13. Έλεγχος GitHub 2026-09-10 (άλλο LLM + integration)

**Μέθοδος:** `git fetch origin --prune`. Σύγκριση όλων των remote heads. Δεν έγινε full merge του Claude branch (335 conflicts, κοινός πρόγονος το April `main` `91d6ea3` — θα έσβηνε preview-api, i18n, Ask AI chrome).

| Remote | SHA (εκείνη τη στιγμή) | Σχέση με HEAD |
|---|---|---|
| `integration/ai-platform-upgrade` | `d5d332b` | 0 ahead / 0 behind — **πιο ανεπτυγμένο προϊόν** |
| `cursor/ai-os-fullpage-chat-53e0` | `d5d332b` | ίδιο |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | `c10ece1` | βάση PR #3 |
| `main` | `91d6ea3` | πίσω· 0 unique vs integration |
| `claude/project-audit-upgrade-y2ebnr` | `f1fc7fc` | 27 unique SHAs / 95 unique δικά μας |

**Νέα Claude commits από το προηγούμενο cherry-pick (`b2b9fdb`→`f1fc7fc`):** e5b1ab1 crash guards, bbdbfdd responsive 9 viewports, 2c9c2ad docs, ffad3bb skip-link, 977a87d stacked banners, f1fc7fc type scale + builder occlusion.

**Υιοθετήθηκαν πάνω στο integration (όχι full merge):**
- Partial-payload guards: discover `hits`, matches/[userId], search `href`, BehavioralNudge `ctaHref`, VentureReadinessCard, XP widget, admin billing Radix `SelectItem`.
- Fixed network banner + μετρημένο `--banner-network` ώστε το sticky header να μην γλιστράει από κάτω. Demo bar **δεν** επανήλθε (μένει το PreviewDemoBadge στο TopBar). Preview `/demo` συνεχίζει να κρύβει το API-down banner.
- Τίτλοι AppShell/PageHeader 20→24px (`sm:text-2xl`). Δεν υιοθετήθηκε το `xl:text-3xl` του Claude: οι δίγλωσσοι τίτλοι μας τυλίγονται άσχημα στα 30px. CardTitle `text-base sm:text-lg`. Switch 24×44 (WCAG 2.5.8). Select 16px σε τηλέφωνο. iOS zoom rule στα raw controls. `grid-cols-1` στο builder overview.

**Σκόπιμα όχι:** πλήρες merge, Claude `error.tsx` layouts που διπλο-αποδίδουν chrome, OpenNext Cloudflare Workers deploy, tablet rail από `sm` (θα έσπαγε το MobileBottomNav), 86 page-local `<h1>` (καλύπτονται από AppShell), Claude axe Playwright (δικό τους mock API). Skip-link ήδη fully clipped στο δικό μας CSS — δεν είχε το 4px leak του `translateY(-120%)`.

### 13.1 Έλεγχος 2026-09-11

`git fetch origin --prune`. Integration **δεν** κινήθηκε (`d5d332b`· εμείς 2 commits μπροστά). Claude `c0e0b9c` (ένα νέο SHA): audit ότι δεν αφαιρέθηκε λειτουργία + δύο διορθώσεις. Full merge ακόμα 336 conflicts.

Υιοθετήθηκαν: κεντράρισμα του «Back online!» όταν δεν υπάρχει κουμπί· `/tenant/automation` χωρίς org παύει να είναι dead-end (EmptyState + `/tenant/dashboard` + `/org/dashboard` + Ask AI). Δεν αντιγράφηκε το `FUNCTIONALITY_PRESERVATION_AUDIT.md` του Claude — μετράει το δικό τους April fork, όχι αυτή τη γραμμή.

### 13.2 Έλεγχος 2026-09-11 (βράδυ)

Claude `2e5b104`: WCAG AA σε 13 theme contexts + 2.5% στο πάνω μέρος της type scale. Full merge ακόμα 336 conflicts. Integration δεν κινήθηκε.

Τα περισσότερα accent-foreground fails του Claude **είχαν ήδη διορθωθεί** σε αυτή τη γραμμή (`--primary-accessible` / σκούρο μελάνι σε alliance/mentor/investor). Στατικός έλεγχος (`apps/web/scripts/check-theme-contrast.py`) βρήκε 3 υπόλοιπα <4.5:1:

- system `--primary-accessible` 48%→50% (link on card)
- system `--destructive-accessible` 69%→70% (error on card)
- alliance `--muted-foreground` 44%→43% (muted fill)

Επίσης light/alliance `--destructive` 50%→49% (περιθώριο 4.70) και Tailwind `3xl`–`7xl` −2.5%. Μετά: **0 failures**. Δεν μπήκε το Claude axe spec (εξαρτάται από το δικό τους Playwright mock).

### 13.3 Έλεγχος 2026-09-11 (πρωί)

Claude `141552e`: desktop `html { font-size: 82% }` από 1024px και τίτλοι τηλεφώνου στο 97%. Full merge ακόμα 336 conflicts. Integration δεν κινήθηκε.

Υιοθετήθηκε η κλίμακα. Κρατήθηκαν όρια που οι ίδιοι μέτρησαν αλλά δεν εφάρμοσαν: 11px floor (`text-2xs`, bilingual secondary) και 24px min στα interactive (WCAG 2.5.8 — 24px γίνεται 19.7px στο 82%). Sidebar `240px`/`68px` → `15rem`/`4.25rem` ώστε το chrome να σμικρύνει μαζί με τα rem, όχι να μείνει σε px. Body `0.9375rem` ώστε στα τηλέφωνα να μείνει 15px.

### 13.4 Έλεγχος 2026-09-11 (μεσημέρι)

Claude `803ddb2`: έκτο theme **Minimal** (warm paper, ένα teal accent, component layer μόνο στο `[data-theme="minimal"]`) + πλήρες πλάτος στήλης σε `/settings/data-export` και `/invite` (base `grid-cols-1` στα stats). Full merge ακόμα ~336 conflicts. Integration δεν κινήθηκε (`d5d332b`).

Υιοθετήθηκαν: tokens + component layer (με `--primary-accessible` / `--destructive-accessible` αντί για `--primary-emphasis`), `ThemeSwitcher` + `RoleTheme` + `ThemeToggle`, πλάτος Invite/Data Export. **Δεν** αντιγράφηκε το `removeAttribute('data-theme')` για κάθε άλλο theme — θα έσβηνε alliance/cofounder. Δεν αντιγράφηκε το `TYPE_AND_SPACING_PLAN.md` του Claude (μετράει το δικό τους fork). Prose pages (`/terms`, `/privacy`, `/pricing`) μένουν με measure cap.

### 13.5 Έλεγχος 2026-09-11 (βράδυ)

`git fetch origin --prune`. **Πιο ανεπτυγμένο προϊόν:** `integration/ai-platform-upgrade` `6e1fae9` — fast-forward 3 commits πάνω στο δικό μας `adf7193` (0 unique εδώ). Claude `1501b70` (corners/borders). Full merge Claude ακόμα ~336 conflicts.

Τραβήχτηκαν με `git merge --ff-only origin/integration/ai-platform-upgrade` (καμία παράλειψη από τη γραμμή προϊόντος):

- `b3a7083` — guard `overall.score` στο match-detail (το παλιό `typeof overall !== 'number'` έσπαγε κάθε valid payload)· preview-api `/api/recommendations/vs/*` + streak· fundraising phone rows χωρίς clip· ask_ai_hint χωρίς truncate.
- `40e75bc` — harvest του Claude `1501b70`: `--border` ~1.45:1 σε και τα 6 themes· `--radius: 8px` στο Minimal (όχι `0.5rem` που έγινε 6.56px στο 82%)· ChatBubble unread pill hover/focus, όχι μόνιμο overlay.
- `6e1fae9` — tablet rail από `sm` (bottom nav `sm:hidden`)· `<Button asChild><Link>` αντί για nested interactive· overflow στα TopBar/stats/profile· BilingualText `secondaryFrom` + κυριολεκτικά class names ώστε το Tailwind να μην πετάει τα utilities.

**Σκόπιμα όχι από Claude `1501b70`:** αντικατάσταση όλης της radius ladder (η δική μας είναι ήδη px από `--radius` στο `tailwind.config.ts`)· squircle `corner-shape` + 101 αρχεία rounded recode· `docs/CORNER_AND_BORDER_PLAN.md` και axe spec του April fork.

### 13.6 Έλεγχος 2026-09-12 (πρωί)

`git fetch origin --prune`. **Πιο ανεπτυγμένο προϊόν:** `integration/ai-platform-upgrade` `3f7c793` — 4 commits μπροστά από `6e1fae9` (το δικό μας `9a45209` docs είναι ίδιο patch-id με το `c4ce7b9`). Claude fork ακόμα `1501b70`. Full merge Claude ακόμα ~336 conflicts.

Τραβήχτηκαν με `git merge origin/integration/ai-platform-upgrade` (καμία παράλειψη):

- `0e391f8` — UTC `timeZone`/`locale` σε κάθε `toLocale*` στο render· `LocalTime` για ώρες· `/calendar` demo events και grid σε UTC (hydration 0/60 σε 3 ζώνες).
- `94f003d` — floor `text-xs` στα 11px· `tap-target` 24px στα 43 failures του 82%· contrast BilingualText / match-detail hex / opacity· JetBrains Mono μέσω next/font· XP fraction, preview `/profiles/[userId]`, `sanitize.ts` χωρίς throw.
- `3f7c793` — +5% στα βήματα κάτω από `text-lg` μόνο από 1024px· display sizes αμετάβλητα.

### 13.7 Έλεγχος 2026-09-12 (απόγευμα)

`git fetch origin --prune`. **Πιο ανεπτυγμένο προϊόν:** `integration/ai-platform-upgrade` `0a0a9ed` — 4 commits πάνω στο `3f7c793`. Claude fork ακόμα `1501b70`. Full merge Claude ακόμα ~336 conflicts.

Τραβήχτηκαν με `git merge origin/integration/ai-platform-upgrade` (καμία παράλειψη):

- `c906586` — επιπλέον +3% στα μικρά βήματα (σύνολο +8.15% από το αρχικό desktop)· `text-lg+` αμετάβλητα.
- `3fb23a5` — μικρά +2%, display −2%· `sm:text-2xl` παίρνει ρητό override.
- `b627cb0` — αφαίρεση `max-w-shell`· η στήλη γεμίζει ό,τι αφήνει το sidebar· gutter `2xl`· HelpCallout/header 90ch· compose στο `/messages` σε δική του γραμμή.
- `0a0a9ed` — gutter 1.2rem (+~2% πλάτος στήλης)· μικρά +2% / display −2%· sidebar headings −2% (`.nav-section-label`)· wrap στα profile stats.

Αντικειμενικό υπόλοιπο που καταγράφει το ίδιο το integration: μετά το `0a0a9ed`, `text-base` (14.76px) είναι μεγαλύτερο από `text-lg` (14.18px). Δεν το «διορθώνουμε» εδώ — είναι μέρος της γραμμής προϊόντος.

### 13.8 Έλεγχος 2026-09-13

`git fetch origin --prune`. **Πιο ανεπτυγμένο προϊόν:** `integration/ai-platform-upgrade` `93e1c58` — 7 commits πάνω στο `0a0a9ed`. Claude fork ακόμα `1501b70`. Full merge Claude ακόμα ~336 conflicts.

Τραβήχτηκαν με `git merge origin/integration/ai-platform-upgrade` (καμία παράλειψη):

- `599d4ab` / `3d7326c` — type pass 5–6: μικρά +2%, display και sidebar headings κρατημένα.
- `53d9bbc` — pass 7 + καθάρισμα catalogues (70 σκουπίδια/locale: timestamps, Tailwind, ids)· διόρθωση de `{count}`.
- `68e97c0` — `/builder` Readiness: preview-api workspace handlers + guards (`problemClarity` crash)· glossary· pass 8· sidebar sizes παγωμένα.
- `48a1ea9` — pass 9 + phrase-level i18n (nail/deck/SAFE/seed/canvas/round).
- `487f485` / `93e1c58` — rail + top-bar icons +2% μετά +3% (μόνο `aside`/`header` από `lg`)· page icons αμετάβλητα.

Υπόλοιπο κλίμακας (καταγεγραμμένο στο integration): `text-base` πέρασε και το `text-xl`· heading μικρότερο από body. Δεν το αλλάζουμε εδώ.


### 13.9 Έλεγχος 2026-09-13 (απόγευμα) — regression στο test harness

`git fetch origin --prune`. **Πιο ανεπτυγμένο προϊόν:** αυτή η γραμμή (`aba3dd9`) — περιέχει `integration/ai-platform-upgrade` `93e1c58`, `cursor/ui-upgrade-cloudflare-preview-53e0`, `main`, `master`. Claude fork ακόμα `1501b70` και **πιο πίσω, όχι πιο μπροστά**: `git diff HEAD..claude` δίνει 18.925 insertions αλλά **59.978 deletions** (λείπουν όλα τα `strings-*`, `page-registry`, `preview-api`, `semantic-colors`). Full merge θα αφαιρούσε λειτουργικότητα — μένει έξω.

**Μετρημένη κατάσταση:** `tsc --noEmit` καθαρό. API 140/140. Web **207/228 — 21 failures**.

Αιτία: το `6e1fae9` (tablet rail) πρόσθεσε `window.matchMedia` στο `SidebarProvider` (`SidebarContext.tsx:76`) χωρίς το jsdom να το υλοποιεί. Το `MobileNavigation.test.tsx` mountάρει `SidebarProvider`, άρα και τα 21 tests του έσκαγαν με `TypeError: window.matchMedia is not a function`. Το `6e1fae9` καταγράφηκε στο §13.5 ως «καμία παράλειψη» χωρίς να τρέξει η σουίτα, οπότε το regression έμεινε 2 μέρες στο tip.

Διόρθωση στο **σωστό επίπεδο**: `.devin/vitest.setup.ts` με polyfill του `matchMedia` (width queries αποτιμώνται σε `window.innerWidth`· feature queries μένουν `false`). Δεν μπήκαν guards στα 8 production call sites — κάθε browser-στόχος έχει `matchMedia` από το 2013· το κενό είναι του jsdom. Μετά: **228/228, 28/28 files**.

Παρατήρηση DX: το `UserMenu.test.tsx` τρώει 519s από τα 597s της σουίτας (87%).

## 14. Wave 0 — η κλίμακα ξανατρέχει σε σειρά

### 14.1 Το εύρημα

Εννέα passes ανέβασαν κάθε βήμα κάτω από το `text-lg` σε ×1,2182660 και κράτησαν το `text-lg` και πάνω σε ×0,9604. Στα ≥1024px (root 82% = 13,12px) η σκάλα είχε σταματήσει να ανεβαίνει:

```
text-xs 13,401 · text-sm 13,986 · text-lg 14,176 · body 14,984 · text-xl 15,751 · text-base 15,984
```

Παράγραφος μεγαλύτερη από το section heading πάνω της και από το card heading. Μόνο το βάρος τα χώριζε. **Ο rail είχε την ίδια αντιστροφή** (`aside .text-base` 15,823 > `aside .text-xl` 15,751 > `aside .text-lg` 14,176).

### 14.2 Γιατί καμία από τις δύο προτεινόμενες λύσεις δεν δούλευε

Το σχόλιο στο `globals.css` πρότεινε δύο διορθώσεις. Ελέγχθηκαν και **οι δύο αποτυγχάνουν**: αν το `text-lg` ταξιδέψει με τα κάτω βήματα πάει στα 17,98px· αν το threshold ανέβει στο `text-xl` το `text-xl` πάει στα 19,98px. Και τα δύο ξεπερνούν το άγκυρα-`text-2xl` των 18,90px, άρα μόνο μετακινούν την αντιστροφή ένα βήμα πάνω. Τα δύο μισά έχουν αποκλίνει 23% — κανένα threshold μέσα στη σκάλα δεν το κλείνει.

### 14.3 Τι μπήκε

Γεωμετρική παρεμβολή των δύο ορφανών βημάτων στο χώρο που **υπάρχει**, μεταξύ `text-base` (15,984) και της άγκυρας `text-2xl` (18,901), με τον λόγο που αυτά τα δύο ορίζουν (×1,0574676):

```
text-2xs 13,401 · text-xs 13,401 · text-sm 13,986 · body 14,984
text-base 15,984 · text-lg 16,902 · text-xl 17,874 · text-2xl 18,901
```

`text-2xl` και κάθε display βήμα πάνω του **αμετάβλητα στο ψηφίο** — είναι τα στοιχεία που ονοματίζονταν σε κάθε pass. Τίποτα κάτω από το `text-lg` δεν κινήθηκε. Ο rail πήρε τον δικό του λόγο (×1,0610395) προς την ίδια άγκυρα.

### 14.4 Δεύτερο εύρημα: τα responsive variants δεν είχαν αγγιχτεί ποτέ

Και τα εννέα passes ρύθμισαν **μόνο** τα unprefixed utilities. Κάθε `sm:`/`md:`/`lg:` κλάση έπεφτε στην ωμή κλίμακα του Tailwind πάνω στο 82% root. Μετρημένο στα 1024px:

```
sm:text-xs   9,84px έναντι 13,40      sm:text-sm  11,48px έναντι 13,99
sm:text-lg  14,76px έναντι 16,90      sm:text-xl  16,40px έναντι 17,87
sm:text-2xl 19,68px έναντι 18,90      sm:text-4xl 28,79px έναντι 27,65
```

Τα δύο πρώτα έσπαγαν ευθέως το τεκμηριωμένο 11px floor. Τα τρία call sites του `sm:text-xs` είναι γραμμένα `text-[11px] ... sm:text-xs` — δηλαδή το variant **κατέβαζε** ρητά ορισμένα 11px στα 9,84px, ακριβώς στο viewport όπου υποτίθεται ότι μεγάλωνε (δύο φορές στο founder dashboard, μία στο `/discover`). Μπήκαν overrides για τα 18 variants που χρησιμοποιεί το προϊόν, `sm:` πριν `md:`, δηλωμένα μετά τα unprefixed ώστε το `text-base sm:text-sm` να λύνεται όπως το λύνει το ίδιο το Tailwind.

### 14.5 Ο φρουρός

`apps/web/src/app/typeScaleOrder.test.ts` — 6 tests. Διαβάζει το `globals.css`, βγάζει το 82% root από το ίδιο το αρχείο και αποτιμά κάθε βήμα σε **rendered pixels**: η σκάλα ανεβαίνει (page + rail), το body δεν ξεπερνά το heading, κανένα βήμα κάτω από 11px, και **κάθε responsive variant που χρησιμοποιεί το προϊόν έχει override** — αυτό το τελευταίο βρήκε αμέσως 5 ακόμα (`sm:text-5xl`, `sm:text-6xl`, `md:text-6xl`, `lg:text-6xl`, `lg:text-7xl`) που είχαν ξεφύγει από το χειροκίνητο grep. Επαληθεύτηκε ότι πιάνει το αρχικό defect: με το `text-lg` πίσω στο `1.08045rem` λέει `text-lg (14.176px) is smaller than text-base (15.984px)`.

### 14.6 Διορθωμένος ισχυρισμός για την ταχύτητα

Το `UserMenu.test.tsx` τεκμηρίωνε ότι `waitFor`/`findBy*` κοστίζουν «~20s per call» σε αυτό το config και το χρησιμοποιούσε ως λόγο αποφυγής async queries. **Μετρήθηκε: 4–19ms**, είτε η assertion είναι τετριμμένη είτε ρωτά rendered node. Το κόστος του αρχείου είναι το mount/open του Radix menu κάτω από jsdom (~1,9s ανά κύκλο), όχι το retry loop. Ο ισχυρισμός διορθώθηκε επί τόπου ώστε να μη χρησιμοποιηθεί αλλού ως τεκμήριο.

**Κατάσταση:** web 234/234 (29 files), api 140/140, `tsc --noEmit` καθαρό, `postcss` parse καθαρό (214 rules).

## 15. Wave 1a — το Action Registry

### 15.1 Γιατί

Μια δυνατότητα του assistant υπήρχε σε **τέσσερα ασύνδετα σημεία**: ένα όνομα στο `CopilotToolName`, ένα keyword branch στο `copilot-planner`, ένας proposal builder μέσα στο `runCopilotTurn`, και ένα σκέλος του `if` chain στο `executeCopilotAction`. Τίποτα δεν τα έδενε, άρα το tool catalogue που χρειάζεται ένα μοντέλο **δεν μπορούσε να παραχθεί**, και το platform inventory (155 routes, 499 endpoints, 3.672 surfaces) δεν είχε τρόπο να πει σε πόσα από αυτά φτάνει ο assistant. Έφτανε σε τέσσερα.

### 15.2 Τι μπήκε

`apps/web/src/lib/action-registry.ts` — μία δήλωση ανά δυνατότητα: δίγλωσσο label/description, param specs, `kind` (read/mutation), `writes`, **`reversal`** (πώς το παίρνει πίσω ο χρήστης, δηλωμένο ακόμη και όταν η απάντηση είναι «δεν αναστρέφεται»), `confirmLabel`, executor.

Από αυτό παράγονται:
- `executeAction()` — το `executeCopilotAction` πλέον **delegates**. Το `if` chain έφυγε· η συμπεριφορά όχι (parity tests παρακάτω).
- `toToolCatalog()` — JSON Schema για function calling. **Δεν έχει συνδεθεί ακόμη σε μοντέλο** — αυτό είναι το 1b. Παράγεται και ελέγχεται, ώστε να μην μπορεί να αποκλίνει από αυτό που ο executor δέχεται.
- `resolveRouteTarget()` — πλοήγηση με το όνομα της σελίδας από το `PAGE_REGISTRY`.

### 15.3 Μετρημένη επέκταση εμβέλειας

Ο planner είχε **18 hand-written aliases**. Το `PAGE_REGISTRY` έχει δίγλωσσο τίτλο για κάθε σελίδα. Μετρημένο: **100 static routes, 95 διακριτοί προορισμοί προσπελάσιμοι με το όνομά τους, 0 unreachable** — από 18. Τα aliases ελέγχονται **πρώτα**, άρα καμία φράση δεν αλλάζει προορισμό· το test το κατοχυρώνει για κάθε key του πίνακα.

Καταγράφεται και το trade-off: το `'pitch'` είναι alias για `/builder`, οπότε το «open the pitch deck» συνεχίζει να πάει στο `/builder` και όχι στο πιο ειδικό `/builder/pitch-deck`, παρόλο που ο resolver μόνος του θα το έβρισκε. Προτιμήθηκε η διατήρηση έναντι της ακρίβειας, και υπάρχει test που το λέει ρητά αντί να το κρύβει.

### 15.4 Εύρημα κατά τη διάρκεια

Τα ελληνικά titles **δεν** είναι στο `PAGE_REGISTRY`: μόνο 2 από ~100 entries γράφουν `titleEl` inline· τα υπόλοιπα ζουν στο `strings-pages.ts` και τα συνθέτει το `getPageMeta`. Η πρώτη υλοποίηση διάβαζε τον raw array, οπότε **κάθε ελληνική φράση ήταν αδύνατο να λυθεί**. Το βρήκε το δικό μου test, όχι επιθεώρηση. Η resolution περνά τώρα από το `getPageMeta`.

### 15.5 Ο φρουρός

`apps/web/src/lib/actionRegistry.test.ts` — 21 tests. Διαβάζει τα union members από το `copilot-types.ts` **στατικά**, ώστε ένα νέο tool name χωρίς registry entry να αποτυγχάνει εδώ και όχι τη στιγμή που το ζητά το μοντέλο. Κατοχυρώνει: κάθε δηλωμένο tool έχει entry· κάθε `CopilotActionTool` είναι εκτελέσιμο mutation· κάθε mutation δηλώνει δίγλωσσα confirmLabel και reversal· κανένα read δεν είναι `writes`· το catalogue είναι καλοσχηματισμένο και κάθε `required` όνομα ορίζεται στα properties· **executor parity** για τα 4 mutations (ίδιες κλήσεις API, ίδια error strings `Missing user`/`Missing receiver`/`Unsupported action`, non-string note πέφτει, σφάλμα API επιστρέφεται αντί να πεταχτεί).

**Κατάσταση:** web 234/234 → **255/255** (30 files), `tsc --noEmit` καθαρό.

### 15.6 Τι μένει για το 1b

Το `ollama.service.ts` στέλνει ακόμη μόνο `model`/`messages`/`options`. Για πραγματικό tool calling χρειάζεται απόφαση **πού ζει το catalogue**: ο web client το στέλνει με το request, ή το API κρατά δικό του registry. Και ο tool-call loop (model → tool_call → execute → feedback → continue) θέλει τον confirm/undo pipeline του Wave 2 πρώτα, γιατί το `AGENTS.md` απαγορεύει ρητά αυτόματη επανάληψη AI POST μετά από μερικό streaming ή σφάλμα authorization/rate-limit.

## 16. Wave 2 — αναστρεψιμότητα που έχει επαληθευτεί, όχι δηλωθεί

### 16.1 Το πρώτο πράγμα που βρήκε ο έλεγχος ήταν δικό μου ψέμα

Το Wave 1a δήλωσε το `reversal` ως **πρόζα**. Για το `send_connection` έγραψα: «The request appears in Connections and can be withdrawn there». **Είναι ψευδές.** Επαληθεύτηκε στον κώδικα:

- `ConnectionsController` εκθέτει μόνο `@Post()`, `@Get()`, `@Patch(':connectionId')`, `@Post('block/:userId')`, `@Get('status/:userId')`. **Καμία διαδρομή ανάκλησης για τον αποστολέα.**
- Το `@Patch` είναι το `respondToRequest`, που κάνει `throw new ForbiddenException('Not authorized')` αν `connection.receiverId !== userId`. Είναι του **παραλήπτη**, όχι του αποστολέα.
- Το `sendRequest` δημιουργεί notification στον παραλήπτη **πριν** επιστρέψει.

Αυτό είναι ακριβώς η κλάση σφάλματος που προειδοποιεί το `AGENTS.md` («Inspect actual API behavior before claiming that an archive is reversible»), και την έκανα εγώ, στο ίδιο commit που εισήγαγε το πεδίο.

### 16.2 Η πραγματική αναστρεψιμότητα των τριών writes

| Action | Πραγματικότητα | Τεκμήριο |
|---|---|---|
| `shortlist_add` | **full** | `DELETE /api/shortlist/:userId` → `savedProfile.deleteMany`. Πραγματική διαγραφή, κανείς δεν ειδοποιείται. |
| `send_connection` | **none** | Δεν υπάρχει route ανάκλησης· ο παραλήπτης ειδοποιείται αμέσως. |
| `start_or_send_message` | **none** | `MessagingController` δεν έχει delete· το `getOrCreateDirectConversation` επιστρέφει **ίδιο `{ id }`** είτε βρήκε είτε δημιούργησε, άρα ένα undo δεν μπορεί να ξεχωρίσει «το φτιάξαμε εμείς» από «ήταν ήδη του χρήστη». Το archive του δεύτερου θα κατέστρεφε δεδομένα που ο assistant δεν δημιούργησε. |

Δηλαδή **1 από τα 3 writes** είναι όντως αναστρέψιμο.

### 16.3 Ο τύπος επιβάλλει την ειλικρίνεια

Το `reversal` έγινε **discriminated union**: το `kind: 'full' | 'partial'` απαιτεί τη συνάρτηση `undo`. Το `kind: 'none'` την απαγορεύει (`undo?: never`). **Μια δήλωση αναστρεψιμότητας δεν μεταγλωττίζεται χωρίς την υλοποίησή της** — ο μόνος τρόπος να μείνει αληθής όσο το registry μεγαλώνει. Το test το κατοχυρώνει και αντίστροφα, διαβάζοντας το `undo` μέσα από widened view ώστε η assertion να **ελέγχει** αντί να επαναλαμβάνει τον τύπο.

### 16.4 Preview → confirm → apply → undo

- **preview:** το `ActionCard` δείχνει την αναστρεψιμότητα **πριν** το confirm, με `AlertTriangle` και `text-destructive` όταν `writes && kind === 'none'`. Για το `navigate` (`writes: false`) δεν δείχνει γραμμή — θα ήταν θόρυβος σε κάθε κάρτα. Η δυνατότητα **δεν** αφαιρείται: η προειδοποίηση συνοδεύει το κουμπί, δεν το αντικαθιστά.
- **undo:** `undoAction()` στο registry, `chat.undoAction` στο hook, κουμπί «Undo» μόνο όπου `isUndoable`. Αρνείται τα `none` με `Not reversible` **χωρίς να αγγίξει API**, αντί για best-effort που θα χτυπούσε το Forbidden PATCH του παραλήπτη.
- Νέο status **`undone`**, διακριτό από `dismissed`: το δεύτερο σημαίνει «δεν έτρεξε ποτέ», το πρώτο «έτρεξε και αναιρέθηκε». Η συγχώνευσή τους θα έχανε το γεγονός ότι ένα write έφτασε στο backend.
- Το invalidation μπήκε σε κοινό `invalidateFor(tool)` ώστε το undo να ανανεώνει **τα ίδια** caches με την ενέργεια που αναιρεί.

### 16.5 Δίγλωσσα, επί τη ευκαιρία

Τα `Done`/`Open`/`Dismiss`/`Dismissed` του `ActionCard` ήταν hardcoded αγγλικά. Πέρασαν σε `BilingualText` μαζί με τα νέα `Undo`/`Undone`, και τα `tap-target-y` μπήκαν στα κουμπιά (WCAG 2.5.8 στο 82% root). Μειώνει την επιφάνεια του Wave 3.

### 16.6 Τεστ

`actionRegistry.test.ts` 21 → **29**, νέο `ActionCard.test.tsx` με **8**. Κατοχυρώνουν: κάθε claim αναστρεψιμότητας έχει undo και κάθε `none` δεν έχει· κάθε write δηλώνει reversal· το undo του shortlist καλεί `removeFromShortlist`· τα δύο `none` επιστρέφουν `Not reversible` **και δεν καλούν κανένα API**· το UI προειδοποιεί πριν το confirm, δεν προσφέρει Undo όπου δεν υπάρχει, και ξεχωρίζει `undone` από `dismissed`.

**Κατάσταση:** web 255/255 → **271/271** (31 files), `tsc --noEmit` καθαρό.

### 16.7 Τι μένει από το Wave 2

**Audit trail.** Δεν μπήκε. Χρειάζεται πίνακα Prisma + endpoints ώστε να καταγράφεται τι έκανε ο assistant, πότε, με ποια args και ποιο αποτέλεσμα — δηλαδή αλλαγή στο backend με migration. Το in-memory `status` της συνομιλίας **δεν** είναι audit trail: χάνεται στο reload. Δεν το δηλώνω ως γίνον.

## 17. Wave 1b — μία πηγή αλήθειας, με επιβολή στον server

### 17.1 Τι μετακόμισε και τι όχι

`packages/shared/src/actions/` κρατά πλέον το **δηλωτικό** μισό: δίγλωσσο copy, params, `kind`, `writes`, `reversal` (kind + explanation), `confirmLabel`, και το `toToolCatalog()`. Οι **executors μένουν στην εφαρμογή** — κλείνουν πάνω στο API client της και μια συνάρτηση δεν περνά το σύνορο πακέτου ως δεδομένο.

### 17.2 Η εγγύηση επέζησε της μετακόμισης

Στο Wave 2 η ειλικρίνεια επιβαλλόταν από discriminated union μέσα σε **ένα** object. Περνώντας το σύνορο, η εγγύηση αναδιατυπώθηκε:

```ts
ACTION_DECLARATIONS = [...] as const satisfies readonly ActionDeclaration[]

type MutationActionId = Extract<DeclaredAction, { kind: 'mutation' }>['id'];
type UndoableActionId = Extract<DeclaredAction, { reversal: { kind: 'full' | 'partial' } }>['id'];
```

Η εφαρμογή δένει `EXECUTORS: Record<MutationActionId, Executor>` και `UNDOS: Record<UndoableActionId, Executor>`. **Δήλωσε mutation χωρίς executor, ή claim αναστρεψιμότητας χωρίς undo, και το αρχείο δεν μεταγλωττίζεται.** Το `as const` επαληθεύτηκε ότι διατηρεί και τα 8 literal ids στο εκπεμπόμενο `.d.ts`.

Δύο παγίδες που βρήκε ο compiler και όχι η επιθεώρηση:
- Το `as const` στενεύει τα `params` στα πεδία που *τυχαίνει* να χρησιμοποιούν οι τρέχουσες εγγραφές — κανένα δεν έχει `enumValues`, άρα η ανάγνωσή του δεν μεταγλωττιζόταν. Το `toToolCatalog` διαβάζει widened.
- Το `as const` δίνει στα read actions **κανένα** key `reversal`, άρα το `spec.reversal?.kind` δεν μπορούσε να μπει στο union. Προστέθηκε `listDeclarations()`/`getActionDeclaration()` που επιστρέφουν το widened `ActionDeclaration`.

### 17.3 Η υποδομή που χρειάστηκε πρώτα

Το `packages/shared` καταναλώνεται μέσω `dist`, που είναι **gitignored**, και το `pnpm --filter @cofounderbay/web test` **παρακάμπτει το turbo** — άρα σε καθαρό clone τα tests θα έσκαγαν στο πρώτο import. Επίσης κανένα API test δεν έφτανε ποτέ σε module που κάνει import το shared, οπότε αυτή η ανάλυση **δεν είχε δοκιμαστεί ποτέ**.

- Και τα δύο vitest configs κάνουν alias το `@cofounderbay/shared` στο `src/index.ts` → tests διαβάζουν πηγή, δουλεύουν σε καθαρό clone, χωρίς build step.
- Το turbo task `dev` πήρε `dependsOn: ["^build"]`. Επαληθεύτηκε με `turbo run dev --dry=json`: `@cofounderbay/web#dev` και `@cofounderbay/api#dev` εξαρτώνται τώρα από `@cofounderbay/shared#build`. Χωρίς αυτό, το `pnpm run dev` θα έτρεχε πάνω σε stale `dist` ενώ τα tests θα περνούσαν.

### 17.4 Tool calling με επιβολή

- `ollama.service.ts`: το `ChatOptions` πήρε προαιρετικό `tools`, που μπαίνει στο body **μόνο** όταν ο caller δώσει catalogue — η προηγούμενη συμπεριφορά μένει ακριβώς ίδια όταν λείπει. Τα `tool_calls` της απάντησης δεν πετιούνται πια· κρατιούνται και διαβάζονται με `takeLastToolCalls()`, που τα καθαρίζει ώστε ένα turn να μην πάρει το αίτημα προηγούμενου. Η υπογραφή του `chat()` **δεν** άλλαξε, άρα κανένας caller ούτε το `IAIProvider` δεν έσπασε.
- `GET /ai/tools` σερβίρει το `toToolCatalog()` — ο client βλέπει **το ίδιο** contract που επιβάλλει ο server.
- `apps/api/src/ai/tool-calls.ts` είναι το σημείο επιβολής. Απορρίπτει όνομα που δεν δηλώθηκε, λείπον required argument, λάθος τύπο (**αυστηρά, χωρίς coercion** — μοντέλο που στέλνει `42` για string έχει παρανοήσει το schema και το coercion το κρύβει), και τιμή εκτός enum. Ρίχνει τα args που δεν δηλώθηκαν και **αναφέρει ποια**. Διαβάζει args είτε ως object (Ollama) είτε ως JSON string (OpenAI-compatible).

**Τι ρητά δεν κάνει:** δεν εκτελεί τίποτα. Οι executors είναι στον client, πίσω από την επιβεβαίωση του χρήστη· ένα accepted call γυρίζει ως **πρόταση** και κουβαλά `writes` ώστε κανείς να μην περάσει mutation για read. Δεν είναι authorization check — τα guards κάθε endpoint μένουν.

Malformed έξοδος μοντέλου γυρίζει «τίποτα δεν έγινε δεκτό» αντί για 500. Έχει ήδη ρίξει τις σελίδες αυτού του προϊόντος μία φορά (`1a309c6`).

**Κατάσταση:** web 271 → **273/273** (31 files), api 140 → **158/158** (6 files), `tsc --noEmit` καθαρό σε web / api / shared, shared build καθαρό.

### 17.5 Τι μένει

Ο **tool-call loop** (model → tool_call → πρόταση → επιβεβαίωση → εκτέλεση → feedback στο μοντέλο → συνέχεια) δεν έχει συνδεθεί στο streaming path. Το `chatStream` στέλνει `tools` αν του δοθούν, αλλά τα tool_calls σε streaming έρχονται τμηματικά και θέλουν χωριστή συναρμολόγηση. Και το `AGENTS.md` απαγορεύει επανάληψη AI POST μετά από μερικό streaming, άρα ο loop θέλει σχεδιασμό που δεν ξαναστέλνει. Δεν το δηλώνω ως γίνον.

## 18. Wave 3 — ο assistant μιλά τη γλώσσα του χρήστη

### 18.1 Η πραγματική αιτία δεν ήταν τα strings

Πριν μεταφράσω οτιδήποτε: το `usePageContext` έγραφε **`locale: 'en'` σταθερά**. Το packet που δίνεται στον engine δήλωνε κάθε αναγνώστη Αγγλόφωνο, ό,τι κι αν είχε επιλέξει. **Η μετάφραση των strings χωρίς αυτή τη διόρθωση δεν θα άλλαζε τίποτα για κανέναν.** Διορθώθηκε να διαβάζει το `useI18n()` (που έχει λειτουργικό default, άρα ασφαλές και εκτός provider).

Το `catalog.ts` υποσχόταν ήδη `'AI replies will use {code}.'` — υπόσχεση που τα hardcoded strings διέψευδαν σε κάθε απάντηση.

### 18.2 Ποιο i18n σύστημα, από τα δύο

Υπάρχουν δύο παράλληλα: το `LanguagePreferenceContext` (en/el, για `BilingualText`) και το `I18nProvider` (**9 locales**, `t()` με `{vars}` και lazy catalogues). Ο engine συνθέτει **πρόζα markdown**, όχι components, οπότε το `BilingualText` δεν τον φτάνει. Επιλέχθηκε το `translate(locale, source, vars)`: αγγλικό κείμενο ως κλειδί, 9 locales, και unknown key μένει αγγλικό — δηλαδή τα υπόλοιπα 7 locales κάνουν graceful fallback εξ ορισμού, όχι regression.

### 18.3 Τι άλλαξε

26 αντικαταστάσεις στο `copilot-engine.ts`: κάθε `sections.push`, `title`, `description`, `confirmLabel`, citation label και τα δύο fallback μηνύματα περνούν από `t()`. ~50 ελληνικές εγγραφές στο `CATALOG.el`.

**Ενικός/πληθυντικός σε ξεχωριστά κλειδιά**, γιατί τα ελληνικά κλίνουν το ουσιαστικό και όχι μόνο την κατάληξη — ένα template με `{count}` δεν καλύπτει και τα δύο. Στο πέρασμα διορθώθηκε και υπάρχον γραμματικό λάθος: «1 pending intro **wait** on Connections» → «waits».

Τα labels του `nextAction` μένουν αγγλικά **ως κλειδιά** (το `fetchGraph` δεν έχει locale) και μεταφράζονται στο σημείο εμφάνισης με `t(graph.nextAction.label)`.

### 18.4 Ο φρουρός βρήκε δύο που μου ξέφυγαν

`apps/web/src/lib/copilotStrings.test.ts` σαρώνει την πηγή του engine και απαίτησε ελληνικό για κάθε αγγλική πρόταση. Βρήκε αμέσως:

- **`'No pending intros.'`** — το είχα τυλίξει σε `t()` αλλά **ξέχασα** την ελληνική εγγραφή.
- **`' · unread'`** — δεν το είχα εντοπίσει **καθόλου** στην αρχική καταγραφή. Ήταν concatenated marker μέσα σε template. Ξαναγράφτηκε ως κανονικό κλειδί `'**{title}** · unread'`, γιατί είναι μέρος της πρότασης και όχι διαχωριστικό.

Κατοχυρώνει: ελληνικό για κάθε πρόταση· ελληνικό **διαφορετικό** από το αγγλικό· **ίδια placeholders** στις δύο γλώσσες (χαμένο `{name}` εμφανίζει άγκιστρα στον χρήστη)· κανένα bare literal σε `sections.push`/`title`/`description`/`confirmLabel`· και ότι το `usePageContext` **δεν** ξανακωδικοποιεί `locale: 'en'`.

Το `label:` εξαιρείται ρητά από τον κανόνα bare-literal, με τεκμηρίωση: είναι lookup key, και η κάλυψη ελληνικών το πιάνει ούτως ή άλλως.

**Κατάσταση:** web 273 → **279/279** (32 files), `tsc --noEmit` καθαρό.

### 18.5 Καθαρισμός branches

`git push origin --delete` σε τρία: `cursor/ai-os-fullpage-chat-` (κολοβό, δημιουργήθηκε από λάθος push μου — διπλότυπο του tip), `master` (`e1462d7`, 0 ahead / 77 behind, πλήρως περιεχόμενο, καμία αναφορά σε config) και `cursor/ui-upgrade-cloudflare-preview-53e0` (`c10ece1`, πλήρως περιεχόμενο). Τα SHAs καταγράφονται εδώ ώστε κάθε διαγραφή να είναι **αναστρέψιμη** με ένα push.

Κρατήθηκαν: `main` (default), αυτή η γραμμή, `integration/ai-platform-upgrade` (**περιεχόμενο** αλλά ενεργή γραμμή άλλου agent — η διαγραφή θα διέκοπτε τη δουλειά του) και `claude/project-audit-upgrade-y2ebnr` (**32 μοναδικά commits**).

## 19. Wave 2 (υπόλοιπο) — audit trail

### 19.1 Δεν χρειάστηκε πίνακας

Είχα δηλώσει ότι το audit trail «θέλει Prisma table + endpoints». **Λάθος στο πρώτο μισό.** Το `schema.prisma` έχει ήδη μοντέλο **`AuditLog`** με `actorId`, `action`, `entityType`/`entityId`, `metadataJson`, `ipAddress`, `userAgent` και indexes σε **ακριβώς** τα πεδία που ρωτά αυτή η χρήση — και **κανέναν writer**. Είναι η πρώτη του χρήση.

Το `AdminAuditLog` είναι άλλη ανησυχία (moderation από staff, με δικό του typed union) και το `AIUsageLog` είναι telemetry (tokens, latency, ποιο μοντέλο απάντησε). Κανένα δεν καταγράφει **τι άλλαξε** ο assistant στα δεδομένα του χρήστη.

### 19.2 Το εύρημα που βρήκε ο έλεγχος του πίνακα

Πήγα να επαληθεύσω ότι ο πίνακας υπάρχει και βρήκα κάτι μεγαλύτερο: **οι migrations δημιουργούν 63 πίνακες, το schema δηλώνει 187 μοντέλα.** Το `AuditLog` δεν είναι σε καμία migration — **ούτε** όμως τα:

- `SavedProfile` — το shortlist (`saveToShortlist`/`removeFromShortlist`, δηλαδή το μόνο αναστρέψιμο mutation του Wave 2)
- `AIUsageLog` — γράφεται σε **κάθε** `/ai/chat`
- `AIConversation` — η persistence των συνομιλιών

Άρα η βάση δεν προμηθεύεται από το migration history· προμηθεύεται με **`prisma db push`** (υπάρχει ως `prisma:push` script). Το `AuditLog` είναι στην **ίδια θέση** με λειτουργίες που δουλεύουν σήμερα.

Γι' αυτό **δεν** έγραψα χειροκίνητη migration: θα αποτύγχανε σε βάση που έχει γίνει push (ο πίνακας υπάρχει ήδη) και θα υπονοούσε ότι το history είναι αυθεντικό, ενώ είναι 124 μοντέλα πίσω. Αυτό είναι ανεξάρτητο ρίσκο deployment και καταγράφεται στο `AGENTS.md`.

### 19.3 Τι μπήκε

`AIActionAuditService` → γράφει στο `AuditLog` με `action = 'ai.<id>.<outcome>'` (ώστε το indexed πεδίο να μένει queryable και ανά capability και ανά outcome), `outcome ∈ {applied, undone, failed}`.

**Το ίδιο gate με το tool call του μοντέλου:** κάθε εγγραφή περνά από `reviewToolCall`. Capability που δεν δηλώθηκε, ή args που δεν ταιριάζουν στο schema, **δεν είναι καταγράψιμα** — αλλιώς το trail θα ήταν ανεπαλήθευτος σκουπιδοτενεκές προσβάσιμος από κάθε authenticated caller.

Το **υποκείμενο παράγεται** από το πρώτο required param της declaration (`userId`, `receiverId`, `href`) αντί να το στέλνει ο caller, ώστε να μην μπορεί να χρεώσει εγγραφή σε entity που τα args δεν ανέφεραν ποτέ. Το metadata κουβαλά `writes` και `reversalKind`, άρα το trail είναι αυτοπεριγραφόμενο.

`POST /ai/actions` και `GET /ai/actions` (μόνο το **δικό** του trail ο καλών — ο actor από το token, ποτέ από το query). Client: `recordAIAction` fire-and-forget στο `confirmAction`/`undoAction`.

### 19.4 Δύο σχεδιαστικές επιλογές που θέλουν εξήγηση

**Αποτυχία εγγραφής δεν γίνεται error status.** Όταν τρέχει η καταγραφή, η ενέργεια **έχει ήδη συμβεί**. Ένα 500 θα έλεγε στον χρήστη ότι δεν συνέβη. Απαντά 2xx με `recorded: false` και reason· ο client δεν αναδεικνύει ποτέ αποτυχία audit.

**Δεν είναι tamper-proof log, και δεν το παρουσιάζω ως τέτοιο.** Οι executors ζουν στον client (confirm-first: η ενέργεια γίνεται με το session του χρήστη), άρα caller που δεν κάνει ποτέ POST εδώ **εκτελεί παρ' όλα αυτά** την ενέργειά του — η εξουσιοδότηση ζει στα guards κάθε endpoint. Είναι ο λογαριασμός του προϊόντος για τον εαυτό του, για τον χρήστη και το support. Για να γίνει αυθεντικό, η εκτέλεση πρέπει να μετακομίσει server-side — άλλη αρχιτεκτονική.

### 19.5 Εύρημα στα tests

Το `{ provide: JwtAuthGuard, useValue: … }` **δεν** παρεμβάλλεται: ο πραγματικός guard επεκτείνει το `AuthGuard('jwt')` του passport και χωρίς registered strategy απαντά **500 αντί 401**. Και τα 14 tests μου απέτυχαν έτσι. Η υπάρχουσα σουίτα jobs κάνει `vi.spyOn(JwtAuthGuard.prototype, 'canActivate')` για τον ίδιο λόγο. Καταγράφηκε στο `AGENTS.md`.

**Κατάσταση:** api 158 → **172/172** (7 files), web **279/279** (32 files), `tsc --noEmit` καθαρό σε web + api.

## 20. Έλεγχος 2026-09-17 — η γραμμή προϊόντος έχει φύγει 60 commits μπροστά

`git fetch origin --prune`. Remote heads:

| branch | SHA | ahead of `main` `91d6ea3` |
|---|---|---|
| `integration/ai-platform-upgrade` | `1fb4bc4` | **193** |
| `claude/project-audit-upgrade-y2ebnr` | `4b897c9` | 191 |
| `cursor/ai-os-fullpage-chat-53e0` | `7ce1fe3` | 133 |
| `main` | `91d6ea3` | 0 |

**Πιο ανεπτυγμένο προϊόν:** `integration/ai-platform-upgrade` `1fb4bc4`. Περιέχει ολόκληρο το `cursor/ai-os-fullpage-chat-53e0` (`7ce1fe3` είναι πρόγονος) συν 60 commits: type/layout, i18n, AI reads/loop, a11y/hydration, Tailwind padding, reversible shortlist, capability index.

Ο Claude **δεν είναι πια το April fork.** `f54098c` έκανε merge την AI platform line μέσα στη design line· κοινός πρόγονος με integration είναι `06024ae`, όχι το `main`. Unique του Claude μετά από εκεί: 2 commits (`bd5e720`, `4b897c9`). Unique του integration: 4 (`69a6fc9`, `5178e45`, `d016495`, `1fb4bc4`).

Τραβήχτηκαν **χωρίς παράλειψη**:

- Fast-forward στο `1fb4bc4` (και τα 60, συμπεριλαμβανομένων των 4 unique του integration: RelativeTime, 12 reads, copilot-loop, padding `pl-9`, shortlist remove, `/ai/capabilities`).
- Cherry-pick `bd5e720` πάνω σε αυτό: ConversationList χωρίς nested-interactive, `a11y.spec.ts` «every control keeps its name at phone width», MatchCard/SearchFilters/matches raw `<button>` names, Button `asChild` exemption. Στα overlapping call sites κρατήθηκαν τα **integration** labels (διγλωσσικά, με το όνομα της γραμμής, `aria-pressed`) — τα Claude labels ήταν γενικότερα και σε μία περίπτωση έσβηναν `onClick` στο attach image.
- `4b897c9` (hydration gate green) ήταν ήδη στο `69a6fc9` ως θετικός έλεγχος `relative timestamps hydrate without a mismatch`. Cherry-pick κενό· skip.

**Σκόπιμα όχι:** full merge του Claude HEAD — θα πετούσε τα 4 unique του integration (3.630 γραμμές: `copilot-reads`, loop, catalogue, capability index). OpenNext, squircle, April axe mock: ακόμα έξω, όπως στα §13.

### 20.1 Έλεγχος 2026-09-18 — κανένα νέο remote commit

`git fetch origin --prune`. Heads **αμετάβλητα** από §20: `main` `91d6ea3`, `cursor/ai-os-fullpage-chat-53e0` `7ce1fe3`, `integration/ai-platform-upgrade` `1fb4bc4`, `claude/project-audit-upgrade-y2ebnr` `4b897c9`.

**Πιο ανεπτυγμένο προϊόν:** αυτή η γραμμή `cursor/ui-upgrade-cloudflare-preview-53e0` `6582dcb` — **199** μπροστά από `main`, 6 μπροστά από integration (docs + CI/a11y fixes: shared `prebuild`, AIInsightButton, feed Preferences). Integration 0 unique. Claude unique SHAs ακόμα `bd5e720`/`4b897c9` (ήδη cherry-picked / skip).

Διαφορά αρχείων προς Claude: σχόλια στο Button, αγγλικά labels στο `/feed`, import `LocalTime` αντί `RelativeTime`. Υιοθέτηση θα **αφαιρούσε** bilingual names και hydration-stable timestamps. Καμία παράλειψη αναβάθμισης.

## 21. Έλεγχος 2026-09-22 — σύγκλιση branches, και η πρώτη μέτρηση όλων των 142 routes

### 21.1 Branches

`git fetch --all --prune`. Τοπικό `integration/ai-platform-upgrade` == remote (0 ahead / 0 behind) στο `6ff0dbc`, +90 commits από τον προηγούμενο έλεγχο. Σε κάθε άλλο remote branch, commits **που δεν υπάρχουν στο HEAD**:

| branch | μη-συγχωνευμένα | κρίση |
|---|---|---|
| `cursor/ui-upgrade-cloudflare-preview-53e0` `5d630f3` | 0 | πρόγονος (merge `47e1660`) |
| `cursor/ai-os-fullpage-chat-53e0` `7ce1fe3` | 0 | πρόγονος |
| `main` `91d6ea3` | 0 | πρόγονος |
| `claude/project-audit-upgrade-y2ebnr` `4b897c9` | 2 (`bd5e720`, `4b897c9`) | **ουσία ήδη μέσα** — βλ. κάτω |

Ο έλεγχος του Claude δεν έμεινε στους τίτλους. `bd5e720` (53 αρχεία, «nameless icon button = compile error»): ο φρουρός τύπων υπάρχει στο `button.tsx` (γρ. 83, 109–112, ίδιο τρίτο μέλος union για widened `size`), και το typecheck περνά — άρα κάθε icon button του HEAD **έχει** όνομα, αλλιώς δεν θα μεταγλωττιζόταν. 43/53 αρχεία θα συγκρούονταν σε cherry-pick γιατί η integration τα ξαναδούλεψε από τότε. `4b897c9`: αφαιρεί την εξαίρεση hydration #418 από το gate — το HEAD την αφαίρεσε ήδη (`RelativeTime`) **και** κράτησε θετικό regression test (`relative timestamps hydrate without a mismatch`, 5 tests έναντι 4 του Claude). Το commit message του Claude υπόσχεται test «every control keeps its name at phone width» — **το diff του δεν το περιέχει**. Τίποτα να τραβηχτεί.

Τρία αρχεία σε εξέλιξη από την προηγούμενη συνεδρία (readiness bars διπλά ξεθωριασμένες, banner που αντέφασκε στο demo, γένος στο `strings-research`) — typecheck καθαρό, committed `de5a74d`.

### 21.2 Επαλήθευση HEAD

API: 187/187, typecheck καθαρό. Web: typecheck καθαρό· **455/456** — το ένα `MobileNavigation › closes when the already-current destination is selected` είναι `Test timed out in 60000ms`, όχι assertion. Σε απομόνωση 18/21 με τρία timeouts· τα ίδια tests που πέρναγαν σε 845ms στις 09-16 τώρα 8–130s, ενώ ο dev server μεταγλώττιζε 142 routes για το sweep (846 CPU-s, 1.5GB). Περιβαλλοντικό· δεν το δηλώνω πράσινο, δεν το δηλώνω regression.

### 21.3 Sweep 142 static routes @1440 (Playwright, demo mode, platform_admin)

Πρώτη φορά που μετριέται **ολόκληρη** η πλατφόρμα σε μία σάρωση, όχι τρεις σελίδες.

| μέτρηση | αποτέλεσμα |
|---|---|
| non-200 | **1** — `/investor/dashboard` **500**: Server Component με 270 γραμμές νεκρού «legacy» κώδικα κάτω από το `redirect()`, που εισήγαγαν `useState` → Turbopack αρνείται. Διορθώθηκε στο πρότυπο των 7 γραμμών του `/mentor/dashboard`. Τίποτα δεν χάθηκε: το `/dashboard/investor` αποδίδει watchlist/pipeline/portfolio από το API. |
| page errors | 2 — το παραπάνω, και `Maximum update depth exceeded` στο `/auth/sso-complete` **μία φορά**, αμέσως μετά το `/auth/oauth-callback` στο ίδιο tab. 3 απομονωμένες επαναλήψεις (με/χωρίς demo): 0 errors. Καταγράφεται ως παρατηρηθέν-μία-φορά, όχι ως διορθωμένο. |
| οριζόντια κύλιση | 1 — `/profile/edit` 68px |
| ανώνυμα controls | **17 routes, 94 controls**: `/calendar` 30, `/learning` 10, `/admin/feature-flags` 9, `/settings/ai` 9, `/investors` 6, `/members` 6, … Ο compile-time φρουρός πιάνει μόνο `<Button size="icon">`· αυτά είναι raw `<button>`/`<a>` και role-surface σελίδες. |
| Greek <15% (>30 λέξεις) | **74/142** — admin ×17, org ×10, provider ×8, tenant ×6, investor ×5, mentor ×5, settings ×4, και `/reputation`, `/members`, `/investors`, `/endorsements`, `/marketplace`, `/mentoring`, `/help`. Ο ισχυρισμός «18 σελίδες» δεν επιβεβαιώνεται· είναι το μισό προϊόν. |
| χωρίς Ask AI seam | 13 |
| dead bands >60px | 9 routes ×1–2 |

### 21.4 Ο ισχυρισμός «nothing on screen is invented» (`3983a79`) — ελέγχθηκε

Σελίδες χωρίς κανένα fetch, με hardcoded αριθμητικά, **χωρίς** `SampleDataNotice`, και `status: 'complete'` στο registry: `/reputation` (12 figures — «Profile Completeness 85/100», badges, ιστορικό, **ίδια για κάθε χρήστη**, ενώ υπάρχουν `gamification` + `endorsements` API), `/coaching` (5), `/expert-reviews` (5), `/tenant/programs` (5), `/org/cohorts/[id]` (3). Επιπλέον `mentor/earnings`, `provider/analytics` με `const MOCK_*` arrays. Ο ισχυρισμός ισχύει για τις σελίδες που άγγιξε το commit· δεν ισχύει για την πλατφόρμα.

### 21.5 AI seam, μετρημένο

26 δηλώσεις (16 reads, 9 writes, 1 navigate) σε ~22 domains, έναντι **47 API modules**. Χωρίς καμία ενέργεια: `profile` (ο assistant δεν διαβάζει/γράφει το προφίλ του χρήστη), `gamification`, `messaging` read (μόνο send), `connections` read (μόνο send), `events`/`groups`/`milestones` write (μόνο read), `billing`, `org`/`tenant`/`admin` σύνολο, `marketplace`, `learning`, `polls`. Ο tool-call loop σε streaming που το §17.5 δήλωνε ανοιχτό **είναι πλέον συνδεδεμένος** (`ollama.service.ts:209` συναρμολογεί, `ai.controller.ts:169/287` επιθεωρεί, `useAIChat.ts:327` προτείνει). Snapshots σελίδας: 4/156.

### 21.6 Σειρά (από τη μέτρηση, όχι από γούστο)

1. **Ειλικρίνεια πρώτα**: 7 σελίδες που δείχνουν εφευρεμένα δεδομένα ως πραγματικά — είτε API, είτε `SampleDataNotice`, είτε `status: 'partial'`. Ένα βράδυ, μηδέν ρίσκο.
2. **94 ανώνυμα controls / 17 routes** — αντικειμενικό WCAG failure· `/calendar` μόνο του είναι το ένα τρίτο.
3. **`/profile/edit` 68px overflow**.
4. **AI reach**: `get_profile`/`update_profile`, `get_messages`, `get_connections`, writes για milestones/events — ο πυρήνας ενός AI-first προϊόντος είναι να ξέρει τον χρήστη του.
5. **74 English-only routes** — κατά ρόλο (settings → member-facing → investor/mentor/provider → org/tenant → admin), με τη σύμβαση `strings-*.ts` + `catalogGuard.test.ts` ανά σελίδα.
6. 13 routes χωρίς Ask AI, 9 dead bands.

### 21.7 Οπτικός έλεγχος 32 στιγμιοτύπων (founder surfaces, demo) — 2026-09-22

Τα στιγμιότυπα του χρήστη δείχνουν `/dashboard/founder` με «42/100 · 3 διαστάσεις (Team/Product/Market)» και «Ορόσημα 0/4». **Το HEAD δεν αποδίδει αυτά**: μέτρηση σε καθαρό browser δίνει 52/100 · 6 διαστάσεις (profile/research/artifacts/collaboration/momentum/ecosystem) και 6/12 ορόσημα — το mock των τριών διαστάσεων αντικαταστάθηκε στο `6ff0dbc`, και το σχόλιο στο `preview-api.ts:1470` το λέει ρητά. Ο browser του χρήστη σέρβιρε παλιό bundle· χρειάζεται hard reload. Δεν είναι εύρημα κώδικα.

Επαληθευμένα στο HEAD και διορθωμένα:

| εύρημα | αιτία | διόρθωση |
|---|---|---|
| `/builder/pitch-deck` «Αίτημα χρηματοδότησης: —» ενώ `/fundraising` και dashboard λένε $750K στόχος | το deck δεν διάβαζε τον γύρο | prefill από `fundraisingRoundView()` — **μόνο demo**, ποτέ πάνω από πληκτρολογημένη τιμή, ίδιο πρότυπο με το `companyName ← workspaceName` |
| `/ai` τέσσερα νήματα «Νέα συνομιλία», ανοίγουν κενά | το demo `/api/ai/chat` αγνοούσε το `conversationId`· ο server (`ai-conversation.service.ts:151`) προσαρτά και μετονομάζει από το πρώτο μήνυμα | το preview layer κάνει το ίδιο, ίδια περικοπή 50 χαρακτήρων |
| `/builder` «Τα παραδοτέα σας είναι έτοιμα για αξιολόγηση» δίπλα σε «0 ολοκληρωμένα» | trigger = `documents.length >= 2`, όχι ολοκλήρωση | το κείμενο λέει τι ισχύει: «N έγγραφα σε εξέλιξη — ένας ειδικός μπορεί να αξιολογήσει τα προσχέδια» |
| `/readiness` 61 vs `/builder` 42 | στο HEAD και τα δύο 61 (ίδιο endpoint, ίδιο `DEMO_CRITERIA`, seed = 61) | καμία — stale bundle |

Δύο βαθμολογίες «ετοιμότητας» παραμένουν σκόπιμα (52 πρόοδος ιδρυτή / 61 αξιολόγηση επενδυτή-επιταχυντή), ονοματισμένες και διασυνδεδεμένες από το `5e701fa`. Η συγχώνευσή τους είναι απόφαση προϊόντος, όχι bug.

`/reputation` (§21.4 #1) έγινε: διαβάζει gamification XP/badges/streak, ίδια hooks με το dashboard, δίγλωσσο, `SampleDataNotice` στο demo. Μένουν από το #1: `/coaching`, `/expert-reviews`, `/tenant/programs`, `/org/cohorts/[id]`, `mentor/earnings`, `provider/analytics`.

## 22. Page rail — κύματα, με μέτρηση (2026-09-24)

### 22.1 Το εργαλείο

`node scripts/rail-candidates.mjs` — για κάθε `page.tsx` (ακολουθώντας ένα επίπεδο delegation) μετρά controls και ανιχνεύει **οικογένειες** βοηθητικών controls: filters, views, export, settings, summary, help. Υποψήφια = ≥3 οικογένειες χωρίς rail. Το `acc83e8` ανέφερε 45 με χαλαρότερο κριτήριο· αυτό δίνει **17** με αυστηρό — και συμφωνούν στην κορυφή. Η λίστα είναι αναπαραγώγιμη· μια σελίδα μπαίνει ή βγαίνει με λόγο, όχι με γούστο.

| route | ctrl | fam | οικογένειες |
|---|---|---|---|
| `/research/[boardId]` | 76 | 5 | filters, views, export, settings, help |
| `/admin/user-management` | 39 | 4 | filters, views, export, help |
| `/org/[slug]/admin` | 26 | 4 | filters, export, settings, summary |
| `/org/settings` | 42 | 3 | filters, views, settings |
| `/data-room/[id]` | 41 | 3 | filters, views, export |
| `/admin/billing` | 31 | 3 | filters, export, settings |
| `/fundraising` | 31 | 3 | filters, export, help |
| `/feed` · `/projects` · `/admin/communities` · `/dashboard/founder` · `/admin/feature-flags` · `/discover` · `/dashboard/incubator` · `/marketplace` · `/help` · `/calendar` | 9–21 | 3 | |

Με rail: `/coaching`, `/matches` (Claude), `/admin` (§22.2), `/research/[boardId]` (§22.3).

### 22.2 `/admin` — 2ο κύμα

Έξι σύνολα → rail «Σύνολα πλατφόρμας» (badge = ανοιχτές αναφορές)· 12 tabs → και ως λίστα στο rail (τα tabs μένουν). Δύο ελαττώματα σε κοινό κώδικα: React key warning (το admin layout δίνει στο frame δύο αδέλφια, το δεύτερο το RSC `children` χωρίς key — keyed Fragments) και ο τίτλος του ανοιχτού rail που κόβονταν (stacked+wrap στο `PageRail.tsx`).

### 22.3 `/research/[boardId]` — 3ο κύμα, ο καμβάς

Η σελίδα στήνει δικό της chrome (SideNav/TopBar, όχι AppShellFrame), άρα κρατά μόνη της το πλάτος της λωρίδας (ίδιες τιμές με το frame). Το μενού «More» με 30 στοιχεία έγινε **έξι οικογένειες** — Προβολή, Εισαγωγή, Βοηθός & ανάλυση, Φίλτρα κόμβων (ο ίδιος `NodeFilterBar`, ίδιο state, badge = ενεργά φίλτρα), Εξαγωγή & κοινοποίηση, Ρυθμίσεις & διάταξη — κάθε γραμμή καλεί τον handler που καλεί το menu item. Toolbar και More **μένουν όπως είναι**: ο καμβάς είναι εργαλείο, η γρήγορη διαδρομή του είναι η γραμμή εργαλείων.

Δύο ελαττώματα που βρήκε το probe: (α) το peeked panel βρισκόταν **κάτω** από τη γραμμή εργαλείων του καμβά (`z-50` σε μη-απομονωμένη στήλη έναντι rail `z-30`) — κλικ στο rail πέφταν στο toolbar. Rail → `z-40` (ίδιο layer με το SideNav, συμμετρικό chrome) και η στήλη του καμβά `isolate`. (β) **Προϋπάρχον, μετρημένο, όχι διορθωμένο εδώ**: η γραμμή εργαλείων είναι **1.734px** πλατιά σε κάθε viewport — υπερχειλίζει στα 1280 (−552) και 1440 (−392) με ή χωρίς rail (ο rail κοστίζει 52). Ο τίτλος «Research canvas» πέφτει πάνω στο «Add node». Επόμενο: η δευτερεύουσα ομάδα (snap/AI/summary/branch/history), που έχει πλέον σπίτι στο rail και στο More, να συμπτύσσεται και κάτω από `2xl`, όπως ήδη κάνει κάτω από `sm`.

Επαλήθευση: typecheck καθαρό, rail contract 5/5, ο καμβάς παραχωρεί 43px, 6 sections στη λωρίδα, εναλλαγή πλέγματος μέσα από το rail αλλάζει το state που διαβάζει το toolbar, 0 errors.

## 23. Γύρος 11 — λειτουργικότητα σε πλήρες εύρος, rail κύμα 4, ο assistant βλέπει τον rail (2026-09-24)

### 23.1 Συγχώνευση

`777eb2b` — `integration/ai-platform-upgrade @7f1298b` μέσα στο δικό μας branch. Το δέντρο μετά το merge είναι **ταυτόσημο** με το integration (tag ασφαλείας `pre-round11-merge`). Κανένα remote branch δεν έχει commits που μας λείπουν (έλεγχος `git rev-list HEAD..origin/*` στο τέλος του γύρου).

### 23.2 Κανένα control που δεν κάνει τίποτα

Στατικό sweep όλων των `src/**/*.tsx`. Κάθε control είναι πλέον ένα από: **συνδεδεμένο** σε υπάρχον endpoint · **σύνδεσμος** σε route που υπάρχει · **απενεργοποιημένο με δηλωμένο λόγο** (`UnavailableMenuItem`, ή `disabled` + `title`). Καμία λειτουργία δεν αφαιρέθηκε.

| εύρημα | πριν | μετά | guard |
|---|---|---|---|
| `<DropdownMenuItem>` χωρίς handler | 104 | 0 | `deadControls.test.ts` |
| `<Button>` χωρίς handler / link / form / disabled | 103 | 0 | `deadControls.test.ts` (επαληθευμένο ότι πιάνει ενσωματωμένο νεκρό κουμπί) |
| εσωτερικοί σύνδεσμοι σε route που δεν υπάρχει | 47 (23 routes) | 0 | `internalLinks.test.ts` |
| icon buttons χωρίς όνομα | 110 | 0 | τύπος `Button` + `controlNames.test.ts` |
| `SelectTrigger` χωρίς όνομα | 81 | 0 | τύπος `SelectTrigger` (compile error) |
| σελίδες με 2+ ορατά `<h1>` | 29 | 0 | sweep |

Νέες σελίδες για τους συνδέσμους που έπεφταν σε 404: `/events/[id]` (RSVP, .ics, κοινοποίηση), `/programs/[id]` (αίτηση με cover note), `/startups/[id]` (στάδιο, αστέρι, pass, σημειώσεις, ιστορικό μέσω `investorDeal`), `/unauthorized`. Νέοι διάλογοι mentoring (προγραμματισμός, μετάθεση, σημειώσεις) αντί για τα ανύπαρκτα `/mentor/sessions/new` και `/mentor/sessions/:id/notes`. Κοινό `lib/csv.ts` (RFC 4180) για κάθε export.

### 23.3 Page rail — κύμα 4

| route | column (κύρια λειτουργία) | rail sections | τι προστέθηκε στο εύρος |
|---|---|---|---|
| `/admin/tenants` | λίστα, επιλογή, ενέργειες | Σύνολα · Φίλτρα · Εργαλεία | αναζήτηση, select-all, CSV |
| `/mentor/earnings` | ιστορικό, μηνιαίο, payout | Σύνολα εσόδων · Περίοδος · Εξαγωγή | CSV μέσω κοινού quoting |
| `/tenant/programs` | προγράμματα | Σύνολα · Κατάσταση προγράμματος | προεπιλογή «τρέχοντα» (τα ζωντανά δεδομένα ήρθαν από το `a31af0a`) |
| `/provider/analytics` | δείκτες + 3 γραφήματα | Περίοδος (+ανανέωση) · Με μια ματιά · Εξαγωγή | weekly summary του API, CSV δεικτών/ημερών |
| `/admin/users` | κατάλογος + αναζήτηση | Σύνολα · Φίλτρα · Εργαλεία | μέτρηση Banned, ρόλος «Οργανισμός» στο φίλτρο |
| `/admin/reports` | ουρά (tabs) + αναζήτηση | Σύνολα · Φίλτρα · Εργαλεία | tab «Απορριφθείσες», φίλτρο προτεραιότητας, CSV |
| `/admin/programs` | λίστα + αναζήτηση | Σύνολα · Φίλτρα · Εργαλεία | Draft/Archived μετρήσεις, φίλτρο τύπου, CSV |

Σελίδες με rail: **21**. `scripts/rail-candidates.mjs` καταγράφει πλέον τις 7 που **απορρίφθηκαν με λόγο** (`/org/settings`, `/admin/feature-flags`, `/dashboard/founder`, `/dashboard/incubator`, `/discover`, `/help`, `/groups/manage`) — ανοιχτοί υποψήφιοι: **0**.

**Guard σε επίπεδο state.** Ο έλεγχος «ίδιο control σε column και rail» σύγκρινε μόνο ετικέτες· ένα rail «Status» δίπλα σε `<Select>` με «All Status» περνούσε. Τώρα: state που ο rail *δείχνει* (`aria-pressed`/`aria-checked`/`checked`/`value`) απαγορεύεται να είναι δεμένο σε control της στήλης (`value=` / `onValueChange=`). Επαληθεύτηκε ότι αποτυγχάνει σε ενσωματωμένο διπλότυπο.

### 23.4 Ο assistant βλέπει και ανοίγει τον rail

- Ο mounted rail δημοσιεύει τον **πίνακα περιεχομένων** του (id, ετικέτες EN/EL, badge — ποτέ το περιεχόμενο) στο `PageRailContext` και σε bus για executors εκτός React.
- Το `PageContextPacket` αποκτά `rail.sections` στη γλώσσα του αναγνώστη· φτάνει και στο τοπικό engine και στο μοντέλο (το context γίνεται JSON στο system prompt — καμία αλλαγή API).
- Νέα δηλωμένη δυνατότητα **`open_rail_section`**: `writes: false`, `invalidates: []`, `reversal: none` (δεν γράφεται τίποτα· κλείνει με Escape / έξοδο δείκτη / κουμπί κλεισίματος του φύλλου), `auditSubject: page_rail_section`. Ο executor αρνείται section που δεν υπάρχει και λέει ποια υπάρχουν.
- Το τοπικό engine: στο «τι βλέπω εδώ;» αναφέρει τα sections με τα badges· στο «δείξε μου τα φίλτρα» / «export this list» προτείνει το άνοιγμα (EN/EL, ρήμα θέασης απαραίτητο ώστε «filter founders in Athens» να μένει αναζήτηση). Μεταφράσεις σε όλες τις 8 γλώσσες του καταλόγου.
- **Bug που βρέθηκε στη διαδρομή:** το `openRailSection` άνοιγε *και* το φύλλο κινητού σε κάθε πλάτος — το φύλλο γίνεται portal, οπότε το `lg:hidden` δεν το έκρυβε και στο desktop εμφανιζόταν modal φύλλο πάνω από το peek (επηρέαζε και τα «Show filters» / preferences / φίλτρα καμβά). Τώρα μία επιφάνεια ανά πλάτος (`matchMedia(min-width: 1024px)`), με test που θα αποτύγχανε στον παλιό κώδικα.

### 23.5 Τι βρήκε η ζωντανή επαλήθευση — και διορθώθηκε

Production build με `NEXT_PUBLIC_API_URL=http://localhost:3001` + `e2e/mock-api.mjs`, 160 routes (οι 156 + οι 4 νέες σελίδες), 1440 και 390.

| εύρημα | πού | αιτία | διόρθωση | guard |
|---|---|---|---|---|
| «NaNy ago» | `/admin/users` Last Active | `formatRelativeTime` σε μη-ημερομηνία («2 hours ago», «Never») | επιστρέφει την τιμή όπως δόθηκε / «—» | `utils.test.ts` |
| «NaN%» | `/recommendations` Acceptance Rate | πεδίο που λείπει από μερικό payload | `typeof === 'number'` αλλιώς «—» | sweep κειμένου |
| «Ready to join undefined?», κενό `<h1>` | `/t/[slug]` | tenant χωρίς `name`/`displayName` | ένα `tenantName` με fallback στο slug του URL | sweep κειμένου |
| toggle ορατότητας layer χωρίς όνομα | `/research/[boardId]` inspector | παιδί `{visible ? <Eye/> : <EyeOff/>}` — ο guard έβλεπε μόνο ένα icon element | όνομα + `aria-pressed`· **+10 ακόμη** ίδιου σχήματος (send/snapshot με spinner, checkboxes επιλογής) | `controlNames` (ternary) |
| Capture / Align menus χωρίς όνομα στα 1440 | canvas toolbar | η μόνη ετικέτα `hidden 2xl:inline` | `aria-label`· ίδιο σχήμα σε Share (builder) και Reload (offline banner) | `controlNames` (hidden label) |
| `color-contrast` | `/recommendations` badges | λευκό σε emerald-500 (2,5:1) | semantic chips (`STATUS.*.chip`) | axe |
| `color-contrast` | canvas rail πατημένη γραμμή | `text-primary` | `text-primary-accessible` | axe |
| `color-contrast` | `/builder` χρονοσφραγίδες | `text-muted-foreground/60` | πλήρες muted — και σε 13 ακόμη σημεία (11 κειμένου, 2 icon buttons) (τα placeholders και τα διακοσμητικά icons μένουν) | axe |
| 0 `<h1>` | canvas, `/share` (μη διαθέσιμο), OAuth callback, επιβεβαίωση email | ο τίτλος κατάστασης ήταν `h2`/`CardTitle`· ο καμβάς δεν είχε ορατό τίτλο | `h1` (ο καμβάς: `sr-only` με τον τίτλο του board) | sweep |
| κενά combobox | `/org/settings` | `SelectValue` χωρίς placeholder | placeholders | sweep |

Ο §22.3(β) (γραμμή εργαλείων καμβά 1.734px) **δεν ισχύει πια**: μετρημένο scrollWidth = clientWidth στα 1280/1440/1920 (διορθώθηκε στο integration `b0b7126`).

### 23.6 Πύλες

| πύλη | αποτέλεσμα |
|---|---|
| web typecheck | 0 errors |
| api typecheck | 0 errors |
| web vitest | 55 αρχεία, 510/510 |
| api vitest | 8 αρχεία, 187/187 |
| sweep 160 routes × {1440, 390}, στο τελικό build | 0 page errors · 0 React key warnings · 0 οριζόντια υπερχείλιση · ακριβώς 1 `<h1>` παντού · 0 controls χωρίς όνομα · 0 «NaN/undefined/Invalid Date» · 21 rails |
| behaviour probes | 17/17 (Preferences: peek στο desktop χωρίς modal, sheet στο κινητό· φίλτρα `/admin/users` στενεύουν τη λίστα και το badge μετρά· `/admin/reports` Dismissed + priority· περίοδος `/provider/analytics` από rail σε 1440 και 390· canvas toolbar χωρά σε 1280/1440/1920) |
| axe WCAG 2.1 A/AA — 33 σελίδες (όλες οι 21 με rail + όσες άλλαξαν) × 2 πλάτη | πρώτη εκτέλεση: 31/33 καθαρές ανά πλάτος (ευρήματα στο §23.5)· τελική, στο τελικό build, 34 σελίδες (+`/builder`) × 2: **0 παραβιάσεις**, 0 page errors, 0 key warnings |

Τι **δεν** αποδεικνύουν: οι σελίδες τρέχουν πάνω σε mock API με κενές συλλογές, άρα πολλά στοιχεία εμφανίζονται μόνο με demo/seed δεδομένα· persistence, JWT και Redis δεν ελέγχονται εδώ. Lint δεν αναφέρεται — το `next lint` δεν έχει flat config (AGENTS.md).

## 24. Έλεγχος 2026-09-24 (preview branch) — fast-forward, καμία παράλειψη

`git fetch origin --prune` πάνω στο `cursor/ui-upgrade-cloudflare-preview-53e0` `5d630f3`.

| branch | commits μόνο εκεί (όχι στο `5d630f3`) | κρίση |
|---|---|---|
| `integration/ai-platform-upgrade` `7f1298b` | 48 | αυστηρός απόγονος (`merge-base` = `5d630f3`) |
| `claude/project-audit-upgrade-y2ebnr` `34c2944` | 59 | αυστηρός απόγονος του integration (`merge-base` = `7f1298b`) |
| `main` `91d6ea3` | 0 | πρόγονος |
| `cursor/ai-os-fullpage-chat-53e0` `7ce1fe3` | 0 | πρόγονος |

`git merge --ff-only origin/claude/project-audit-upgrade-y2ebnr`. Το HEAD είναι το `34c2944`: **260** commits μπροστά από το `main`, και ταυτόσημο με το μοναδικό tip που περιέχει integration + γύρο 11 (§21–§23). Κανένα άλλο remote branch δεν έχει commit που λείπει. Δεν υπήρχε divergence, άρα δεν έγινε cherry-pick και δεν έμεινε τίποτα απέξω.

## 25. Γύρος 12 — ο assistant πατά τα controls της σελίδας, ένα cache prefix ανά δεδομένο, οπτικός έλεγχος (2026-09-24)

### 25.1 Έλεγχος και ενσωμάτωση του άλλου μοντέλου

`git fetch --all --prune`: δύο branches κινήθηκαν μετά το `34c2944`, και τα δύο **περιέχουν ήδη** όλα τα δικά μας commits.

| branch | commits που μας έλειπαν | περιεχόμενο |
|---|---|---|
| `integration/ai-platform-upgrade` `0cf0962` | 9 | rail κύμα 5 — `/readiness`, `/analytics`, `/research`, `/milestones`, founder dashboard, `BuilderWorkspace`, `PitchDeckBuilder` — «άνοιγμα σε πλήρες μέγεθος» ανά section του rail, CSS που μαζεύει τα viewport grids μέσα στο rail |
| `cursor/ui-upgrade-cloudflare-preview-53e0` `97e0eab` | 1 (ήδη μέσα στο integration) | docs §24 |

**Απόδειξη διατήρησης λειτουργιών, μηχανικά** (όχι «με το μάτι»): για κάθε αρχείο που άλλαξε, σύνολα από i18n keys, hrefs, handlers, EN labels, κλήσεις API και prompts πριν/μετά — **0 εξαφανίσεις** σε 8 αρχεία, μόνο προσθήκες. Μετρήσεις interactive στοιχείων: μία αλλαγή, `/readiness` `AskAiButton 3→2, Button 13→14` — το δεύτερο «Ask AI for a plan» έγινε κουμπί που ανοίγει το section του rail (τεκμηριωμένο de-duplication). Το `analytics_set_period` βασίζεται στο `?period=` — επαληθεύτηκε ότι διαβάζεται ακόμη. `git merge --ff-only` (tag `pre-round12-ff`)· όλοι οι guards πέρασαν στο merged δέντρο, μαζί και ο state-level κανόνας του rail πάνω στα 7 νέα rails.

Ζωντανός έλεγχος της δουλειάς του: 5/7 νέα rails καθαρά στο axe σε 1440 και 390· το `/readiness` είχε `nested-interactive` (τα 6 pips-σύνδεσμοι μέσα σε `role="img"`) — διορθώθηκε. Το dialog πλήρους μεγέθους: τίτλος, description, 0 διπλά ids, 0 υπερχείλιση, καθαρό axe σε 4 σελίδες — αλλά στο κλείσιμο το focus έπεφτε στο `<body>` (ανοίγει από state, όχι από Radix trigger) — διορθώθηκε. Τα 2 console errors σε `/builder` είναι websocket προς το mock API — περιβάλλον, όχι bug.

### 25.2 Μετρήσεις που οδήγησαν τον γύρο

| μέτρηση | τιμή | εργαλείο |
|---|---|---|
| API reads που χρησιμοποιούν οι σελίδες και φτάνει ο assistant | **15 / 104** | `aicoverage.mjs` (στατικό, κάτω όριο: οι εντολές καμβά περνούν από bus) |
| API writes που χρησιμοποιούν οι σελίδες και φτάνει ο assistant | **14 / 167** | ίδιο |
| API reads cached κάτω από 2+ keys | **33 / 138** — σε ~12 με **διαφορετικό prefix**, άρα write σε μια σελίδα δεν ανανέωνε την άλλη | `querykeys.mjs` |
| σελίδες που ο assistant μπορούσε να χειριστεί τα controls τους | **0** | — |
| page titles που σπάνε σε 2 γραμμές στα 1440 | **10 / 138** (0 στα 1920) | `titlewrap.mjs` |
| «Ask AI» στην κεφαλίδα κάθε σελίδας | έφευγε στο `/ai`, **έχανε το page context**, και μόνο *προσυμπλήρωνε* την ερώτηση | ανάγνωση κώδικα |

### 25.3 Τι υλοποιήθηκε

**α. Ο assistant πατά τα controls της σελίδας** (`lib/page-controls.ts`). Μια σελίδα καλεί `usePageControls([...])` με τους *ίδιους* handlers που καλούν τα κουμπιά της: id, ετικέτα EN/EL, αν γράφει, επιλογές (τιμές φίλτρου, περίοδοι, *γραμμές* για εντολές), τρέχουσα τιμή, και γιατί δεν μπορεί να τρέξει όταν δεν μπορεί. Δύο δηλωμένες δυνατότητες ώστε το `writes` της κάρτας επιβεβαίωσης να είναι πάντα αληθές: `use_page_control` (writes false) και `run_page_command` (writes true, reversal `none` — «εκτελεί την εντολή της σελίδας· όπου η σελίδα έχει την αντίθετη εντολή, έτσι αναστρέφεται»). Κάθε executor αρνείται το λάθος είδος, άγνωστο id, επιλογή εκτός λίστας, και control που δηλώνει ότι δεν μπορεί — λέγοντας τι υπάρχει. Το page-context packet τα μεταφέρει στο τοπικό engine και στο μοντέλο. Ο matcher: λέξεις ετικέτας + λέξεις επιλογής, χωρίς τόνους, stem 5 γραμμάτων, ΟΛΕΣ οι λέξεις ονόματος γραμμής («Mike» μόνο δεν επιλέγει «Mike Johnson»), ρήμα θέασης/ενέργειας, και **εντολή που γράφει χρειάζεται δικές της λέξεις** («show Mike Johnson» δεν αναστέλλει κανέναν).

**21 σελίδες, 78 controls (66 προβολής, 12 εντολές):**

| σελίδα | controls |
|---|---|
| `/admin/users` | φίλτρα ρόλου/κατάστασης, ανανέωση, εξαγωγή · εντολές: αναστολή, αποκλεισμός (ρωτά πρώτα), επαναφορά, αλλαγή ρόλου ×5 — άρνηση σε δείγματα |
| `/admin/reports` | καρτέλα ουράς, τύπος, προτεραιότητα, ανανέωση, εξαγωγή, άνοιγμα · εντολές: επίλυση, απόρριψη (μόνο ανοιχτές, μόνο live) |
| `/admin/programs` | κατάσταση, τύπος, ανανέωση, εξαγωγή, άνοιγμα · εντολή: αρχειοθέτηση (ρωτά, αρνείται δείγματα) |
| `/admin/tenants` | κατάσταση, επωνυμία, ανανέωση, εξαγωγή, φόρμα νέου, ρυθμίσεις tenant |
| `/admin/communities` · `/tenant/programs` · `/mentor/earnings` · `/provider/analytics` | φίλτρα / περίοδος / εξαγωγές / φόρμα δημιουργίας |
| `/matches` · `/marketplace` · `/projects` · `/calendar` · `/milestones` · `/research` · `/coaching` · `/events` · `/connections` · `/groups` | φίλτρα, ταξινόμηση, διάταξη, καρτέλες, φόρμα δημιουργίας |
| `/analytics` | περίοδος και καρτέλα μέσω των setters που γράφουν το URL (το Back δουλεύει), ανανέωση |
| `/readiness` | επανεκτίμηση (υπολογισμένο read — το endpoint δεν αποθηκεύει τίποτα, επαληθευμένο στον controller/service), live/showcase |
| `/notifications` | κατηγορία, μόνο αδιάβαστες · εντολή: σήμανση όλων ως αναγνωσμένων |

**β. Ask AI στη θέση του.** `PopupChatContext.ask()` ανοίγει τον assistant της σελίδας στην καρτέλα AI και στέλνει την ερώτηση· το `AIComposer` το χρησιμοποιεί παντού εκτός από το `/ai`. Το `/ai` στέλνει πλέον το `?q=` (11 σύνδεσμοι «Ask AI about this» καταλήγουν εκεί) και αφαιρεί το `?q` ώστε το reload να μη ρωτά ξανά. Αίτημα που απαντά η ίδια η σελίδα δεν σέρνει πια το προεπιλεγμένο graph read του planner.

**γ. Ένα cache prefix ανά δεδομένο.** admin home (`admin-*` → `['admin', …]`, `['events','admin']`, `['jobs','admin']`), `getMyPrograms` (3 keys → `['programs','mine']`, writes → `['programs']`), communities → `['groups','admin']`, org/tenant events → `['events', …]`, tenant automation → `['automation-rules', …]`, SSO admin+tenant → `['sso', …]`, org cohorts/members, memberships, mentorships, coach list, founder stats (και το server seed), achievements, provider dashboard. Guard: `queryKeyCoherence.test.ts` (μία τεκμηριωμένη εξαίρεση: `searchProfiles`, δύο άσχετες αναζητήσεις)· επαληθευμένο ότι αποτυγχάνει στο παλιό δέντρο.

**δ. Οπτικός έλεγχος — ευρήματα και διορθώσεις.** Κεφαλίδα: ο τίτλος παίρνει ελάχιστο 42rem και η μπάρα Ask AI υποχωρεί ως 20rem (10 σπασμένοι τίτλοι στα 1440 → μέτρηση στο §25.5)· `/events`: 3 στήλες το πολύ, κάρτες που αναδιπλώνουν αντί να συγκρούονται («by Elena Papadopoulos84 attending»)· `/builder`: εσωτερική καρτέλα «Summary» αντί για δεύτερο «Overview»· `/discover`: οι δύο σειρές ρόλων λένε τι κάνει η καθεμία («Show» = στενεύει τα αποτελέσματα, «Search only» = αλλάζει το query) και είναι δίγλωσσες.

**Guards που προστέθηκαν:** hook-order για `usePageControls` (lint δεν τρέχει εδώ), ο rail contract αγνοεί τα `usePageControls` blocks (δεν αποδίδουν τίποτα), query-key coherence, 19 tests για page controls (registry, executors, matcher, engine, hook order).

Διόρθωση καταγραφής: το commit `feat(web): twenty pages offer…` είχε στην πραγματικότητα **17** σελίδες· με το επόμενο έγιναν 21.

### 25.4 Πλάνο — επόμενα κύματα, με μετρήσιμο στόχο

| # | κατεύθυνση | τι | στόχος / μέτρηση |
|---|---|---|---|
| 1 | AI-first | `usePageControls` στις υπόλοιπες σελίδες με controls, κατά σειρά πλήθους controls (script: `rail-candidates.mjs` families) — πρώτα `/admin/user-management`, `/admin/billing`, `/data-room/[id]`, `/org/[slug]/admin`, `/fundraising`, `/feed`, investor pipeline/watchlist/scouting, `/jobs`, `/opportunities`, `/shortlist`, `/settings/*` | σελίδες με controls 21 → 60+· ποσοστό writes σελίδων που φτάνει ο assistant (σήμερα 14/167 + εντολές σελίδων) |
| 2 | AI-first | εντολές ανά γραμμή σε κάθε λίστα που έχει row menu (accept intro, apply to programme, archive board, star deal) — ίδιοι handlers, ίδιες επιβεβαιώσεις | κάθε `DropdownMenuItem` με handler έχει αντίστοιχο control (μετρήσιμο στατικά από τον dead-controls scanner) |
| 3 | AI-first | ο assistant διαβάζει *τι δείχνει* η λίστα (όχι μόνο τα controls): `usePublishPageSnapshot` σε κάθε σελίδα με control, με τα φιλτραρισμένα σύνολα | σελίδες με snapshot 3 → όσες έχουν controls |
| 4 | AI-first | undo για εντολές όπου υπάρχει αντίθετη εντολή (suspend ↔ reinstate): `run_page_command` με `reversal: partial` μόνο όταν η σελίδα δηλώνει `undo` | καμία δήλωση reversal χωρίς επαληθευμένη αντίθετη εντολή |
| 5 | Συνοχή δεδομένων | όλα τα query keys από το `queryKeys` factory· κάθε mutation δηλώνει topics όπως οι capabilities (`invalidates`) | 0 array-literal keys εκτός factory |
| 6 | Συνοχή δεδομένων | τα αδιάβαστα/badges (header, sidebar, rail, chat) από μία πηγή — σήμερα `useUnreadCounts` + ανά σελίδα queries | 1 hook ανά μετρητή |
| 7 | UI/UX | κεφαλίδα: έλεγχος 1280px· `/builder` η σειρά 7 καρτελών με οριζόντιο scroll χωρίς ένδειξη· κάρτες σε πλέγματα 4 στηλών σε άλλες σελίδες (ίδιο μοτίβο με `/events`) | 0 σπασμένοι τίτλοι στα 1280/1440, 0 συγκρούσεις κειμένου (probe) |
| 8 | Ποιότητα | ~~το e2e «Ask AI → control → αλλάζει η σελίδα» μέσα στη σουίτα Playwright~~ **έγινε σε αυτόν τον γύρο:** `e2e/assistant-page-controls.spec.ts`, desktop + mobile, 4/4 | στο `test:a11y` |

### 25.5 Πύλες

Όλες στο τελικό δέντρο (`c2ecbc1`), production build με `NEXT_PUBLIC_API_URL=http://localhost:3001` + `e2e/mock-api.mjs`.

| πύλη | αποτέλεσμα |
|---|---|
| web typecheck | 0 errors |
| api typecheck | 0 errors |
| web vitest | 57 αρχεία, **531/531** |
| api vitest | 8 αρχεία, 187/187 |
| script tests (`deploy`, `platform-inventory`) | 12/12 |
| sweep 160 routes × {1440, 390} | 0 page errors · 0 React key warnings · 0 οριζόντια υπερχείλιση · ακριβώς 1 `<h1>` παντού · 0 controls χωρίς όνομα · 0 «NaN/undefined/Invalid Date» · **32 rails** (ήταν 21 στον γύρο 11) |
| axe WCAG 2.1 A/AA — 39 σελίδες (όλα τα rails του γύρου + όσες άλλαξαν) × 2 πλάτη | **0 παραβιάσεις** (πριν τη διόρθωση του `/ai`: 1 `color-contrast` ανά πλάτος στο ενεργό νήμα) |
| page titles σε 2+ γραμμές | **0 / 138** στα 1440 και στα 1280 (ήταν 10 στα 1440) |
| e2e «Ask AI → control → αλλάζει η σελίδα» | Playwright `assistant-page-controls.spec.ts` **4/4** (desktop + mobile) · probe script 16/16 |

**Δύο regressions που έπιασε το sweep, πριν φτάσουν σε αναγνώστη** — και οι δύο από τη δική μας καλωδίωση των controls:

| εύρημα | αιτία | διόρθωση | guard |
|---|---|---|---|
| `/mentor/earnings` React #310 (λευκή σελίδα) | `usePageControls` μετά από `if (!mounted) {` πολλών γραμμών — ο αριθμός hooks άλλαζε μεταξύ renders | το hook πριν από το early return | ο hook-order guard πιάνει πλέον και τη μορφή `if (…) {\n return` — επαληθευμένο ότι αποτυγχάνει στο παλιό αρχείο |
| `/admin/tenants` `.map is not a function` | οι επιλογές διάβαζαν το ωμό payload αντί για το `tenantList` που η σελίδα ήδη φρουρεί | `tenantList` | sweep |

Τι **δεν** αποδεικνύουν: το mock API σερβίρει κενές συλλογές, άρα οι εντολές σε `/admin/users` αρνούνται (σωστά) πάνω στα δείγματα· μια *πραγματική* αναστολή/επίλυση φτάνει στο endpoint μόνο με ζωντανά δεδομένα, και persistence, JWT, Redis δεν ελέγχονται εδώ. Το μοντέλο δεν τρέχει στο stub· οι δικές του κλήσεις `use_page_control`/`run_page_command` περνούν από τους ίδιους executors (unit tests), όχι από e2e. Lint δεν αναφέρεται — το `next lint` δεν έχει flat config (AGENTS.md).

## 26. Γύρος 13 — σχεδιαστικό πέρασμα, δεξί rail όπου χρειάζεται, ελληνικά παντού, ειλικρινή νούμερα (2026-09-26)

### 26.1 Έλεγχος branches

`git fetch --all --prune` (2026-09-26): **κανένα** remote branch δεν έχει commit που μας λείπει.

| branch | μας λείπουν | είναι πίσω από εμάς |
|---|---|---|
| `integration/ai-platform-upgrade` | 0 | 16 |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | 0 | 51 |
| `cursor/ai-os-fullpage-chat-53e0` | 0 | 179 |
| `main` | 0 | 312 |

Δεν υπάρχει τίποτα για merge ή cherry-pick· η δουλειά των άλλων μοντέλων είναι ήδη μέσα (§25.1). Το `integration` μπορεί να γίνει fast-forward στο δικό μας HEAD — δεν έγινε, γιατί είναι άλλο branch και θέλει ρητή άδεια.

### 26.2 Τα βήματα 1–6 του §25.4 — ολοκληρώθηκαν

| # | στόχος (§25.4) | αποτέλεσμα |
|---|---|---|
| 1 | σελίδες με `usePageControls` 21 → 60+ | **75 αρχεία** |
| 2 | κάθε row-menu handler προσβάσιμος ως εντολή ή καταγεγραμμένος με λόγο | guard στο `pageControls.test.tsx` |
| 3 | ο assistant βλέπει τι δείχνει η λίστα | `usePageList` σε **67 αρχεία**· οι υπόλοιπες με controls στο `NO_LIST` με λόγο |
| 4 | undo μόνο με επαληθευμένη αντίθετη εντολή | `undo: (value) => …` ρωτιέται *πριν* τρέξει η εντολή· moderation/role ναι, milestone complete και shortlist remove όχι (χάνουν πεδία) — AGENTS.md |
| 5 | όλα τα query keys από factory | `qk(root, …)`· `queryKeyFactory.test.ts` αποτυγχάνει σε array-literal key και σε write που δεν ταιριάζει σε κανένα key |
| 6 | κάθε μετρητής αδιάβαστων από μία πηγή | ένα hook ανά μετρητή |

### 26.3 Δεξί rail — μόνο όπου το ζητά η σελίδα

Ανατομία κοινή, στο `components/layout/RailParts.tsx`: `RailStats` (αριθμοί, δίγλωσσα, αναδίπλωση), `RailOptions` (ένα-από-πολλά με `aria-pressed` και προαιρετικά counts), `RailAction` (καθαρισμός/εξαγωγή). Όταν ένα φίλτρο του rail αδειάζει τη λίστα, το empty state το λέει και προσφέρει `openRailSection('filters')` — ποτέ δεύτερο αντίγραφο του control.

**Νέα rails (κύμα 6):** `/jobs`, `/groups`, `/learning`, `/events`, `/opportunities`, `/investors`, `/mentoring`, `/shortlist`, `/endorsements`. Σύνολο σελίδων με rail: **34**.

**Απορρίφθηκαν με λόγο:** `/connections` — το μόνο βοηθητικό περιεχόμενο είναι μια λωρίδα μετρητών· ένα rail χρειάζεται ≥2 γνήσια sections, οπότε οι (διορθωμένοι) μετρητές μένουν στη στήλη. `/notifications` — τα φίλτρα *είναι* η κύρια λειτουργία της σελίδας.

**Guard:** ο κανόνας «ένα control ζει στη στήλη ή στο rail, ποτέ και στα δύο» έμεινε ίδιος, αλλά σταμάτησε να μετρά ως control ό,τι δεν είναι: headings, `CardTitle`, `TableHead`, `DialogTitle`, περιεχόμενο `<Dialog>`, και γραμμές `data-column-headers`. Επαληθεύτηκε με αρνητική probe σελίδα (διπλό control → αποτυγχάνει) πριν αφαιρεθεί.

### 26.4 Ειλικρίνεια δεδομένων — τι έλεγε η οθόνη και δεν ίσχυε

| σελίδα | πριν | τώρα |
|---|---|---|
| `/login`, `/register` | «Connect with 10,000+ founders», «10K+ members / 3.2K+ startups / 80+ countries» | τι κάνει το προϊόν· κανένας αριθμός που δεν υπάρχει |
| `/marketplace` | «120+ verified providers», «500+ startups served» (σταθερές) | μετρημένα από τις καταχωρίσεις στην οθόνη |
| `/investor/pipeline` | άθροιζε asks σε € κάτω από «$» | άθροισμα ανά νόμισμα |
| `/org/events` | «Events This Month» — δεν φιλτράριζε ημερομηνία | «Events not cancelled» — ό,τι μετρά |
| `/org/events`, empty states | «Members RSVP automatically» | αφαιρέθηκε — τίποτα δεν κάνει RSVP για λογαριασμό τους |
| `/recommendations` | «Refreshes daily» | «recalculated at least hourly» — cache 1 ώρας (`matching.service`) |
| `/org/startups` empty | «You can also import existing portfolio companies» | αφαιρέθηκε — δεν υπάρχει import |
| `/groups/moderation` | επινοημένες αναφορές ακόμη και με τα δείγματα κλειστά | gated σε `showDemoData`, από τον demo κόσμο |
| `/investors` | — | πραγματικοί επενδυτές πρώτοι, δείγματα μόνο στο demo |
| `/endorsements` | μόνο όσα λάβατε | και όσα δώσατε: `GET /endorsements/given` |
| `/connections` | μετρητές που ακολουθούσαν την καρτέλα | ένα query ανά τύπο |
| `/tenant/sso` | οι κανόνες ρόλων δεν αποθηκεύονταν | `roleMappingRules` στην αποθήκευση· φόρτωση `postLoginRedirect` |
| `/settings/data-export` | κάλεσε endpoint που δεν υπήρχε (timeout) | `GET /api/account/export`: χτίζεται κατά το αίτημα, τίποτα αποθηκευμένο, χωρίς credentials, οι schema-only πίνακες αναφέρονται στο `unavailable` |
| δείγματα calendar/marketplace | «Sarah Lee», «Dr. Papadakis», ο Nikos Andreou ως designer, «YC/Techstars alumni» | πρόσωπα του demo κόσμου στους ρόλους τους· καμία πραγματική εταιρεία |

**Δεν άλλαξαν — απόφαση ιδιοκτήτη:** landing «12,400+» και «95% reported by users»· testimonials (αφαιρέθηκε μόνο η λέξη «real»)· «Trusted by» Y Combinator, Techstars, EIT Digital, Innovate UK, Google for Startups, MIT Delta v· tenant settings «Enterprise Plan 500 members» hard-coded· system settings με σταθερές για session/rate-limit· η διαγραφή λογαριασμού είναι toast προς υποστήριξη· τα νομικά κείμενα (`/terms`, `/privacy`) μόνο στα αγγλικά — η μετάφρασή τους θέλει νομικό έλεγχο· `/themes/alliance` προεπισκόπηση θέματος με δείγματα στατιστικών.

### 26.5 Ελληνικά σε κάθε σελίδα

| μέτρηση | πριν | μετά |
|---|---|---|
| routes με <15% ελληνικά (sweep 1440, >30 λέξεις) | **28** | **2** (`/terms`, `/privacy` — §26.4) |
| JSX text nodes μόνο στα αγγλικά | 2491 | ~1400, από τα οποία ~830 templates του research canvas ή ήδη δίγλωσση contextual help |
| page headers που έπεφταν στα αγγλικά (custom title χωρίς `titleEl`) | 42 σελίδες | 0 |
| toasts | αγγλικά, ~360 call sites | κατάλογος 361 φράσεων στο `strings-toasts.ts`, render-time lookup στο `ToastItem`· `toastCatalog.test.ts` αποτυγχάνει σε νέο toast χωρίς ελληνικά |
| placeholders αναζήτησης/επιλογής | αγγλικά | 166 σε 88 αρχεία (`bilingualInline`) |
| confirm dialogs | αγγλικά | 30 call sites / 36 πεδία |
| status/ρόλοι/κατηγορίες από το API | ωμό enum | `StatusText` (EN + EL) |
| σχετικός χρόνος | «3d ago» παντού | `RelativeTime` αλλάζει formatter και locale του date-fns για Έλληνα αναγνώστη |

Κανόνας που κράτησε: πρόταση γράφεται ολόκληρη σε κάθε γλώσσα, ποτέ κολλημένα κομμάτια («Showing N of M», «Branching from v…», η σύνοψη της σύγκρισης αντιστοιχιών). Σε στενή θέση (κουμπί μέσα σε input, timestamp) μία γλώσσα, η κύρια του αναγνώστη.

### 26.6 Σφάλματα που βρέθηκαν και διορθώθηκαν

| εύρημα | αιτία | διόρθωση | guard |
|---|---|---|---|
| `/investor/pipeline` React #418 μετά από επίσκεψη στο `/settings` | Node ICU γράφει «€500k», Chromium «€500K» (Intl compact) | `formatCompactMoney` — δικό μας K/M/B | 4 unit tests |
| `/calendar`, `/mentor/reviews` #418 σε κάθε επίσκεψη μετά τα μεσάνυχτα | prerender στο build· «σήμερα» υπολογιζόταν στο render | το ημερολόγιο σχεδιάζεται με το ρολόι του client· ημερομηνίες δειγμάτων μετά το mount | **clock probe**: όλα τα 142 routes με το ρολόι του browser +50 ημέρες από τον server → 0 σφάλματα |
| `/investor/pipeline` 1668px σε κινητό 412px | δικό μας `sr-only` span, `absolute` χωρίς positioned πρόγονο μέσα στον scroller | `relative` στο wrapper | `phone-layout.spec.ts` |
| `/profile/edit` οριζόντια υπερχείλιση 116px | κουμπιά sidebar χωρίς grid | `grid grid-cols-1` | `layoutGuards` |
| `/calendar` 30 κελιά ημέρας χωρίς όνομα | κουμπιά μόνο με αριθμό | `aria-label` πλήρης ημερομηνία, `aria-pressed`, `aria-current` | sweep |
| `/register` «Organization · Οργανισμός» έξω από την κάρτα | inline δίγλωσσο σε πλέγμα 2 στηλών | stacked | οπτικός έλεγχος |
| pipeline: επικεφαλίδα στήλης πάνω στην επόμενη | μακρύ ελληνικό χωρίς truncate | `min-w-0 truncate`, «Δέουσα επιμέλεια» | οπτικός έλεγχος |

### 26.7 Αλλαγές ανά route (συνοπτικά)

| route | αλλαγή |
|---|---|
| `/jobs`, `/groups`, `/learning`, `/events`, `/opportunities`, `/investors`, `/mentoring`, `/shortlist`, `/endorsements` | rail (§26.3), controls και λίστες για τον assistant, φίλτρα με counts, empty state που ξέρει για το φίλτρο |
| `/login`, `/register` | δίγλωσσα· χωρίς επινοημένους αριθμούς· σφάλματα φόρμας EN/EL· OAuth κουμπιά |
| `/investor/pipeline` | στάδια, στατιστικά, κάρτες EN/EL· αξία ανά νόμισμα· κινητό |
| `/org/*` (applications, events, members, mentors, programs, startups, cohorts) | status/ρόλοι/καρτέλες/μετρητές EN/EL· ειλικρινείς ετικέτες |
| `/tenant/*` (members, programs, automation, sso) | ίδιο· automation: triggers, κατηγορίες, διακόπτες EN/EL, `aria-pressed` στις καρτέλες |
| `/provider/*`, `/mentor/reviews` | κριτικές, αιτήματα, υπηρεσίες EN/EL· προϋπολογισμοί σε € |
| `/groups/manage`, `/groups/moderation` | EN/EL· δείγματα gated |
| `/admin/feature-flags`, `/admin/user-management`, `/admin/communities` | EN/EL· help callout και στις δύο γλώσσες |
| `/marketplace`, `/matches/compare` | μετρημένα στατιστικά· άξονες αντιστοίχισης EN/EL, σύνοψη ως ολόκληρες προτάσεις |
| `/calendar`, `/mentor/reviews` | hydration (§26.6)· πρόσωπα demo κόσμου |
| `/settings/data-export` | πραγματική εξαγωγή (§26.4) |
| landing, onboarding, pricing, help, cookie banner, shared modals | EN/EL |

### 26.8 Πλάνο AI-first — κάθε στοιχείο και δεδομένο προσβάσιμο από τον assistant

**Απογραφή σήμερα.** 38 δηλωμένες ενέργειες στο `packages/shared/src/actions/declarations.ts` (22 ανάγνωσης, 16 εγγραφής· reversal: 10 full, 4 partial, 7 none). Page controls σε 75 αρχεία, λίστες σε 67, από 160 `page.tsx`. Το `lib/api.ts` εξάγει 446 συναρτήσεις. Ο assistant φτάνει *κάθε σελίδα* μέσω `navigate`, *κάθε section rail* μέσω `open_rail_section`, *κάθε φίλτρο/εντολή που δηλώνει μια σελίδα* μέσω `use_page_control`/`run_page_command` — όχι όμως οντότητες εκτός της σελίδας που είναι ανοιχτή.

Κάθε κύμα ξεκινά με ανάγνωση του controller. Κανένα `reversal` δεν δηλώνεται από πρόθεση (AGENTS.md).

| κύμα | τι | πώς | μέτρηση / πύλη |
|---|---|---|---|
| **A. Απογραφή κάλυψης** | ένα script που για κάθε `page.tsx` λέει: controls, λίστα, rail, ή λόγο που δεν έχει | επέκταση του `platform-inventory.cjs` με τα `usePageControls`/`usePageList`/`NO_LIST` | κάθε σελίδα: κάλυψη ή τεκμηριωμένος λόγος· 0 «άγνωστο» |
| **B. Αναγνώσεις οντοτήτων** | `get_program`, `get_cohort`, `get_application`, `get_deal`, `get_service`, `get_inquiry`, `get_review`, `get_group_posts`, `get_learning_path`, `get_data_room` | δήλωση στο shared, executor ανά app, ίδιο normaliser με τη σελίδα (`lib/api.ts`) | reads που φτάνει ο assistant: 22 → 40· κάθε read έχει unit test με μερικό payload |
| **C. Εγγραφές με επαληθευμένη αναστροφή** | join/leave κοινότητα, apply/withdraw σε πρόγραμμα, accept/decline αίτημα καθοδήγησης, endorse/un-endorse, save search/delete, star/unstar deal | ζεύγη εντολών μόνο όπου ο controller επαναφέρει *ακριβώς* ό,τι άλλαξε· αλλιώς `none` | 0 δηλώσεις `full` χωρίς test που τρέχει εντολή→αναστροφή πάνω στο mock |
| **D. Φόρμες ως πρόταση** | δημιουργία εκδήλωσης, προγράμματος, milestone, επεξεργασία προφίλ | ο assistant συμπληρώνει τα πεδία και δείχνει κάρτα με diff· υποβάλλει ο χρήστης· ποτέ αυτόματη υποβολή | κάθε φόρμα: e2e «ζητώ → βλέπω τα πεδία → υποβάλλω → βλέπω το αποτέλεσμα» |
| **E. Δικαιώματα και ίχνος** | κάθε δήλωση λέει ποιοι ρόλοι· ο server ελέγχει στο `tool-calls.ts` ότι η πρόταση ταιριάζει στη δήλωση· κάθε mutation από τον assistant γράφεται σε `AuditLog` | `AuditLog` είναι schema-only — θέλει `prisma db push` στο περιβάλλον (όχι χειρόγραφο migration) | 0 mutation χωρίς guard στο endpoint· audit entry ανά εκτέλεση (έλεγχος σε πραγματική βάση, όχι στο mock) |
| **F. Αξιολόγηση** | 60 αιτήματα EN/EL με αναμενόμενη ενέργεια/control, ως fixture· e2e ανά κύμα όπως `assistant-page-controls.spec.ts` | planner τοπικά· μοντέλο σε ξεχωριστή, μη-CI σουίτα | ακρίβεια planner ≥ 95% στο fixture· 0 εγγραφή χωρίς κάρτα επιβεβαίωσης |

Σειρά: A → B → C → D, με E να συνοδεύει κάθε εγγραφή από το C και F να μεγαλώνει με κάθε κύμα.

### 26.9 Πύλες

Στο τελικό δέντρο: production build με `NEXT_PUBLIC_API_URL=http://localhost:3001` + `e2e/mock-api.mjs`.

| πύλη | αποτέλεσμα |
|---|---|
| web typecheck | 0 errors |
| api typecheck | 0 errors |
| web vitest | 67 αρχεία, **583/583** (ήταν 531 στον γύρο 12) |
| api vitest | 17 αρχεία, **240/240** (+ `endorsements.service`, `account-export.service`) |
| script tests (`deploy`, `platform-inventory`) | 12/12 |
| sweep 142 static routes @1440 | 0 non-200 · 0 page errors · 0 οριζόντια υπερχείλιση · 0 controls χωρίς όνομα · routes <15% ελληνικά: **2** (`/terms`, `/privacy`) |
| sweep 142 static routes @390 | 0 non-200 · 0 page errors · 0 οριζόντια υπερχείλιση · 0 controls χωρίς όνομα |
| clock probe (ρολόι browser +50 ημέρες) | 142 routes, **0** σφάλματα (`scripts/clock-probe.mjs`) |
| Playwright `test:a11y` (axe WCAG A/AA, corner system, phone layout, assistant e2e) — desktop + mobile | 96 passed / 18 skipped / 2 failed στο πλήρες τρέξιμο· τα 2 πέρασαν 6/6 το καθένα σε επανάληψη (§26.10) |

### 26.10 Τι δεν αποδεικνύουν — και τι μένει ανοιχτό

- **Διακοπτόμενο e2e:** `provider dashboard` (desktop) βρήκε *δύο* `main#main-content` για μια στιγμή (strict-mode violation) σε 1 από 5 τρεξίματα· το `pills keep a circular corner` (mobile) μέτρησε 0 squircles σε 1 από 6. Δεν αναπαράγονται σε `--repeat-each=3`. Η αιτία του διπλού `main` **δεν βρέθηκε** — δεν υπάρχει redirect στο `/dashboard/provider` και το frame τοποθετείται μία φορά από το `dashboard/layout.tsx`. Χρειάζεται trace από αποτυχημένο τρέξιμο.
- Τα δύο sweeps του τελικού build κράτησαν ~25 λεπτά το καθένα αντί για ~9, με παύσεις λεπτών και CPU σε αδράνεια· μεμονωμένες διαδρομές (και οι ίδιες ακολουθίες πλοήγησης) φορτώνουν σε ~1s. Δεν εξηγήθηκε.
- Οι μετρήσεις τρέχουν ως `platform_admin` σε demo mode, με το preview να απαντά στον browser· persistence, JWT, Redis και οι πραγματικοί controllers ελέγχονται μόνο από τα api tests (mocked Prisma).
- Lint δεν αναφέρεται — το `next lint` δεν έχει flat config (AGENTS.md).
- Τα ελληνικά των νομικών σελίδων και οι ισχυρισμοί του §26.4 που δεν άλλαξαν περιμένουν απόφαση ιδιοκτήτη.

## 27. Έλεγχος 2026-10-01 (preview branch) — fast-forward, καμία παράλειψη

`git fetch origin --prune` από το `97e0eab` (§24).

| branch | commits μόνο εκεί | κρίση |
|---|---|---|
| `integration/ai-platform-upgrade` `0e792ce7` | 74 | αυστηρός απόγονος· περιέχει και το Claude |
| `claude/project-audit-upgrade-y2ebnr` `3da7e380` | 73 | πρόγονος του integration (`merge-base` = `3da7e380`) |
| `main` `91d6ea3` | 0 | πρόγονος |
| `cursor/ai-os-fullpage-chat-53e0` `7ce1fe3` | 0 | πρόγονος |

`git merge --ff-only origin/integration/ai-platform-upgrade`. Το HEAD είναι το `0e792ce7`: **335** commits μπροστά από το `main`. Το μοναδικό commit που είχε το integration πέρα από το Claude είναι το χρώμα μάρκας (funnel lilac, 2026-10-01). Κανένα άλλο remote branch δεν έχει commit που λείπει. Δεν υπήρχε divergence.

## 28. Γύρος 14 — κύματα A–F, οπτικό πέρασμα, αριστερό sidebar με hover, πύλες (2026-10-02)

### 28.1 Branches

`git fetch origin` (2026-10-02): **κανένα** remote branch δεν έχει commit που λείπει από το `claude/project-audit-upgrade-y2ebnr`. Μετά το §27 ενσωματώθηκαν, χωρίς παράλειψη: `6d102a7` (απαλότερο lilac, bronze αντί για χρυσό), `cursor/phone-component-sizes-53e0` (`ee927a0`, `477ca95` — μεγέθη chrome στο κινητό, ελάχιστο 44px αφής) με merge `52f2c8f`, και `d932406` (τα `.env.example` μένουν στο git παρά τον νέο κανόνα `.env.*`).

### 28.2 Κύματα A–F — ο assistant χειρίζεται την πλατφόρμα

| κύμα | στόχος | αποτέλεσμα | guard |
|---|---|---|---|
| A | απογραφή: κάθε σελίδα είτε χειρίζεται είτε λέει γιατί όχι | 160 σελίδες · **108** χειρίσιμες · 24 μόνο-ερώτηση · 28 χωρίς controls με λόγο · **0** χωρίς εξήγηση | `aiCoverage.test.ts` (λείπει ή περισσεύει λόγος → αποτυγχάνει) |
| B | αναγνώσεις 22 → 40 | 18 νέοι readers (προγράμματα, προσκλήσεις, φήμη, ετοιμότητα, μέντορες, κρατήσεις, υπηρεσίες, μάθηση, κοόρτες, moderation…) | `copilotReadsWaveB.test.ts` |
| C | εγγραφές με reversal από τον controller | `join_group` (partial), `leave_group`, `apply_to_program`, `send_invite` (partial), `write_endorsement` (partial), `respond_to_mentor_request` | `copilotWritesWaveC.test.ts` |
| D | φόρμες ως προτάσεις | `draft_milestone/event/project/profile`: γεμίζουν τη φόρμα, δεν γράφουν τίποτα· αποθηκεύει μόνο το κουμπί της φόρμας | `formDraft.test.ts` |
| E | δικαιώματα | `roles` στη δήλωση· ίδιο φίλτρο σε `GET /ai/tools`, `reviewToolCall`, και engine | `tool-calls.test.ts`, `copilotRoleGating.test.ts` |
| F | 60 αιτήματα EN/EL, ≥95% | 91,7% → **100%** (EN 30/30, EL 30/30) | `copilotEval.test.ts` |

Σύνολο δηλώσεων: **66** — 36 αναγνώσεις, 30 μεταβολές (reversal: 9 full, 7 partial, 14 none· οι 4 draft γράφουν τίποτα). Το `send_connection` είναι πλέον `partial`, επαληθευμένο στον controller: `DELETE /connections/:id` → `withdrawRequest`, μόνο ο αποστολέας, μόνο όσο είναι `pending` (AGENTS.md διορθώθηκε).

### 28.3 Αριστερό sidebar — σύμπτυξη/ανάπτυξη με κουμπί και με hover

Όπως το δεξί rail: το κουμπί στην άκρη καρφιτσώνει ανοιχτό/κλειστό (`aria-expanded`)· σε σύμπτυξη, το ποντίκι πάνω στο rail το ανοίγει **πάνω** από τη σελίδα μετά από 180ms (ένα γρήγορο πέρασμα δεν το ανοίγει), και κλείνει όταν φύγει ο δείκτης, με Escape, ή με πλοήγηση. Αφή/γραφίδα δεν ανοίγουν peek. Live έλεγχος (Playwright, 1440): 197px → 56px με το κουμπί, hover → 197px `data-peek`, έξοδος → 56px, πέρασμα <180ms → 56px, κουμπί → 197px.

**Σφάλμα που βρέθηκε live:** το Escape το έκλεινε και 8ms μετά άνοιγε ξανά — το reflow στέλνει νέο `pointerenter` κάτω από τον ακίνητο δείκτη. Διόρθωση: μετά από Escape/πλοήγηση το peek κρατιέται κλειστό ώσπου να φύγει ο δείκτης. Guard: `e2e/navigation-chrome.spec.ts`.

### 28.4 Διακοσμητικά εικονίδια — τρεις σιωπηλές βλάβες του κανόνα CSS

Ο κανόνας (από το `0e792ce`) κρύβει glyph δίπλα σε ορατή ετικέτα και μέσα σε κάρτες, για μινιμαλισμό. Η πρόθεση κρατήθηκε· οι βλάβες της διορθώθηκαν:

| βλάβη | μέτρηση πριν | αιτία | διόρθωση | μετά |
|---|---|---|---|---|
| κενά κουμπιά-εικονίδια (copy, delete, more, help) | **364** σε 95 routes (1440) | το `.sr-only` όνομα μετρούσε ως ορατή ετικέτα | η ετικέτα δεν είναι svg, `.sr-only`, ούτε `.hidden` | **0** (146 routes, 1440 και 390) |
| η πρώτη διόρθωση ακύρωσε όλο τον κανόνα | 18 άκυροι selectors | `:has()` μέσα σε `:has()` είναι άκυρο → πέφτει όλη η λίστα | ένα επίπεδο `:has()` | 0 άκυροι (έλεγχος στο Chromium) |
| κενά κουμπιά μόνο στο κινητό (History, Share…) | 4 στο `/builder/pitch-deck` @390 | ετικέτα `hidden sm:inline` = `display:none` κάτω από 640px | `.hidden` δεν μετρά ως ετικέτα (45 σημεία) | 0 |
| άδεια χρωματιστά «πηγάδια» εικονιδίων | **181** σε 37 routes | κρυβόταν το εικονίδιο, έμενε το κουτί | κρύβεται και το πηγάδι | 0 |
| χαμένα εικονίδια κατάστασης/περιεχομένου | σήματα επιτευγμάτων = κενοί κύκλοι | ο κανόνας κάρτας τα έκρυβε όλα | check/circle/lock/spinner μένουν· `[data-keep-icon]` για περιεχόμενο | ορατά |

Guards: `decorativeIcons.test.ts` (nested `:has`, ετικέτα χωρίς `.sr-only`/`.hidden`, εξαιρέσεις κατάστασης) και στήλη `blankIcons` στο `platform-sweep.mjs`.

### 28.5 Αλλαγές ανά σελίδα

| route | αλλαγή | λειτουργία που αφαιρέθηκε |
|---|---|---|
| `/projects/create` | δεξιά στήλη: ζωντανή προεπισκόπηση και λίστα «Υποχρεωτικά / Προτεινόμενα»· η σύνοψη του βήματος 4 εκεί σε μεγάλες οθόνες, στη θέση της κάτω από `lg` | καμία |
| `/builder/pitch-deck` | η στήλη 12 κουμπιών «Add Slide» έγινε μενού στο τέλος της λίστας διαφανειών — όλοι οι τύποι, το ✓ «στο deck», η υπόδειξη | καμία |
| `/settings/billing` | και οι δύο κάρτες πλάνου δείχνουν τι περιλαμβάνουν (κοινή πηγή `PLAN_HIGHLIGHTS` με το `/pricing`)· ελληνικά σε τρόπο πληρωμής, ανανέωση, δοκιμή, στοιχεία, κατάσταση τιμολογίου· η φόρμα στοιχείων σε μία στήλη στο κινητό | καμία |
| `/pricing` | ελληνικά σε περιγραφές, CTA, εκπτώσεις, πίνακα σύγκρισης· ονόματα στα ✓/✗ (με `relative`, αλλιώς το sr-only φάρδαινε τη σελίδα κατά 181px στο κινητό) | καμία |
| `/privacy`, `/terms` | ελληνική ημερομηνία και σημείωση ότι ισχύει το αγγλικό κείμενο· το νομικό κείμενο **δεν** παραφράζεται | — |
| `/achievements`, `/programs` | σήματα και avatar fallback με `data-keep-icon` | καμία |
| `/` | οι τίτλοι των καρτών λειτουργιών αναδιπλώνονται (ο ελληνικός τίτλος έπεφτε πάνω στη διπλανή κάρτα) | καμία |
| `/builder/*` (CollabToolbar) | Variants και Proposals παίρνουν όνομα με το πλήθος: στο κινητό η ετικέτα `hidden sm:inline` ήταν το μόνο τους όνομα | καμία |
| `/analytics` | οι γραμμές-σύνδεσμοι «δεν μετριούνται ακόμα» γίνονται στόχοι 24px (ήταν 16,5px) | καμία |
| `/opportunities` | το tint του badge «Θέση εργασίας» 20% → 10%, ώστε το ελληνικό δευτερεύον κείμενο να περνά 4,5:1 | καμία |

### 28.6 Αντίθεση θεμάτων — παλινδρόμηση από το `0e792ce`

Το `scripts/check-theme-contrast.py` έδινε 0 στο `3da7e38` και **27** από το `0e792ce` (lilac ως χρώμα μάρκας). Το ίδιο το script διάβαζε λάθος τα `html.dark.role-*` (regex χωρίς `html`): 4 ψευδή, 23 αληθινά. Διορθώσεις **μόνο σε φωτεινότητα ή χρώμα ετικέτας** — οι αποχρώσεις της απόφασης μένουν:

- σκούρο θέμα (και `html.dark.role-*`): το lilac/teal/bronze/violet γέμισμα μένει ανοιχτό· η ετικέτα γίνεται σκούρο μελάνι της ίδιας απόχρωσης (6,2–7,0:1)· το κόκκινο destructive 58% → 51% με λευκή ετικέτα.
- `alliance` 46% → 41%, `cofounder` 58% → 54%, `role-mentor` 42% → 41%, `role-investor` 44% → 42% (primary, accent, ring μαζί).

Αποτέλεσμα: **0** αποτυχίες κάτω από 4,5:1 σε 13 πλαίσια θέματος.

Τέσσερα e2e assertions δεν μπορούσαν πια να περάσουν για λόγους εκτός κώδικα προϊόντος· άλλαξαν ώστε να φυλάνε την τρέχουσα απόφαση, όχι να τη χαλαρώνουν:

| test | γιατί αποτύγχανε | τώρα |
|---|---|---|
| «όλα squircle» | το `0e792ce` αφαίρεσε ρητά το `corner-shape: squircle` («όπως στο cursor.com») | «γωνίες απλά κυκλικά τόξα» — αποτυγχάνει σε οποιοδήποτε άλλο σχήμα |
| περιοχή toast | το όνομα έγινε δίγλωσσο («Notifications. Ειδοποιήσεις») | ταιριάζει με το αγγλικό πρόθεμα, ελέγχει ακόμα `aria-live` |
| «ένα app shell» | μετρούσε κάθε `<aside>`· το `/discover` έχει και rail («Page tools») | μετρά το `aside` «Main navigation» |
| first-run tour (από `a0ee50b`) | `getByTestId` — το `reactRemoveProperties` αφαιρεί τα `data-test*` στο production build που τρέχει η σουίτα, άρα δεν πέρασε ποτέ | με ρόλο: `dialog` «Your match summary», axe στο ίδιο dialog |

### 28.7 Πύλες

| πύλη | αποτέλεσμα |
|---|---|
| `tsc` web / api | 0 σφάλματα / 0 σφάλματα |
| vitest web | **749/749** (92 αρχεία) |
| vitest api | **244/244** (17 αρχεία) |
| `node --test` scripts | 12/12 |
| production build (`NEXT_PUBLIC_API_URL=http://localhost:3001`) | επιτυχές |
| sweep 146 routes @1440 | 0 σφάλματα, 0 οριζόντιο scroll, 0 ανώνυμα, 0 κενά εικονίδια |
| sweep 146 routes @390 | 0 σφάλματα, 0 οριζόντιο scroll, 0 ανώνυμα, 0 κενά εικονίδια, 0 άδεια πηγάδια· ελληνικά «n/a» (μία γλώσσα στο κινητό, σχεδιαστικά)· `/pricing` 181px → 0 μετά τη διόρθωση |
| `clock-probe` +50 ημέρες | 142 routes, 0 που πετούν |
| `check-theme-contrast.py` | 0 (ήταν 27 από το `0e792ce`) |
| `rail-candidates.mjs` | 42 σελίδες με rail, 0 υποψήφιες χωρίς |
| e2e (`test:a11y`: axe, phone layout, sidebar, εικονίδια, tour) | **223 passed, 0 failed**· 19 skipped σκόπιμα (16 phone-layout + 2 μόνο-κινητό στο desktop, 1 hover sidebar στο κινητό). Πρώτη εκτέλεση του γύρου: δεκάδες αποτυχίες αντίθεσης από το `0e792ce`· δεύτερη: 8 (§28.5–28.6) |

### 28.8 Τι δεν αποδεικνύουν

Το σύνολο αξιολόγησης του κύματος F το έγραψα εγώ· 100% εκεί είναι ένδειξη, όχι απόδειξη, για το πώς γράφουν πραγματικοί άνθρωποι. Το `AuditLog` (καταγραφή ενεργειών του assistant) υπάρχει μόνο στο `schema.prisma` — χρειάζεται `prisma db push` για να αποθηκεύεται. Η ρύθμιση ρόλων είναι καθρέφτης των guards των endpoints για το μοντέλο, όχι εξουσιοδότηση. Οι μετρήσεις τρέχουν ως `platform_admin` σε demo mode, σε δύο πλάτη. Lint δεν αναφέρεται (`next lint` χωρίς flat config).

## 29. Επτάφασο πέρασμα καθαρότητας (2026-10-03) — θέμα, τύπος, αναπνοή, ροή, καταστάσεις, αφή, πιστοποίηση

Μετρήσεις πρώτα, αλλαγή μετά. Κάθε φάση commit χωριστά· οι φρουροί (typecheck 0, tests, sweep 142, αντίθεση 0) έτρεξαν σε κάθε βήμα.

### 29.1 Φάση 1 — Χρώμα (`f5148e6c`)

Κατηγοριοποίηση κάθε hex εκτός tokens: νόμιμα (λογότυπα τρίτων, branding pickers, theme swatches, presence cursors, sticky notes, `_error` fallback) μένουν· σεμαντικά παίρνουν οικογένεια status (`--status-*-mark`) ή το νέο `--chart-2..6`. Νέα tokens `--chart-2..6` ανά θέμα για αρμονικούς κατηγορικούς τόνους (ίδια φωτεινότητα με τα marks, ≥35° απόσταση απόχρωσης από το accent). `preview-api` breakdown, `DashboardHome` tier colors, `AdminAnalyticsDashboard` rarity, `OrgAnalyticsCharts`, `investor/portfolio` sectors πάνε σε tokens. Φρουρός: quoted-hex στο `semanticColorCoverage.test.ts` με allowlist — 3/3 tests. `border-primary` (328): όλα επιλεγμένα/ενεργά, τίποτα διακοσμητικό — κρατήθηκαν.

### 29.2 Φάση 2 — Τυπογραφία (`fe46b9ef`)

Διόρθωση υπόθεσης: `text-2xs` έχει floor 12.24px (`max()`), όχι 10–11px — η κλίμακα ήταν ήδη Cursor-επιπέδου. Arbitrary `text-[9-11px]` (κάτω από το floor) → `text-2xs`. Τελευταίο `font-bold` σε εφαρμογής-heading (`referrals`) → `font-semibold`. Τα `font-extrabold` στα match-score μένουν (data display). Το δίγλωσσο δεύτερο επίπεδο ήταν ήδη συστηματικό (0.85em, floor 12px, inherit σε γεμιστά κουμπιά). Πολιτική στο `AGENTS.md`.

### 29.3 Φάση 3 — Αναπνοή και ανύψωση (`dde276da`)

Οι σκιές ήταν ήδη tokenized (`sm/md` = `none`, μόνο `lg+` σε overlays) — οι 335 κλήσεις `shadow-sm` αδρανείς. Πραγματικά ευρήματα:
- **`hover:shadow-*` σε ~50 entity cards** → `hover:border-primary/30` + `transition-colors`, η σύμβαση της πλατφόρμας (shadow-md δεν αποδίδει, shadow-lg σήκωνε κάρτα ενάντια στο flat contract).
- **`p-0`/`px-0`/`pt-0` σε μέρη κάρτας έχαναν δύο φορές**: source order στο `@layer utilities`, μετά το unlayered `[data-theme="minimal"]` block. ~30 call sites ζητούσαν flush tables/media και έπαιρναν 28px padding παντού. Unlayered explicit-zero rules στο τέλος του sheet (0,2,0) — επαληθεύτηκε στον browser: `p-0` αποδίδει 0px, header→content seam ~18px.
- `CardContent`/`CardFooter` έχασαν το νεκρό `pt-0`· verify-email έχασε `shadow-lg`· investor pipeline, learning, onboarding πήραν το border affordance.

### 29.4 Φάση 4 — Τοποθέτηση (`53755db5`)

`rail-candidates.mjs`: 51 σελίδες με rail, **0 υποψήφιες** με 3+ control families χωρίς rail, 1 απορριφθείσα τεκμηριωμένα (`/org/settings`) — το rail gap-fill ήταν ήδη πλήρες. Ανομοιομορφία: το πρώτο stack κάτω από `AppShell` ανάμεικτο (`space-y-4` ×2, `space-y-5` ×10, `space-y-6` ×27). Όλα page-level → `space-y-6`· το ένα Tabs wrapper κρατά `space-y-4` (tab bar κοντά στο panel του).

### 29.5 Φάση 5 — Καταστάσεις (`a7e007ea`)

25 στοιχεία με `disabled:opacity-*` χωρίς `disabled:cursor-not-allowed` — το fade έλεγε «σβηστό» αλλά ο κέρσορας «κλικάρισμα». Και τα δύο τώρα. `Button`/`TabsTrigger` εξαιρούνται σκόπιμα (`pointer-events-none`). Focus: ο unlayered `focus-visible` κανόνας καλύπτει ήδη κάθε `a/button/[role=button]/[tabindex]`. Empty states: `EmptyStates.tsx` η ενιαία σύμβαση.

### 29.6 Φάση 6 — Αφή και κίνηση (`24b6902f`)

Το phone floor (44px κάτω από 640px) κάλυπτε `h-8/9/10`, όχι `h-7` (28px) — τα canvas toolbars και panel controls. Τώρα και `h-7`/`w-7`/`min-h-7`. Επαλήθευση στα 390px: ελάχιστο 43.5px. `prefers-reduced-motion` υπήρχε ήδη (δύο media queries). Test `phoneTouchFloor` ενημερώθηκε.

### 29.7 Πύλες — τελική πιστοποίηση

| πύλη | αποτέλεσμα |
|---|---|
| `check-theme-contrast.py` | **0 αποτυχίες** <4.5:1, όλα τα θέματα |
| `tsc` web | **0 σφάλματα** |
| vitest web | **760/760** (95 αρχεία) |
| sweep 142 routes @1440 | **0 σφάλματα, 0 xScroll, 0 ανώνυμα, 0 dead bands, 0 κενά εικονίδια** |
| screenshots | 4 φωτεινά θέματα στο `/readiness` + `/settings/notifications` + `/matches` — accent, rings, radar, «Co» θεματικά |
| hex guard | 3/3 — νέα literals μόνο στο allowlist |
| `phoneTouchFloor` | h-7/8/9/10 → 44px κάτω από 640px |

### 29.8 Τι δεν αποδεικνύουν

Οι έλεγχοι αντίθεσης μετρούν ζεύγη tokens, όχι κάθε κατάσταση κειμένου σε κάθε επιφάνεια. Το sweep τρέχει ως `platform_admin` σε demo mode στα 1440px — δεν είναι authorization test. Τα 390px μετρήθηκαν δειγματοληπτικά, όχι σε κάθε route. `space-y-6` ως section rhythm είναι σύμβαση πλειοψηφίας, όχι φρουρός — νέα σελίδα μπορεί να ξεφύγει χωρίς lint. Οι «νόμιμες» hex περιοχές (canvas, branding) αξιολογήθηκαν ανά περίπτωση· το allowlist είναι η τεκμηρίωση, όχι απόδειξη ορθότητας.

## 30. Έλεγχος 2026-10-03 και πλάνο επόμενου κύκλου — κάθε σελίδα, component, modal, button

### 30.1 Git — καμία παράλειψη

`git fetch origin --prune` στις 2026-10-03. Το τοπικό `cursor/ui-upgrade-cloudflare-preview-53e0` ήταν στο `9d8b6211`. Το `origin/claude/project-audit-upgrade-y2ebnr` (`3c2b32ca`) είναι αυστηρός απόγονος: merge-base με το `cursor/phone-component-sizes-53e0` είναι το `477ca958`, και το phone branch έχει **0** commits έξω από το Claude. Έγινε `git merge --ff-only` στο `3c2b32ca`. Μετά το fast-forward, **κάθε** remote έχει 0 commits που λείπουν από το HEAD:

| remote | SHA | commits που δεν είναι στο HEAD |
|---|---|---|
| `claude/project-audit-upgrade-y2ebnr` | `3c2b32ca` | 0 |
| `cursor/phone-component-sizes-53e0` | `477ca958` | 0 (πρόγονος) |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | `9d8b6211` πριν το ff | 0 |
| `integration/ai-platform-upgrade` | `0e792ce7` | 0 |
| `cursor/ai-os-fullpage-chat-53e0` | `7ce1fe32` | 0 |
| `main` | `91d6ea3a` | 0 · το HEAD είναι 368 commits μπροστά |

Δεν έγινε merge του April `main`. Δεν υπάρχει δεύτερο tip με δουλειά που έμεινε έξω. Το §28 και το §29 είναι ήδη μέσα στο `3c2b32ca`· αυτό το τμήμα δεν τα ξανακάνει. Καταγράφει τι μετρήθηκε **τώρα** στον κώδικα και ποιο είναι το επόμενο βήμα, όχι μια λίστα ευχών.

### 30.2 Μέτρηση σε αυτό το tip

| αντικείμενο | μέτρηση | πηγή |
|---|---|---|
| σελίδες `page.tsx` | **160** | `apps/web/src/app` |
| components `.tsx` | **261** | `apps/web/src/components` |
| `<Button>` | **1324** σε αρχεία `.tsx` | κλήση του κοινού component |
| native `<button>` | **571** σε 163 αρχεία | κυρίως canvas, research, chat, matches |
| αρχεία με `Dialog` / `Sheet` | **54**, όλα με `DialogTitle` ή `SheetTitle` στο ίδιο αρχείο | δεν λείπει δείκτης τίτλου |
| σελίδες με άμεσο `PageRail` ή παιδί που τον έχει | βλ. στήλη rail στον κατάλογο | το `rail-candidates` του §29.4 έδωσε 51 rails και 0 υποψήφιες |
| λόγοι «ο assistant δεν ενεργεί» | **50** routes | `scripts/ai-coverage-reasons.json` |
| σελίδες με `SampleDataNotice` στο `page.tsx` | βλ. κατάλογο | το δείγμα μένει δείγμα |

### 30.3 Σύμβαση που ισχύει για κάθε button

Κοινή πηγή: `components/ui/button.tsx` και το phone floor στο `globals.css` (κάτω από 640px).

| variant | ρόλος | πού |
|---|---|---|
| `default` | η μία χρωματιστή ενέργεια της σειράς | αποθήκευση, δημιουργία, κύριο CTA |
| `secondary` | γέμισμα χωρίς να ανταγωνίζεται το primary | δευτερεύουσα ενέργεια στην ίδια σειρά |
| `outline` | hairline, ίδιο με κάρτα | ακύρωση δίπλα σε primary, φίλτρα |
| `ghost` | χωρίς κουτί | toolbar, γραμμή πίνακα, icon δίπλα σε κείμενο |
| `destructive` | διαγραφή / μη αναστρέψιμο | πάντα μέσα σε `confirm-dialog`, ποτέ μόνο του σε λίστα |
| `link` | κείμενο με υπογράμμιση | μέσα σε παράγραφο· εξαιρείται από το ύψος 44px |

| size | κάτω από `md` | `md`–`lg` | `lg`+ (root 82%) |
|---|---|---|---|
| `xs` | 28px (`h-7`)· στο τηλέφωνο το floor το πάει στα 44px | 28px | `min-height: 28px × --chrome-y` |
| `sm` | 44px | 32px | 32px × chrome |
| `md` (default) | 44px | 36px | 36px × chrome |
| `lg` | 44px | 40px | 40px × chrome |
| `xl` | 48px | 48px | 48px × chrome |
| `icon` | 44×44 | 36×36 | 36×36 |

Το floor (`:is(button, a, [role=tab], [role=button])` με `h-7`/`h-8`/`h-9`/`h-10`) καλύπτει και τα 571 native `<button>` **όταν** φορούν αυτές τις κλάσεις. Δεν αλλάζει tablet ούτε desktop: το media query κόβει στα 639.98px.

**Επόμενο, ένα, για όλα τα κουμπιά:** φρουρός στο sweep που αποτυγχάνει αν σε 390px ένα `button` / `[role=button]` / tab έχει computed height < 44px, εκτός από `size=link` και κείμενο μέσα σε παράγραφο. Μέχρι να μπει, τα 571 native μένουν το μόνο σημείο που ένα νέο `h-6` ή arbitrary height μπορεί να ξεφύγει. Δεν ξαναγράφουμε τα 1324 call sites.

Κάθε κουμπί που είναι μόνο εικονίδιο κρατά `aria-label` δίγλωσσο (`bilingualAria`). Το §28.4 μέτρησε 0 κενά εικονίδια σε 146 routes στα 1440 και στα 390. Νέο icon button χωρίς όνομα αποτυγχάνει το `decorativeIcons` + τη στήλη `blankIcons`.

### 30.4 Σύμβαση που ισχύει για κάθε modal και sheet

`DialogContent`: καρφωμένο πάνω στο τηλέφωνο (`top: max(0.75rem, safe-area)`), κεντραρισμένο από `md`, `max-h: min(92dvh, 720px)`, κλείσιμο 44×44 με `aria-label` «Close dialog. Κλείσιμο παραθύρου», `pr-12` στον τίτλο ώστε να μην πέφτει πάνω στο Χ. `Sheet`: τέσσερις πλευρές, κάτω με `safe-area-inset-bottom`, πλάτος `min(22rem, 92vw)`. Overlay και τα δύο `shadow-none`. `prefers-reduced-motion` σβήνει το animation του dialog.

Τα 54 αρχεία έχουν δείκτη τίτλου. Ο τίτλος δεν είναι απόδειξη ότι το Radix τον συνδέει με `aria-labelledby` σε κάθε κατάσταση (κενό children, conditional render). **Επόμενο:** ένα τεστ που ανοίγει κάθε dialog σε demo και αποτυγχάνει αν το `dialog` δεν έχει accessible name. Δεν προσθέτουμε νέα modals σε αυτόν τον κύκλο.

| αρχείο | είδος | επόμενο |
|---|---|---|
| `apps/web/src/app/saved-searches/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/pitch/[id]/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/jobs/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/mentoring/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/provider/services/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/provider/projects/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/research/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/org/[slug]/admin/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/org/applications/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/communities/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/feature-flags/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/reports/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/billing/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/programs/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/user-management/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/admin/taxonomy/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/matches/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/tenant/programs/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/tenant/members/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/recommendations/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/programs/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/opportunities/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/data-room/[id]/page.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/groups/components/CreateGroupModal.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/app/messages/ComposeMessageDialog.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/ui/rich-text-editor.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/ui/export-dialog.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/ui/image-cropper.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/ui/share-modal.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/ui/confirm-dialog.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/mentoring/SessionDialogs.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/auth/TwoFactorManagement.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/messaging/ConversationValidation.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/research/BoardTemplates.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/research/EntityReferenceSelector.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/research/BoardHistoryDrawer.tsx` | Dialog, Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/research/ResearchNodeViewer.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/research/CanvasVersionPanel.tsx` | Dialog, Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/research/BoardSettingsPanel.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/builder/VersionHistoryDrawer.tsx` | Dialog, Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/builder/ReviewPanel.tsx` | Dialog, Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/builder/CollabToolbar.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/builder/BuilderWorkspace.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/builder/BranchPanel.tsx` | Dialog, Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/layout/MobileNav.tsx` | Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/layout/PageRail.tsx` | Dialog, Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/feed/CreatePost.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/collaboration/CollaborationStarter.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/common/ReportBlockModal.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/common/CommandPalette.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/common/ConnectionRequest.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/common/ScheduleCallModal.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/endorsements/GiveEndorsementDialog.tsx` | Dialog | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |
| `apps/web/src/components/discover/SearchFilters.tsx` | Sheet | φρουρός accessible name· η σύμβαση του 30.4 ήδη ισχύει |

### 30.5 Κάθε component — ανά φάκελο

Τα 261 αρχεία κληρονομούν tokens, `focus-visible`, reduced-motion και το phone floor. Δεν ξανασχεδιάζονται ένα-ένα. Η στήλη «επόμενο» είναι το μόνο ανοιχτό για τον φάκελο· αν είναι «κανένα», το §29 τα πιστοποίησε και δεν ανοίγει νέα δουλειά χωρίς νέα μέτρηση.

| φάκελος | αρχεία | επόμενο |
|---|---|---|
| `common` (55) | `AnimatedCard.tsx`, `AnimatedList.tsx`, `AppRouteLoading.tsx`, `BilingualText.tsx`, `ChatBubble.tsx`, `CommandPalette.tsx`, `ConnectionRequest.tsx`, `CookieConsent.tsx`, `DemoDataToggle.tsx`, `DomI18n.tsx`, `EmptyState.test.tsx`, `EmptyState.tsx`, `EmptyStates.tsx`, `ErrorBoundary.tsx`, `FirstRunTour.tsx`, `FormDraftNotice.tsx`, `HelpCallout.tsx`, `I18nProvider.tsx`, `LanguagePreferenceToggle.tsx`, `LanguageSwitcher.tsx`, `LazyComponents.tsx`, `LegalText.test.tsx`, `LegalText.tsx`, `LoadingCard.tsx`, `LocalTime.tsx`, `LocaleSync.tsx`, `MatchCard.tsx`, `NotificationCenter.tsx`, `OfflineIndicator.tsx`, `OnboardingSteps.tsx`, `OptimizedLink.tsx`, `PageContextualHelp.tsx`, `PageLoading.tsx`, `PageSkeletons.tsx`, `PageTransition.tsx`, `PersonActions.tsx`, `PreviewSessionGuard.tsx`, `ProfileCompletion.tsx`, `QuickActions.tsx`, `RelativeTime.tsx`, `ReportBlockModal.tsx`, `RoleBadge.tsx`, `RoleSwitcher.tsx`, `RouteError.tsx`, `SampleDataNotice.tsx`, `SanitizedHtml.tsx`, `ScheduleCallModal.tsx`, `ServiceWorkerRegistration.tsx`, `SkillChip.tsx`, `Spinner.tsx`, `StatCard.tsx`, `StatusText.tsx`, `ThemeToggle.tsx`, `UnavailableButton.tsx`, `UnavailableMenuItem.tsx` | τα 55 είναι τα shared controls (EmptyState, CommandPalette, ConnectionRequest, ReportBlock, ScheduleCall, SampleDataNotice). Επόμενο: το τεστ accessible name του 30.4 στα τρία modals του φακέλου. |
| `ui` (39) | `accordion.test.tsx`, `accordion.tsx`, `avatar.tsx`, `badge.tsx`, `bulk-action-bar.tsx`, `button.test.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `confirm-dialog.test.tsx`, `confirm-dialog.tsx`, `date-range-picker.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `enhanced-card.tsx`, `export-dialog.tsx`, `form-field.test.tsx`, `form-field.tsx`, `hairline-meter.tsx`, `image-cropper.tsx`, `input.tsx`, `label.tsx`, `progress.test.tsx`, `progress.tsx`, `rich-text-editor.tsx`, `select.tsx`, `settings-row.tsx`, `share-modal.test.tsx`, `share-modal.tsx`, `sheet.tsx`, `skeleton.tsx`, `skeletons.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.test.tsx`, `toast.tsx`, `tooltip.tsx` | primitives. Επόμενο: ο φρουρός ύψους 44px του 30.3, όχι νέα variants. |
| `research` (34) | `AIAnalysisPanel.tsx`, `BoardExport.tsx`, `BoardHistoryDrawer.tsx`, `BoardMiniMap.test.tsx`, `BoardMiniMap.tsx`, `BoardSettingsPanel.tsx`, `BoardSummaryPanel.tsx`, `BoardTemplates.tsx`, `CanvasAlignmentGuides.tsx`, `CanvasBranchSelector.tsx`, `CanvasCommentPin.tsx`, `CanvasCopilotPanel.tsx`, `CanvasDrawToolbar.test.tsx`, `CanvasDrawToolbar.tsx`, `CanvasInspectorPanel.tsx`, `CanvasRulers.tsx`, `CanvasVersionPanel.tsx`, `CollaboratorsBar.tsx`, `CommentsPanel.tsx`, `EmptyCanvasStarter.tsx`, `EntityReferenceSelector.tsx`, `FlowDiagramNode.tsx`, `MermaidDiagramNode.tsx`, `NodeTagsEditor.tsx`, `PdfAnnotationViewer.tsx`, `ResearchConnectorLines.tsx`, `ResearchGroupFrame.tsx`, `ResearchNodeCard.tsx`, `ResearchNodeViewer.tsx`, `RichTextEditor.tsx`, `ShapeLibraryPanel.tsx`, `ShapeNode.tsx`, `VisualTemplateNode.tsx`, `WhiteboardNode.tsx` | canvas tools είναι native buttons· το h-7 μπήκε στο floor στη φάση 6. Επόμενο: ο ίδιος φρουρός στα 390px μέσα στο board, με τον inspector κλειστό (`data-phone-inspector=closed`). |
| `layout` (23) | `AppShell.tsx`, `CommandPaletteHost.tsx`, `GlobalFloatingUi.tsx`, `LandingNav.tsx`, `MobileBottomNav.tsx`, `MobileNav.tsx`, `MobileNavigation.test.tsx`, `ModeSwitcher.tsx`, `NotificationsBell.tsx`, `PageRail.test.tsx`, `PageRail.tsx`, `PageRailContext.tsx`, `PhonePlaceholderFit.tsx`, `RailParts.test.tsx`, `RailParts.tsx`, `RoleTheme.tsx`, `SearchBar.tsx`, `SideNav.tsx`, `SidebarContext.tsx`, `SkipToContent.tsx`, `TopBar.tsx`, `UserMenu.test.tsx`, `UserMenu.tsx` | AppShell, rails, bottom nav. Επόμενο: κανένα οπτικό· το hover-peek του αριστερού sidebar έχει e2e. Μένει να μην αλλάξει το 82% στο desktop. |
| `builder` (17) | `ActivityTimeline.tsx`, `ApplicationGenerator.tsx`, `ApplicationProgramsChrome.tsx`, `ArtifactDiffView.tsx`, `BranchPanel.tsx`, `BuilderStageChrome.tsx`, `BuilderWorkspace.tsx`, `BusinessModelCanvas.tsx`, `CollabToolbar.tsx`, `FinancialPlanning.tsx`, `IdeaCore.tsx`, `MVPPlanner.tsx`, `MarketAnalysis.tsx`, `PitchDeckBuilder.tsx`, `ReadinessScoring.tsx`, `ReviewPanel.tsx`, `VersionHistoryDrawer.tsx` | έγγραφα, pitch, versions, branches. Επόμενο: ο assistant δεν γράφει στο canvas/builder (§6). Τα draft μένουν προτάσεις φόρμας. |
| `dashboard` (11) | `DashboardActivity.tsx`, `DashboardCalendar.tsx`, `DashboardGreeting.tsx`, `DashboardHero.tsx`, `DashboardJobs.tsx`, `DashboardMembers.tsx`, `DashboardNewsletter.tsx`, `DashboardPoll.tsx`, `DashboardStats.tsx`, `MetricTile.tsx`, `SectionCard.tsx` | widgets της αρχικής. Επόμενο: κανένα, όσο τα νούμερα έρχονται από τα entity reads. |
| `gamification` (10) | `BadgesWidget.tsx`, `NextActionBanner.tsx`, `OnboardingChecklist.test.tsx`, `OnboardingChecklist.tsx`, `ReputationSystem.tsx`, `UserBadges.tsx`, `VentureReadinessCard.tsx`, `WorkspaceMetricsPanels.tsx`, `WorkspaceScoringWidget.tsx`, `XPProgressWidget.tsx` | readiness, badges, reputation widgets. Επόμενο: κανένα οπτικό· οι προτάσεις διαστάσεων μένουν δίγλωσσες από το `c85ac010`. |
| `ai` (9) | `AIComposer.tsx`, `AIInsightButton.tsx`, `AIMatchExplainer.tsx`, `AIQuickAsk.tsx`, `ActionCard.test.tsx`, `ActionCard.tsx`, `CitationChip.tsx`, `CopilotEmptyState.tsx`, `CopilotWorkspace.tsx` | παράθυρο assistant. Επόμενο: κανένα chrome· το κύμα F είναι 100% στο γραμμένο σύνολο, όχι σε πραγματικούς χρήστες (§28.8). |
| `admin` (5) | `AbuseMonitorPanel.tsx`, `AdminAnalyticsDashboard.test.tsx`, `AdminAnalyticsDashboard.tsx`, `ExperimentationPanel.tsx`, `ScoreInspector.tsx` | ExperimentationPanel. Επόμενο: destructive πάντα μέσω confirm-dialog. |
| `feed` (5) | `CreatePost.test.tsx`, `CreatePost.tsx`, `FeedPostComposer.test.tsx`, `FeedPostComposer.tsx`, `PostCard.tsx` | composer + κάρτες. Επόμενο: κανένα API. Το `SampleDataNotice` μένει μέχρι προϊόντική απόφαση για Prisma. |
| `providers` (5) | `ApiHealthProbe.tsx`, `PostHogProvider.tsx`, `QueryProvider.test.tsx`, `QueryProvider.tsx`, `TenantContext.tsx` | κάρτες υπηρεσιών. Επόμενο: κανένα, όσο το marketplace δηλώνει δείγμα. |
| `auth` (4) | `AdminGuard.tsx`, `OAuthButtons.tsx`, `TwoFactorManagement.tsx`, `TwoFactorSetup.tsx` | 2FA dialog. Επόμενο: ο assistant δεν αγγίζει μυστικά· το modal μένει ανθρώπινο. |
| `messaging` (4) | `ChatWindow.tsx`, `ConversationList.tsx`, `ConversationValidation.tsx`, `ThreadAvatar.tsx` | ChatWindow, validation. Επόμενο: κανένα αυτόνομο DM (§10). |
| `video` (3) | `VideoCall.tsx`, `VideoCallDemo.tsx`, `VideoCallProvider.tsx` | VideoCall. Επόμενο: κανένα νέο transport. |
| `workspace` (3) | `FilterBar.tsx`, `PageHeader.tsx`, `StatsCard.tsx` | χώρος εργασίας. Επόμενο: ίδιο chrome με τις σελίδες Work. |
| `behavioral` (2) | `BehaviorAdminPanel.tsx`, `BehavioralNudge.tsx` | optimizer widgets. Επόμενο: κανένα, δεν αλλάζουμε το μοντέλο σε αυτόν τον κύκλο. |
| `canvas` (2) | `ResearchCanvas.test.tsx`, `ResearchCanvas.tsx` | ResearchCanvas, 31 native buttons. Επόμενο: ο φρουρός 390px του research. |
| `discover` (2) | `ProfileCard.tsx`, `SearchFilters.tsx` | ProfileCard, SearchFilters sheet. Επόμενο: το sheet στον φρουρό ονόματος. |
| `endorsements` (2) | `GiveEndorsementDialog.test.tsx`, `GiveEndorsementDialog.tsx` | GiveEndorsementDialog. Επόμενο: κανένα· το write είναι ήδη partial με reversal. |
| `icons` (2) | `CfbGlyph.test.tsx`, `CfbGlyph.tsx` | γλυφές. Επόμενο: κανένα· το `data-keep-icon` μένει η εξαίρεση. |
| `members` (2) | `EnhancedMemberDirectory.tsx`, `MembersPageClient.tsx` | directory. Επόμενο: κανένα εκτός αν το sweep 390 δείξει overflow σε κάρτα. |
| `mentoring` (2) | `BookingCalendar.tsx`, `SessionDialogs.tsx` | BookingCalendar, SessionDialogs. Επόμενο: τα session dialogs στον φρουρό ονόματος. Δεν ενώνουμε calendar με bookings. |
| `messages` (2) | `MessageComposer.tsx`, `MessageThread.tsx` | composer. Επόμενο: κανένα· το fullHeight και το bottom nav έκλεισαν στο §11. |
| `social` (2) | `InviteSystem.tsx`, `ShareButton.tsx` | InviteSystem. Επόμενο: η πρόσκληση μένει ανθρώπινη ενέργεια (ο λόγος του `/invite`). |
| `activity` (1) | `ActivityFeed.tsx` | γραμμή δραστηριότητας. Επόμενο: κανένα. |
| `analytics` (1) | `AdvancedAnalyticsDashboard.tsx` | γραφήματα με `--chart-*`. Επόμενο: κανένα hex έξω από το allowlist. |
| `billing` (1) | `FeatureGate.tsx` | σύνοψη πλάνου. Επόμενο: καμία πληρωμή από τον assistant. |
| `brand` (1) | `Logo.tsx` | λογότυπο. Επόμενο: κανένα· το «Bay» φορά το ακριβές accent (`53f8bdbe`). |
| `charts` (1) | `MatchCompatibilityChart.tsx` | κοινός chart wrapper. Επόμενο: tokens, όχι νέα παλέτα. |
| `chat` (1) | `UnifiedChatPopup.tsx` | UnifiedChatPopup, 15 native buttons. Επόμενο: ο φρουρός 44px. |
| `collaboration` (1) | `CollaborationStarter.tsx` | CollaborationStarter dialog. Επόμενο: φρουρός ονόματος. |
| `events` (1) | `EventCard.tsx` | EventCard. Επόμενο: κανένα. |
| `notifications` (1) | `NotificationCenter.tsx` | λίστα. Επόμενο: κανένα· ο reader υπάρχει. |
| `optimization` (1) | `VirtualList.tsx` | πάνελ optimizer. Επόμενο: κανένα σε αυτόν τον κύκλο. |
| `profile` (1) | `ProfileCompleteness.tsx` | ProfileCompleteness. Επόμενο: κανένα. |
| `recommendations` (1) | `SmartRecommendations.tsx` | SmartRecommendations. Επόμενο: δεν συγχωνεύεται με το `/matches` (§6). |
| `search` (1) | `AdvancedSearch.tsx` | γραμμή αναζήτησης. Επόμενο: το PhonePlaceholderFit μένει· δεν ξαναβάζουμε και τις δύο γλώσσες όταν δεν χωρούν. |
| `settings` (1) | `LinkedAccounts.tsx` | γραμμές ρυθμίσεων. Επόμενο: toggles μένουν ≥44px στο τηλέφωνο. |
| `shared` (1) | `ContributionGraph.tsx` | κοινό κομμάτι. Επόμενο: κανένα. |
| `theme` (1) | `ThemeSwitcher.tsx` | ThemeSwitcher. Επόμενο: κανένα· δεν αλλάζουμε primary hue (§10). |

### 30.6 Κάθε σελίδα

Στήλη **rail**: `ναι` αν το `page.tsx` ή το γνωστό παιδί (`FounderDashboardContent`, `BuilderWorkspace`, `PitchDeckBuilder`, `ApplicationGenerator`, `MembersPageClient`) περιέχει `PageRail`. Το §29.4 μέτρησε 0 σελίδες με 3+ οικογένειες controls χωρίς rail· όσες γράφουν `όχι` δεν είναι εκκρεμότητα rail.

Στήλη **επόμενο**: ένα βήμα. «Κανένα» σημαίνει ότι η σελίδα είτε ανακατευθύνει, είτε ο λόγος στο `ai-coverage-reasons.json` απαγορεύει ενέργεια, και το οπτικό πέρασμα του §29 την καλύπτει ήδη μέσω AppShell. Δεν ανοίγουμε Feed Prisma, calendar union, fundraising models, jobs-create, ή συγχώνευση matches/recommendations.

| route | rail | δείγμα | assistant | επόμενο |
|---|---|---|---|---|
| `/` | όχι | — | δεν ενεργεί | κανένα — public landing page, read before sign-in; the assistant is a signed-in feature |
| `/achievements` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/activity` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/admin` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/admin/analytics` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/audit-log` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/automations` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/billing` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/admin/communities` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/admin/community-management` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/content-moderation` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/dashboard` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/domains` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/feature-flags` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/mentorship-management` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/programs` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/admin/reports` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/admin/security-monitoring` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/sso` | όχι | — | δεν ενεργεί | κανένα — identity-provider configuration across tenants: security settings the assistant does not change |
| `/admin/system-settings` | όχι | — | δεν ενεργεί | κανένα — platform-wide settings, saved by a platform admin; the assistant does not change them |
| `/admin/taxonomy` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/tenants` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/admin/user-detail/[id]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/admin/user-management` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/admin/users` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/ai` | όχι | — | δεν ενεργεί | κανένα — the assistant itself: the workspace the conversation runs in |
| `/ai/capabilities` | όχι | — | δεν ενεργεί | κανένα — generated from the action declarations the assistant uses; reading it changes nothing |
| `/analytics` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/api-status` | όχι | — | δεν ενεργεί | κανένα — a public health readout of the API; nothing to operate |
| `/auth/oauth-callback` | όχι | — | δεν ενεργεί | κανένα — OAuth handshake; renders a spinner and redirects |
| `/auth/sso-complete` | όχι | — | δεν ενεργεί | κανένα — SSO handshake; renders a spinner and redirects |
| `/auth/verify-email` | όχι | — | δεν ενεργεί | κανένα — email verification from an emailed token |
| `/builder` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/builder/applications` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/builder/pitch-deck` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/calendar` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/coaching` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/compare` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/connections` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/dashboard` | όχι | — | δεν ενεργεί | κανένα — redirects to the signed-in role's dashboard |
| `/dashboard/founder` | ναι | — | δεν ενεργεί | κανένα — an overview that links to the pages that act; its figures come from the entity reads (milestones, messages, connections, events) |
| `/dashboard/incubator` | όχι | — | δεν ενεργεί | κανένα — an overview that links to /org/* and /tenant/*, where the controls live |
| `/dashboard/investor` | όχι | — | δεν ενεργεί | κανένα — an overview that links to the pipeline, watchlist and portfolio, where the deal commands live |
| `/dashboard/mentor` | όχι | — | δεν ενεργεί | κανένα — an overview that links to /mentor/*, where the mentee and session controls live |
| `/dashboard/provider` | όχι | — | δεν ενεργεί | κανένα — an overview that links to /provider/*, where the service and inquiry controls live |
| `/data-room/[id]` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/demo` | όχι | — | δεν ενεργεί | κανένα — hands off to the demo session and redirects to /dashboard/founder |
| `/discover` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/endorsements` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/events` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/events/[id]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/events/create` | όχι | — | δεν ενεργεί | κανένα — a form: create_event proposes it and the person confirms |
| `/expert-reviews` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/feed` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/forgot-password` | όχι | — | δεν ενεργεί | κανένα — password reset request, typed by the person |
| `/fundraising` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/groups` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/groups/[groupId]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/groups/manage` | όχι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/groups/moderation` | όχι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/help` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/investor/analytics` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/investor/dashboard` | όχι | — | δεν ενεργεί | κανένα — redirects to /dashboard/investor |
| `/investor/pipeline` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/investor/portfolio` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/investor/scouting` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/investor/watchlist` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/investors` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/invite` | όχι | — | δεν ενεργεί | κανένα — an invite form: the person names who to invite; the assistant does not send email on its own |
| `/jobs` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/learning` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/login` | όχι | — | δεν ενεργεί | κανένα — sign-in: the person types their own credentials; the assistant never fills a password |
| `/marketplace` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/matches` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/matches/[userId]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/matches/compare` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/members` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/mentor/availability` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/mentor/dashboard` | όχι | — | δεν ενεργεί | κανένα — redirects to /dashboard/mentor |
| `/mentor/earnings` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/mentor/mentees` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/mentor/profile` | όχι | — | δεν ενεργεί | κανένα — a form for the mentor listing, filled and saved by the person |
| `/mentor/requests` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/mentor/reviews` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/mentor/sessions` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/mentoring` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/messages` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/milestones` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/milestones/new` | όχι | — | δεν ενεργεί | κανένα — a form: create_milestone proposes it and the person confirms |
| `/notifications` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/onboarding` | όχι | — | δεν ενεργεί | κανένα — redirects to /profile |
| `/opportunities` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/org/[slug]` | όχι | — | δεν ενεργεί | κανένα — an organisation's public page, read without an account |
| `/org/[slug]/admin` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/org/analytics` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/applications` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/cohorts` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/cohorts/[id]` | όχι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/org/dashboard` | όχι | — | δεν ενεργεί | κανένα — redirects to /dashboard/incubator |
| `/org/events` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/members` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/mentors` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/programs` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/org/settings` | όχι | — | δεν ενεργεί | κανένα — organisation settings form, saved by an organisation admin |
| `/org/startups` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/p/[username]` | όχι | — | δεν ενεργεί | κανένα — a person's public page, read without an account |
| `/pitch/[id]` | όχι | — | δεν ενεργεί | κανένα — a shared pitch, read without an account |
| `/pricing` | όχι | — | δεν ενεργεί | κανένα — public marketing page, read before sign-in |
| `/privacy` | όχι | — | δεν ενεργεί | κανένα — legal text, read-only |
| `/profile` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/profile/edit` | όχι | — | δεν ενεργεί | κανένα — a form: update_profile proposes the fields and the person saves |
| `/profiles/[userId]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/programs` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/programs/[id]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/projects` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/projects/[projectId]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/projects/create` | όχι | — | δεν ενεργεί | κανένα — a form: draft_project fills its fields from the conversation and the person walks the steps and presses Create; no create-project write is declared |
| `/provider/analytics` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/provider/dashboard` | όχι | — | δεν ενεργεί | κανένα — redirects to /dashboard/provider |
| `/provider/inquiries` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/provider/profile` | όχι | — | δεν ενεργεί | κανένα — a form for the provider listing, filled and saved by the person |
| `/provider/projects` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/provider/reviews` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/provider/services` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/readiness` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/recommendations` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/referrals` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/register` | όχι | — | δεν ενεργεί | κανένα — sign-up: the person types their own credentials; the assistant never fills a password |
| `/reputation` | όχι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/research` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/research/[boardId]` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/research/canvas` | όχι | — | δεν ενεργεί | κανένα — redirects to /research |
| `/reset-password` | όχι | — | δεν ενεργεί | κανένα — password reset from an emailed token, typed by the person |
| `/saved-searches` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/search` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/settings` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/settings/ai` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/settings/billing` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/settings/data-export` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/settings/notifications` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/share/[token]` | όχι | — | δεν ενεργεί | κανένα — a shared research board, read-only by its link |
| `/shortlist` | ναι | — | χειρίσιμο, ο rail είναι η επιφάνεια | ένταξη στο sweep 390px (το §29.8 το μέτρησε δειγματοληπτικά, όχι και στα 160) |
| `/startups/[id]` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/t/[slug]` | όχι | — | δεν ενεργεί | κανένα — a tenant's public page, read without an account |
| `/tenant/analytics` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/tenant/api-keys` | όχι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/tenant/automation` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/tenant/billing` | όχι | — | δεν ενεργεί | κανένα — billing: seats, the payment portal and the billing contact stay with the person; the assistant does not act on payment |
| `/tenant/branding` | όχι | — | δεν ενεργεί | κανένα — tenant branding form (colours, logo), saved by a tenant admin |
| `/tenant/dashboard` | όχι | — | δεν ενεργεί | κανένα — an overview that links to the /tenant/* pages that act |
| `/tenant/domains` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/tenant/members` | όχι | — | ό,τι δηλώνει το action registry για τη διαδρομή | κανένα οπτικό· rail μόνο αν μελλοντική μέτρηση δείξει ≥3 οικογένειες controls |
| `/tenant/programs` | ναι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/tenant/settings` | όχι | — | δεν ενεργεί | κανένα — tenant settings form, saved by a tenant admin |
| `/tenant/sso` | όχι | — | δεν ενεργεί | κανένα — identity-provider configuration: security settings the assistant does not change |
| `/tenant/webhooks` | όχι | ναι | διαβάζει όπου υπάρχει δήλωση· δεν επινοεί το δείγμα ως αλήθεια | μένει το SampleDataNotice· καμία νέα ενέργεια μέχρι να υπάρξει πηγή αλήθειας στο backend |
| `/terms` | όχι | — | δεν ενεργεί | κανένα — legal text, read-only |
| `/test-onboarding` | όχι | — | δεν ενεργεί | κανένα — a development harness for the onboarding flow, not a product page |
| `/themes/alliance` | όχι | — | δεν ενεργεί | κανένα — a theme showcase, not a product page |
| `/unauthorized` | όχι | — | δεν ενεργεί | κανένα — an access-denied notice with a link back |

### 30.7 Σειρά υλοποίησης του επόμενου κύκλου

| σειρά | δουλειά | αποδοχή | ρητά εκτός |
|---|---|---|---|
| 1 | φρουρός: σε 390px κανένα `button` / `[role=button]` / tab κάτω από 44px, εκτός link και κειμένου παραγράφου, και στα 160 routes | το sweep αποτυγχάνει στο πρώτο | δεν αλλάζει το CSS από `sm` και πάνω |
| 2 | φρουρός: κάθε ανοιχτό `dialog` σε demo έχει accessible name | ένα αποτυχημένο όνομα σταματά τη σουίτα | δεν γράφονται νέοι τίτλοι αν το τεστ είναι πράσινο |
| 3 | `space-y-6` στο πρώτο stack σελίδας γίνεται lint, όχι σύμβαση πλειοψηφίας (§29.8) | νέα σελίδα με `space-y-4` στο root αποτυγχάνει | τα tabs κρατούν `space-y-4` |
| 4 | τα 50 routes του `ai-coverage-reasons.json` μένουν όπως είναι | το `aiCoverage.test.ts` συνεχίζει να αποτυγχάνει αν λείπει ή περισσεύει λόγος | δεν προστίθενται writes σε login, billing, SSO, νομικά, redirects |

### 30.8 Τι δεν ισχυρίζεται αυτό το τμήμα

Δεν ξαναέτρεξε typecheck, vitest, contrast ή το sweep των 142 routes· αυτά είναι τα νούμερα του §29.7 στο ίδιο tip `3c2b32ca`, όχι νέα μέτρηση αυτής της ώρας. Η απογραφή 160 / 261 / 1324 / 571 / 54 έγινε με ανάγνωση του δέντρου στο `3c2b32ca`. Το live preview επιβεβαιώνει ότι το `/demo` ανοίγει το `/dashboard/founder`· δεν είναι οπτική πιστοποίηση των 160 σελίδων.

Δύο γραμμές του §6 δεν ισχύουν πια σε αυτό το tip και δεν μεταφέρθηκαν ως εκκρεμότητες: το `/startups/[id]` είναι σελίδα συμφωνίας επενδυτή (`getInvestorDeal`, στάδια pipeline), όχι 404. Το `/jobs` καλεί `createJobPosting` από dialog στη ίδια σελίδα· δεν λείπει route δημιουργίας. Το `/fundraising` δεν εισάγει `SampleDataNotice`, αλλά με `showDemoData` δείχνει γύρο και έγγραφα δείγματος — η ειλικρίνεια μένει στη σημαία `sample`, όχι σε νέο μοντέλο.

## 31. Καθαρότητα με διατήρηση χρησιμότητας — σχέδιο και πρώτο κύμα 2026-10-03

### 31.1 Πεδίο, τεκμήρια και όρια

Αποκλειστικό repository: `C:/Users/anast/IdeaProjects/CoFounderBay`. Βάση εφαρμογής το `claude/project-audit-upgrade-y2ebnr`, με το Cursor audit `daae0191` ενσωματωμένο μέσω merge `56400484`. Τα υπόλοιπα remote branches είναι πρόγονοι της βάσης. Το τοπικό Cascade snapshot `150c70af` είναι patch-equivalent με ήδη ενσωματωμένη δουλειά (`git cherry` το σημειώνει `-`), επομένως δεν εφαρμόζεται δεύτερη φορά. Τα δύο καταγεγραμμένα Cascade worktrees ήταν καθαρά κατά τον έλεγχο.

Η νέα στατική απογραφή μετρά 160 routes, 533 endpoints και 51 rails. Δεν αποδεικνύει σωστή εξουσιοδότηση, πραγματική αποθήκευση ή ότι κάθε modal έχει ανοιχτεί. Οι χαρακτηρισμοί «κανένα οπτικό» του §30 είναι προηγούμενες εκτιμήσεις, όχι λόγος αποκλεισμού μιας σελίδας από νέο έλεγχο.

Στόχος: να μειώνεται η προσπάθεια εύρεσης, κατανόησης και ολοκλήρωσης μιας εργασίας. Το μικρότερο πλήθος ορατών controls δεν είναι αυτοσκοπός. Αχνά controls, κρυμμένες κύριες ενέργειες και υπερβολικά μεγάλα κενά μπορούν να αυξήσουν την προσπάθεια.

### 31.2 Νέα επαληθευμένα ευρήματα

| Εύρημα | Τεκμήριο | Κατάσταση πρώτου κύματος |
|---|---|---|
| Το keyboard focus στα «Filters» άνοιγε τα «Project stats» | browser στο `/projects` και αποτυχημένο regression test | διορθώθηκε η επιλογή της εστιασμένης ενότητας στο κοινό PageRail |
| Οι 12 απαντήσεις YC δεν είχαν συνδεδεμένα labels | DOM: `labels.length = 0`, χωρίς ids και περιγραφές | όλα έχουν label, required state, hint/counter association και invalid state για υπέρβαση ορίου |
| Φόρμα απαντήσεων υπερβολικά πλατιά | πεδία 1.098px στα 1440px viewport | περιορισμός της στήλης: περίπου 790px πεδία στο ίδιο viewport, χωρίς αφαίρεση ερωτήσεων |
| AI save ανακοίνωνε επιτυχία πριν ολοκληρωθεί η αποθήκευση | regression με ελεγχόμενο pending/rejected promise | await πραγματικού handler, μετάδοση αποτυχίας, απαγόρευση διπλής αποθήκευσης |
| AI draft αντικαθιστούσε χειροκίνητη απάντηση γραμμένη κατά την αναμονή | αποτυχημένο race regression | συγχώνευση μόνο στα ακόμη κενά πεδία της τρέχουσας κατάστασης |
| Αποτυχία «Marked submitted» άφηνε την οθόνη submitted | rejected save regression | η κατάσταση αλλάζει μετά την επιτυχία |
| Prompts/περιγραφές καθολικής χρήσης περιείχαν δεδομένα Harbor | ανάγνωση ApplicationGenerator, applications page και page registry | αφαιρέθηκαν οι συγκεκριμένες μη επαληθευμένες παραδοχές, χωρίς αλλαγή των νόμιμων demo fixtures |
| Radar σε ολόκληρη σειρά κάτω από τη σύνοψη | screenshot και DOM στο `/readiness` | σύνοψη και radar δίπλα όταν χωρούν, φυσική αναδίπλωση όταν δεν χωρούν |

Το ευρετήριο ερωτήσεων βρίσκεται στην επικεφαλίδα της φόρμας, επειδή αποτελεί βασική πλοήγηση της εργασίας. Το ίδιο focus προσφέρεται στο AI ως read-only page control. Δεν μεταφέρει ούτε αποθηκεύει απαντήσεις.

### 31.3 Χρώμα: ήρεμη επιφάνεια, σαφής λειτουργική πληροφορία

Μετρήσεις browser στα τέσσερα φωτεινά themes, πάνω στις τελικές CSS τιμές. Οι αριθμοί παρακάτω είναι προσεγγιστικοί, όχι στρογγυλοποιημένα όρια επιτυχίας WCAG:

| Θέμα | Primary | Primary πάνω στη σελίδα | Label πάνω στο primary | Status marks πάνω σε card |
|---|---|---:|---:|---:|
| Lilac | `250 74% 82.6%` | 1,80:1 | 9,60:1 | 2,10–2,11:1 |
| Cyan | `212 71.4% 72.5%` | 1,96:1 | 8,39:1 | 2,10–2,11:1 |
| Mint | `158 72% 55%` | 1,49:1 | 11,19:1 | 1,93–1,94:1 |
| Apricot | `28 76% 67.5%` | 1,85:1 | 8,85:1 | 2,06–2,08:1 |

Αυτή η μέτρηση δεν σημαίνει ότι όλα τα pastel fills είναι λανθασμένα. Ένα κουμπί με σαφή σκούρα ετικέτα μπορεί να αναγνωρίζεται από την ετικέτα. Αντίθετα, ένα μοναδικό icon-only control ή πληροφοριακό τμήμα γραφήματος δεν γίνεται «διακοσμητικό» επειδή χρησιμοποιεί mark token. Χρειάζεται αξιολόγηση του 3:1 για την απαραίτητη οπτική πληροφορία. Το λογότυπο είναι διαφορετική περίπτωση από ένα λειτουργικό κουμπί.

Προτεινόμενη σύμβαση, όχι νέα οριζόντια αλλαγή χρωμάτων σε αυτό το κύμα:

1. **Επιφάνειες:** ήπιο page, card και inset. Το inset δηλώνει περιοχή εργασίας, όχι νέο χρωματικό θέμα.
2. **Κύρια ενέργεια:** διατήρηση των επιλεγμένων accents. Σκούρο, ελεγμένο label πάνω στο fill. Αποφυγή πολλών ισοδύναμων γεμάτων CTA στην ίδια ομάδα.
3. **Κείμενο/σύνδεσμοι:** χρήση accessible text τόνων, όχι του pastel fill ως μικρού κειμένου. Κανονικό κείμενο τουλάχιστον 4,5:1· έλεγχος και σε hover/selected surfaces.
4. **Λειτουργικά εικονίδια/καταστάσεις:** ίδιο χρωματικό οικογενειακό ύφος, αλλά ξεχωριστή ένταση ή πρόσθετο σαφές περίγραμμα/label όταν χρειάζεται 3:1. Όχι αυτόματη αντικατάσταση όλων των icons με primary.
5. **Status:** pastel background, ευανάγνωστη κατάσταση με λέξη και, όπου χρειάζεται, σχήμα. Το κόκκινο σημαίνει σφάλμα/κίνδυνο, όχι διακόσμηση.
6. **Γραφήματα:** απαλή γέμιση με ευδιάκριτη γραμμή/marker, labels και εναλλακτική ανάγνωση δεδομένων. Οι κατηγορίες δεν διαφέρουν μόνο ως προς το hue. Διατήρηση νοήματος της ίδιας σειράς μεταξύ themes.
7. **Σύγκριση themes:** αξιολόγηση αντιληπτικής φωτεινότητας/chroma, όχι ίδια αριθμητική μείωση HSL σε όλα τα hues. OKLCH μπορεί να χρησιμοποιηθεί ως εργαλείο σύγκρισης, χωρίς υποχρεωτική αλλαγή της CSS αρχιτεκτονικής.
8. **Σκοτεινά θέματα:** ξεχωριστή επαλήθευση. Αλλαγές root chart tokens μπορούν να κληρονομηθούν και σε dark· δεν αρκεί ότι το edit γράφτηκε σε «light» block.

### 31.4 Τυπογραφία, γεωμετρία και πυκνότητα

Στο πραγματικό `/readiness` στα 1440px μετρήθηκαν τίτλος 17,82px, section 16,49px, περιγραφή 14,14px, helpers 13,13px και ορισμένα επεξηγηματικά κείμενα 12,24px. Υπάρχουν μεταγενέστερα overrides στο globals.css, συνεπώς τα αρχικά token comments δεν είναι μέτρηση της τελικής οθόνης.

- Βασική πληροφορία/κείμενο εργασίας: στόχος preview 14–16px ή μεγαλύτερο όπου η ανάγνωση είναι παρατεταμένη. Τα 12,24px διατηρούνται για σύντομα metadata, όχι ως υποκατάστατο σώματος.
- Η ιεραρχία σχηματίζεται με μέγεθος, βάρος, θέση και κενό μαζί. Δεν χρειάζονται παντού bold τίτλοι ή χρωματιστά εικονίδια.
- Αρχικό εύρος δοκιμής για εκτενές κείμενο: περίπου 60–80 χαρακτήρες ανά γραμμή, με line-height περίπου 1,45–1,6. Δεν επιβάλλεται σε πίνακες, canvas ή μικρά labels.
- EN/EL και η προτίμηση γλώσσας παραμένουν. Τα ελληνικά δοκιμάζονται με μεγάλες λέξεις, τόνους και πραγματικό wrapping. Δεν μικραίνει η γραμματοσειρά για να χωρέσει η μετάφραση.
- Διατήρηση της κλίμακας radius 6/10/12/14/18px. Pills για πραγματικά chips/avatars, όχι κάθε container.
- Κενά ανά σχέση: μικρά μέσα σε ενιαίο control, μεσαία μεταξύ πεδίων, μεγαλύτερα μεταξύ ενοτήτων. Τα 16/24/32 είναι δοκιμαστικά βήματα του υπάρχοντος συστήματος, όχι λόγος να γεμίσουμε μια κενή οθόνη.
- Flat επιφάνειες στο περιεχόμενο· σκιά μόνο όπου εξηγεί ότι κάτι επιπλέει. Hover χωρίς μετατόπιση του περιεχομένου.
- Στόχος προϊόντος για touch: άνετα hit areas περίπου 44×44px. WCAG 2.2 AA 2.5.8 έχει διαφορετικό ελάχιστο 24×24px με εξαιρέσεις/κανόνες απόστασης· δεν παρουσιάζουμε τα 44px ως το όριο AA.
- Το ενεργό/disabled/loading state δεν δηλώνεται μόνο με μικρή αλλαγή opacity. Διατηρούνται ετικέτα, cursor, focus και πραγματική κατάσταση εκτέλεσης.
- Δεν αλλάζει οριζόντια το desktop root 82%. Ενδεχόμενη ενοποίηση των επικαλυπτόμενων type overrides απαιτεί computed-style baseline και screenshots πριν/μετά.

### 31.5 Κύρια στήλη και δεξί rail

Κάθε control καταγράφεται ως κύρια εργασία, συχνό υποστηρικτικό, σπάνιο/advanced ή contextual. Η ταξινόμηση βασίζεται στη χρήση και στη σημασία του, όχι μόνο στο πόσα controls μέτρησε ένα script.

**Κύρια στήλη:** τίτλος, σαφής σκοπός, τρέχον αντικείμενο/κατάσταση, ενέργεια επόμενου βήματος και το περιεχόμενο που επεξεργάζεται ο χρήστης. Η αναζήτηση μιας λίστας και η επιλογή του εγγράφου μπορεί να είναι κύριες λειτουργίες, όχι αυτόματα «βοηθητικές».

**Rail:** προηγμένα φίλτρα, δευτερεύουσες μετρήσεις, εξαγωγές, ιστορικό, σχετικοί πόροι και εξηγήσεις. Μεταφορά, όχι αντιγραφή. Η απόφαση για 51 υπάρχοντα rails επανεξετάζεται σε πραγματικά σενάρια· δεν θέτουμε στόχο να αυξηθεί τεχνητά το πλήθος τους.

**Συμπεριφορά:** hover intent χωρίς reflow, κλικ για pin, Escape για προσωρινό κλείσιμο, συνεπής keyboard διαδρομή, ονομασμένα sections, επιστροφή focus και ασφαλή portaled menus. Όχι hover-only πρόσβαση. Σε tablet/phone χρησιμοποιείται το ίδιο περιεχόμενο σε sheet. Έλεγχος και με τα δύο sidebars ανοιχτά, όχι μόνο σε ολόκληρο viewport.

Εάν ένα control γίνεται δυσκολότερο να βρεθεί μετά τη μεταφορά, η μεταφορά απορρίπτεται ή προστίθεται σαφής contextual πρόσβαση που ανοίγει το ίδιο control, όχι δεύτερη υλοποίηση.

### 31.6 Σχέδιο ανά οικογένεια σελίδων

Οι 160 διαδρομές του §30.6 παραμένουν ο κατάλογος κάλυψης. Ο παρακάτω πίνακας ορίζει εργασία για κάθε οικογένεια, όχι δήλωση ότι όλες ελέγχθηκαν οπτικά.

| Οικογένεια | Κύριο περιεχόμενο | Βοηθητικό περιεχόμενο | Κρίσιμη δοκιμή |
|---|---|---|---|
| Founder/mentor/investor/provider/org/tenant dashboards | τι χρειάζεται προσοχή και επόμενο χρήσιμο βήμα | ανάλυση KPIs, ιστορικό, δευτερεύουσες λίστες | κάθε αριθμός έχει προέλευση και οδηγεί στην αντίστοιχη εργασία |
| Readiness | σύνοψη, κενά, επεξεργάσιμα κριτήρια | ιστορικό, στάθμιση, συμβουλές | διαχωρισμός πραγματικού/demo score, αλλαγή κριτηρίου και συγχρονισμός |
| Analytics όλων των ρόλων | τάση, σύγκριση, ερμηνεία | περίοδος, export, ορισμοί | μετρήσεις ≠ αιτιώδεις ισχυρισμοί· διακριτά no-data/zero/error |
| Builder / pitch deck / applications | ενεργό έγγραφο και editor, πρόοδος, save | εκδόσεις, συνεργασία, πηγές, αξιολόγηση | διατήρηση draft, χειροκίνητων αλλαγών και σωστή αποθήκευση/επαναφορά |
| Research / canvas | πίνακες ή καμβάς και τρέχον αντικείμενο | inspector, insert, history, layers | εργαλεία διαθέσιμα σε touch/keyboard χωρίς απόκρυψη καμβά |
| Milestones / projects / jobs | εργασία, υπεύθυνος, κατάσταση, επόμενο βήμα | φίλτρα, ομαδοποίηση, ιστορικό | αναζήτηση/φίλτρα δεν χάνονται, όλες οι row commands διατηρούνται |
| Fundraising / deals / data room | γύρος, pipeline, επαφή ή έγγραφο | diligence, exports, πρόσβαση, συναφές pitch | ποσά/δεσμεύσεις έχουν αληθινή πηγή, αλλαγές κατάστασης συγχρονίζονται |
| Discover / matches / recommendations / shortlist / compare | αποτελέσματα και λόγοι συνάφειας | αναλυτικά φίλτρα, μεθοδολογία | τα διαφορετικά προϊόντα εύρεσης δεν συγχωνεύονται αυθαίρετα |
| Messages / connections / invitations | συνομιλία ή αίτημα | προφίλ, συμφραζόμενα, moderation | composer πάντα προσβάσιμος, draft AI όχι αυτόματη αποστολή |
| Calendar / events / mentoring / coaching | συγκεκριμένος χρόνος/συνεδρία και κράτηση | φίλτρα, λεπτομέρειες, διαθεσιμότητα | timezone, κενή ημέρα, ακύρωση και πραγματική αποθήκευση |
| Feed / communities / learning / marketplace | περιεχόμενο ή υπηρεσία | οργάνωση, moderation, υποστηρικτικές πληροφορίες | σαφής διάκριση πραγματικού και ενδεικτικού περιεχομένου |
| Profile / settings / billing / identity | συγκεκριμένη ενότητα ρύθμισης | εξηγήσεις, ιστορικό, ασφάλεια | saved/unsaved/error σαφή· ευαίσθητα controls με ανθρώπινη επιβεβαίωση |
| Admin / tenant / organisation operations | ουρά εργασίας ή συγκεκριμένη οντότητα | μαζικές επιλογές, φίλτρα, exports | permissions ανά ρόλο/tenant, ασφαλείς destructive ροές |
| Public / auth / legal / share / error / redirects | ένας σαφής σκοπός | μόνο ό,τι εξυπηρετεί αυτόν τον σκοπό | χωρίς τεχνητό rail/AI, καθαρή εξήγηση περιορισμών και ανάκαμψη |

### 31.7 Components και καταστάσεις — ενιαίος έλεγχος

Για κάθε κοινό component και κάθε διακριτή χρήση του: default, hover, focus, selected, disabled, loading, empty, partial, error, success, long EN/EL text. Τα modals ελέγχονται ανοιχτά: όνομα, περιγραφή όπου χρειάζεται, focus trap/return, Escape, scroll, keyboard, μικρή οθόνη και σαφής διάκριση αποθήκευσης από ακύρωση.

Οι επαναλαμβανόμενες κάρτες/γραμμές κρατούν κοινή θέση τίτλου, metadata και ενεργειών. Δεν υποχρεώνεται κάθε row να γίνει μεγάλη card. Ένα chart χρειάζεται ανάγνωση δεδομένων, όχι απλώς ευχάριστη παλέτα. Ένα empty state εξηγεί αν δεν υπάρχουν στοιχεία ή αν τα έκρυψε φίλτρο, και δίνει σχετική έξοδο χωρίς δεύτερο φίλτρο.

### 31.8 AI και δεδομένα ως μέρος της καθαρότητας

Η αλυσίδα παραμένει: κατανόηση ενεργού workspace → ανάγνωση έγκυρων στοιχείων → πρόταση → έγκριση → εκτέλεση με δικαιώματα → συγχρονισμός → επαλήθευση αποτελέσματος.

- Το ορατό control και το AI χρησιμοποιούν τον ίδιο handler, με την ίδια σημασιολογία και διαθεσιμότητα.
- Read-only πλοήγηση, draft και αποθηκευμένη μεταβολή παραμένουν διακριτά.
- Pending promise δεν είναι επιτυχής ενέργεια. Toast επιτυχίας δεν είναι απόδειξη backend persistence.
- Drafts συνοδεύονται από πηγές και κενά πληροφορίας· prompts δεν προσθέτουν demo ποσά/ονόματα σε πραγματικό workspace.
- Οι μεταβολές ενημερώνουν τα σωστά query roots και όποια σελίδα διαβάζει την ίδια οντότητα. Έλεγχος και με δεύτερο tab/χρήστη όπου υπάρχει realtime.
- Undo εμφανίζεται μόνο για επαληθευμένη αντίστροφη πράξη. Οι server guards παραμένουν αρμόδιοι για εξουσιοδότηση.
- Η συνέχεια draft μετά από restore/version change και η αντιμετώπιση concurrent edits χρειάζονται ξεχωριστά σενάρια· ένα επιτυχές mock δεν πιστοποιεί τη βάση δεδομένων.

### 31.9 Κύματα και κριτήρια ολοκλήρωσης

1. **Ακεραιότητα και εύρεση controls:** κλείσιμο του πρώτου κύματος, tests/regressions και merge συμβατής δουλειάς. Διατήρηση όλων των templates, ερωτήσεων, routes και handlers.
2. **Οπτικό θεμέλιο:** απογραφή computed styles και λειτουργικών χρωμάτων, δείγματα τεσσάρων φωτεινών themes σε πραγματικές σελίδες, έγκριση οπτικής κατεύθυνσης πριν από καθολική διάδοση. Όχι νέα αυθαίρετη αλυσίδα HSL nudges.
3. **Κοινό chrome και components:** rail, headers, buttons, fields, rows, cards, tabs, empty/loading/error states. Τεκμηριωμένες εξαιρέσεις αντί για global selectors που κρύβουν αδιακρίτως στοιχεία.
4. **Work flow ιδρυτή:** dashboard → readiness → builder/research → milestones/projects → fundraising/applications. Κάθε σύνδεσμος έχει σαφές αντικείμενο και η πληροφορία δεν επανεισάγεται χωρίς λόγο.
5. **Εύρεση και επικοινωνία:** discover/matches → profile → connection → messages → session/calendar, με διατήρηση συμφραζομένων και drafts.
6. **Υπόλοιποι ρόλοι και administration:** ίδιες συμβάσεις, όχι ίδια πληροφοριακή πυκνότητα ή ίδια δικαιώματα.
7. **Πλήρης πιστοποίηση και user validation:** static/dynamic routes, modals, πραγματικές εγγραφές σε κατάλληλο δοκιμαστικό περιβάλλον, συγκριτικές δοκιμές χρήσης και διορθώσεις.

Κάθε κύμα κλείνει μόνο με diff review, σχετικά tests, typecheck, browser έλεγχο και κατάλογο ανοικτών σημείων. Τα screenshots τεκμηριώνουν συγκεκριμένη κατάσταση, όχι όλες τις καταστάσεις της σελίδας.

### 31.10 Πρωτόκολλο αξιολόγησης

- Viewports: 390, 834, 1440 και 1920 CSS px· συμπληρωματικά reflow στα 320 CSS px και zoom/μεγέθυνση κειμένου. Rails κλειστά, peek και pinned. Mouse, keyboard και touch.
- Themes: και τα τέσσερα φωτεινά. Dark regression ακόμη και σε light-only αλλαγές λόγω κληρονομικότητας tokens.
- Περιεχόμενο: EN/EL, κενό/λίγο/πολύ περιεχόμενο, μακριά ονόματα, μεγάλες λίστες, μερικά API payloads, latency, rejected writes και διαφορετικά permissions.
- Διατήρηση λειτουργιών: πίνακας πριν/μετά με control, θέση, handler, endpoint, δικαίωμα, AI πρόσβαση και επιβεβαίωση. Δεν μετριέται μόνο αν υπάρχει κουμπί στο JSX.
- Προσβασιμότητα: κείμενο 4,5:1 όπου απαιτείται, απαραίτητη non-text πληροφορία 3:1, ονόματα/labels, ορατό focus, χωρίς ανεπιθύμητο οριζόντιο overflow. Τα axe `incomplete` παραμένουν ανοιχτός έλεγχος.
- Χρηστικότητα: ίδιες αντιπροσωπευτικές εργασίες πριν/μετά· χρόνος εύρεσης κύριας ενέργειας, ολοκλήρωση, λάθος επιλογές, επιστροφές, ανάγκη βοήθειας και υποκειμενική προσπάθεια. Αλλαγή που κρύβει λειτουργία και αυξάνει αυτά τα μεγέθη δεν είναι επιτυχής μινιμαλισμός.
- Δεν υπάρχει τεκμηριωμένο «ποσοστό μείωσης κόπωσης» χωρίς δοκιμή με πραγματικούς χρήστες. Μετρήσεις WCAG, κώδικα και DOM είναι τεχνικά τεκμήρια, όχι απόδειξη αισθητικής προτίμησης ή γνωστικής άνεσης.

Πηγές κριτηρίων: WCAG 2.2, Understanding 1.4.11 Non-text Contrast (`https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html`) και 2.5.8 Target Size Minimum (`https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`). Τα αριθμητικά εύρη τυπογραφίας/spacing εδώ είναι προτεινόμενοι στόχοι δοκιμής, όχι απαιτήσεις WCAG.

### 31.11 Αποτελέσματα ελέγχων πρώτου κύματος και ανοικτά σημεία

- Frontend Vitest: 97 αρχεία, 774 tests επιτυχή (772 του πρώτου κύματος + 2 του φρουρού showcase). Παραμένουν προϋπάρχουσες προειδοποιήσεις Radix για περιγραφή σε CreatePost dialog· δεν βαφτίζονται επιτυχής έλεγχος όλων των modals.
- Frontend typecheck: επιτυχής με `--noEmit --incremental false`, μετά από build του shared package. Δεν έγινε production build πάνω στον dev server.
- Στοχευμένα Playwright: 6 επιτυχή, 2 αναμενόμενα skipped λόγω διαφορετικής desktop/mobile διαδρομής. Έλεγχος ετικετών, πλοήγησης χωρίς απώλεια draft, radar/overflow, keyboard rail και ονομασμένου mobile sheet.
- Screenshots/readback στα 1440 και 390px για readiness/applications: χωρίς overflow στις συγκεκριμένες καταστάσεις. Οι 12 απαντήσεις έχουν πλέον συνδεδεμένες ετικέτες.
- Theme script: 0 αποτυχίες στα ζεύγη που ελέγχει. Δεν καλύπτει όλα τα πληροφοριακά γραφικά/εικονίδια.
- Axe στο κύριο περιεχόμενο applications/readiness, Cyan desktop: 0 δηλωμένες violations, αλλά 42/69 αντίστοιχα nodes με `color-contrast` incomplete. Απαιτείται χειροκίνητη/στοχευμένη αξιολόγηση· δεν είναι πλήρης πιστοποίηση αντίθεσης.
- Νέο sweep σε τρία ανεξάρτητα browser contexts, 143 στατικές διαδρομές (η υπάρχουσα λίστα 142 και `/unauthorized`): όλα HTTP 200, χωρίς ανιχνευμένο overflow, ανώνυμα controls ή κενά icons. Το αρχικό πέρασμα κατέγραψε hydration mismatch στο `/fundraising` και ένα πιθανό dead band στο `/admin/analytics`.
- Στοχευμένος επανέλεγχος `/admin/analytics` μετά τη φόρτωση δεν βρήκε dead band. Τα `/investor/dashboard`, `/org/dashboard`, `/provider/dashboard` επαληθεύτηκαν στον τελικό προορισμό τους, επειδή το sweep είχε προλάβει τη μετάβαση και επέστρεψε κενό ή μη διαθέσιμο δείγμα.
- ~~**Ανοικτό dev-output mismatch** στο `/fundraising`~~ — **λύθηκε, ήταν μπαγιάτικα chunks του dev runtime, όχι σφάλμα κώδικα.** Το literal «Track Harbor…» δεν υπήρχε πουθενά στο `src` (grep: 0). Το `touch` των αρχείων δεν προκάλεσε νέα μεταγλώττιση σε έξι δοκιμές· έγινε τερματισμός του δέντρου `scripts/dev.js`, διαγραφή `.next` (556 MB) και επανεκκίνηση. Μετά: η απόκριση HTTP περιέχει «Track your funding round», ο browser αποδίδει την ίδια περιγραφή και δεν καταγράφεται κανένα μήνυμα hydration. Ο server έμεινε σε λειτουργία.
- **Ίδια κατηγορία με το «Harbor» στις καθολικές περιγραφές, εκτός του πρώτου κύματος.** Ο νέος φρουρός `showcaseLeakGuard.test.ts` διαβάζει τα αρχεία που βλέπει κάθε χρήστης (`page-registry`, `strings-pages`, `nav-descriptions`, `PageContextualHelp`) και απέτυχε σε 9 σημεία: βοήθεια `/builder/applications`, `/fundraising` («This is Harbor's $750K seed»), `/projects`, `/ai`, και η υπόδειξη πλοήγησης του `/ai`. Το `CopilotWorkspace` έγραφε «Harbor copilot» σε κάθε χρήστη με offline μοντέλο. **Λειτουργικό σφάλμα, όχι μόνο κείμενο:** στο `/fundraising` το brief του assistant ανά επαφή έλεγε «…on Harbor's $750K seed (Athens Tech Angels, $375K committed)» και για επαφές που πρόσθεσε ο ίδιος ο ιδρυτής εκτός demo· τώρα δεσμεύεται στο `harborLive`, όπως ήδη το `askAi` της σελίδας. Τα παραδείγματα διατύπωσης στο `/ai/capabilities` («Save Elena…») μένουν και δηλώνονται ως παραδείγματα.
- Δεν έχουν πιστοποιηθεί όλες οι δυναμικές σελίδες, όλοι οι συνδυασμοί ρόλων, όλα τα modals, πραγματικές εγγραφές στη βάση ή ολόκληρο mobile sweep. Αυτά παραμένουν στο πρόγραμμα των επόμενων κυμάτων, όχι σιωπηρές εξαιρέσεις.

## 32. Κύμα 2 — οπτικό θεμέλιο: μέτρηση πρώτα, τέσσερα commits (2026-10-03)

Συνέχεια του §31.9. Το κύμα 1 έκλεισε στο `70648a56` (με το ανοιχτό σημείο του §31.11 λυμένο: μπαγιάτικα chunks του dev runtime, όχι κώδικας). Το κύμα 2 ξεκίνησε με την απογραφή που ζητά το §31.9, μετρημένη στον browser και στα τέσσερα φωτεινά θέματα, όχι από tokens.

### 32.1 Απογραφή — τι βρέθηκε και τι όχι

| διάσταση | μέτρηση (4 θέματα × 4 σελίδες, 1440px) | απόφαση |
|---|---|---|
| χρώμα | **0** γραφικά που φέρουν πληροφορία κάτω από 3:1 χωρίς λέξεις δίπλα τους. Κάθε παστέλ mark κάτω από 3:1 κάθεται δίπλα στον αριθμό του → συμπληρωματικό (WCAG 1.4.11) | η παστέλ κατεύθυνση στέκει· **καμία αλλαγή χρώματος** |
| σχήμα | ακτίνες σε χρήση 10/12/14 | όλες στην κλίμακα 6/10/12/14/18 |
| μέγεθος | κείμενο ανάγνωσης κάτω από 14px σε κάθε σελίδα· σχεδόν όλο είναι η ίδια πρόταση δύο φορές | δύο ενέργειες, §32.2 και §32.4 |

### 32.2 Πόσες γλώσσες στην οθόνη (`a8adcb85`)

Η προτίμηση `cfb:language-display` («μόνο κύρια γλώσσα») υπήρχε, αλλά μόνο σε στοιχείο μενού. Μπήκε στις Ρυθμίσεις → Γλώσσα («Πόσες γλώσσες στην οθόνη»), με το κόστος κάθε επιλογής, και ως `language_display` για τον assistant. Στο `/readiness` κόβει την κύρια στήλη από 5.274 σε 2.932 χαρακτήρες (−44%). Εμφανίζεται μόνο για αγγλικά/ελληνικά. Τα chips γλώσσας πήραν `aria-pressed` (η επιλογή δηλωνόταν μόνο με χρώμα, WCAG 1.4.1).

**Hydration:** η μέτρηση έβγαλε αποτυχία hydration στο `/settings` που προϋπήρχε (επιβεβαιώθηκε με stash). Το `DomI18n` μετέφραζε HTML του server πριν το React το διεκδικήσει (σελίδες που αναστέλλονται κάνουν hydration μετά το layout). Δύο κανόνες: (α) στα ελληνικά, `BilingualText` με δικό του ελληνικό (`data-bilingual-pair`) μένει ανέγγιχτο· (β) σε κάθε γλώσσα, κείμενο και attributes χωρίς `__reactFiber$` όσο τρέχει το React μένουν ανέγγιχτα, και τρία επόμενα περάσματα πιάνουν τις αργές σελίδες. 7 σελίδες × 6 ρυθμίσεις (el δίγλωσσο, el μόνο κύρια, en, es, fr, de): **0** σφάλματα hydration· τα ισπανικά συνεχίζουν να μεταφράζονται. `dom.test.ts`: 5 tests.

### 32.3 Ο ελληνικός κατάλογος έφτασε τους άλλους (`df341fef`)

Ανιχνευτής ανέγνωσε κάθε ορατή πρόταση σε 42 σελίδες με ελληνικά κύρια: **140** στα αγγλικά. Αιτία: ο κατάλογος του DOM pass είχε 3.073 εγγραφές σε κάθε γλώσσα και **2.501 στα ελληνικά**. Προστέθηκαν οι 573 που είχαν οι άλλες + 107 που βρήκε ο ανιχνευτής (2.501 → 3.181, 680 προσθήκες, καμία αναδιατύπωση). Μετά: **27**, όλες κύρια ονόματα. `catalogParity.test.ts`: τα ελληνικά έχουν κάθε πρόταση που έχει οποιαδήποτε άλλη γλώσσα, κάθε μετάφραση κρατά τα placeholders της (έλεγχος σε όλες τις 8 — κανένα σπασμένο), καμία κενή. Επίσης: το `/ai` συστηνόταν σε κάθε χρήστη ως «τα ίδια δεδομένα Harbor… γύρος $750K» (διορθώθηκε σε 8 καταλόγους, μπήκε στον φρουρό)· η ημερομηνία του `/coaching` ήταν πάντα en-GB με «at» και ανακάτευε UTC ημέρα με τοπική ώρα.

### 32.4 Μέγεθος ανά ρόλο, όχι οριζόντια (`9d45c667`)

57 προτάσεις κύριας γλώσσας κάτω από 14px σε 21 σελίδες· οι 47 από `text-xs` (βήμα «βοηθητικό», 13.26px) που έκανε δουλειά περιεχομένου. Περιγραφές καρτών (marketplace, learning, groups, mentoring), συστάσεις ετοιμότητας, περιγραφές ορόσημων, οδηγίες του `/analytics` → `text-sm` (14.28px), ακόμη `line-clamp-2`. Προεπισκοπήσεις που κόβονται και υποσημειώσεις φορμών μένουν μικρές. Το marketplace έλεγε «Από / From €500»· το πρόθεμα φεύγει μόνο στην εμφάνιση, οι μονάδες διαβάζονται ελληνικά. Ραντάρ ετοιμότητας: η στενότερη στήλη του κύματος 1 έκοβε την ελληνική ετικέτα («ητα χρηματοδότησης»)· αναδίπλωση σε δύο ισορροπημένες γραμμές, και στα 390px η ετικέτα μετριέται και μετακινείται προς τα μέσα. Η κλίμακα (πλάγια, «35», πάνω στην «Αγορά») έγινε ένα οριζόντιο «100» στις 0°. 1440/1024/390 × el/en: **0** ετικέτες έξω από το SVG.

### 32.5 Πύλες και τι δεν αποδεικνύουν

Vitest 783/783 (99 αρχεία), typecheck web 0. Οι μετρήσεις browser έγιναν σε demo mode· δεν είναι πιστοποίηση πραγματικών εγγραφών ή όλων των ρόλων. Η ποιότητα του **υπάρχοντος** ελληνικού καταλόγου δεν ελέγχθηκε συστηματικά — εντοπίστηκαν ενδεικτικά: «Draft» → «Σχέδιο» (σημαίνει «plan»), «Avg. Readiness» → «Μέσος όρος Ετοιμότητα» (ασύντακτο), «2w ago» → «πριν 2w», ασυνέπεια «1d ago» → «πριν 1ημ» / «2d ago» → «πριν από 2 ημέρες», αγγλικά κεφαλαία τίτλων σε ελληνικό κείμενο, «Pitch Deck» → «παρουσίαση pitch» δίπλα σε «pitch deck». Αυτό είναι το επόμενο βήμα του κύματος 2. Τα υπόλοιπα του §31.9 (κύματα 3–7) δεν άρχισαν.

### 32.6 Λειτουργικές σημειώσεις για όποιον συνεχίσει

- Ο dev server ξεκίνησε ως **ανεξάρτητη διεργασία** (`Start-Process node ./scripts/dev.js`, κρυφό παράθυρο)· μια εργασία παρασκηνίου του εργαλείου τερματίζεται στο χρονικό της όριο και παίρνει τον server μαζί της.
- Μετά από τερματισμό ή μεγάλη αλλαγή, επαλήθευσε ότι το HTML του server έχει τη νέα αλλαγή (`curl … | grep`) πριν εμπιστευτείς οποιαδήποτε μέτρηση browser.
- Σε shell heredoc, το `\b` μέσα σε Python string έγινε **χαρακτήρας backspace** στο αρχείο. Για κανονικές εκφράσεις γράψε το script με το εργαλείο αρχείων, όχι με heredoc.

## 33. Συνέχεια 2026-10-04 — upstream reconciliation και καθαρότητα στα συγκεκριμένα workspaces

### 33.1 Τι υπάρχει πραγματικά στα δύο repositories

Έγινε νέο fetch από τα δύο δηλωμένα remotes και απογραφή branches μέσω GitHub CLI. Το ενεργό `claude/project-audit-upgrade-y2ebnr` και το origin ήταν στο `5b547b86`. Όλα τα υπόλοιπα δημοσιευμένα branches του origin είναι πρόγονοί του. Τα δύο Cascade worktrees ήταν καθαρά στο `150c70af`, το οποίο το `git cherry` χαρακτηρίζει patch-equivalent με την ενεργή ιστορία.

Το upstream `tasoasteritopeleven/cofoundersbay` έχει μόνο `main`, στο `32dffb10`, με τρία commits και **χωρίς κοινό merge base** με το δικό μας repository. Είναι preview wrapper: ο κατάλογος `cofoundersbay` είναι gitlink (`160000`) προς το ήδη δικό μας `15183f58`, όχι tree με τον νεότερο κώδικα. Τα root manifests/configuration ανήκουν σε διαφορετικό starter. Δεν έγινε merge unrelated histories, αντικατάσταση manifests, εισαγωγή `.gitconfig` ή μεταφορά preview-only security settings.

Το upstream `memory/PRD.md` αναφέρει μη δημοσιευμένες αλλαγές μέσα στο `/app/cofoundersbay`. Αυτές δεν ανακτώνται με pull του wrapper. **Εκκρεμότητα εισόδου:** απαιτείται commit/push του εσωτερικού repo ή patch μαζί με τα νέα αρχεία. Οι αναφορές αποτελεσμάτων του άλλου περιβάλλοντος δεν θεωρούνται απόδειξη ότι έχουμε τα αρχεία του.

Το δικό μας `dcd95c09` αναφέρει ρητά τα ευρήματα Emergent και ήδη υλοποιεί αποτέλεσμα `cancelled`, άρνηση κενών choices, αναμονή ολοκλήρωσης εντολών, κλείδωμα διπλής επιβεβαίωσης και αντίστοιχα tests. Αυτό ελέγχθηκε στον κώδικα, όχι μόνο στον τίτλο commit. Το `5b547b86` προσθέτει ελληνική ορολογία. Οι επτά τοπικές αλλαγές που υπήρχαν κατά την έναρξη διατηρήθηκαν· δεν έγινε stash/reset πάνω σε ξένη εργασία.

### 33.2 Σχεδιαστική απόφαση: αφαιρούμε διακόσμηση, όχι προσανατολισμό

- **Πρωτεύουσα ενέργεια:** το accent υποδεικνύει δημιουργία/αποθήκευση ή το επόμενο ουσιώδες βήμα, όχι κάθε επαναλαμβανόμενο link σε λίστα.
- **Περιγράμματα:** αφαιρούνται επιλεκτικά από φωλιασμένες βοηθητικές επιφάνειες, chips ενεργειών και πληροφοριακές κάρτες που ήδη χωρίζονται με χρώμα επιφάνειας/κενό. Δεν αλλάζει καθολικά το shared `outline` variant, τα πεδία, τα overlays ή τα επιλεγμένα στοιχεία καμβά.
- **Keyboard focus:** διατηρείται το εξωτερικό περίγραμμα 2px. Είναι ένδειξη χειρισμού, όχι διακοσμητικός θόρυβος.
- **Μέγεθος:** επαναλαμβανόμενες βοηθητικές ενέργειες χρησιμοποιούν την υπάρχουσα compact κλίμακα, συνήθως 32–36px στο desktop. Ύψος τουλάχιστον 44px στο τηλέφωνο, αναδίπλωση χωρίς clipping, όχι οριζόντιο «μίκρυνε τα πάντα».
- **Ανάγνωση:** διατηρούνται οι προηγούμενες βελτιώσεις μεγέθους γραμματοσειράς και η επιλογή κύριας/δίγλωσσης εμφάνισης. Οι μακριοί ρόλοι έργων αναδιπλώνονται μέσα στην κάρτα αντί να χύνονται στην επόμενη.
- **Σημασία χωρίς αποκλειστική χρήση χρώματος:** τα φίλτρα έργων αποκτούν `aria-pressed` και διαφοροποίηση βάρους. Τα status labels, ποσοστά και μηνύματα παραμένουν.
- **Χρώματα:** δεν αλλάζουν αυθαίρετα τα τέσσερα συμφωνημένα light accents. Η ηπιότερη εικόνα προκύπτει πρώτα από λιγότερες ανταγωνιστικές γεμίσεις και εσωτερικές γραμμές. Τα token contrast checks δεν πιστοποιούν κάθε γράφημα.

### 33.3 Πρώτη εφαρμογή και υπόλοιπη σειρά ελέγχου

| Σελίδα / οικογένεια | Πρώτη εφαρμογή ή εύρημα | Επόμενος λεπτομερής έλεγχος |
|---|---|---|
| Founder dashboard | Αφαίρεση διακοσμητικού accent περιγράμματος στη σύνοψη προόδου, χωρίς αλλαγή διαστάσεων/δεδομένων | Ιεράρχηση ειδοποιήσεων, χαμηλότερη διάσταση, μετάβαση από σύνοψη στην ενέργεια, πραγματικά queries |
| Readiness | Ήρεμη σύνοψη, recommendations και next-criterion χωρίς επάλληλα πλαίσια· παραμένουν όλα τα κριτήρια/radar | Live/demo, αλλαγές κριτηρίων, μέτρηση γειτονικών χρωμάτων γραφήματος και κατάσταση αποτυχίας |
| Analytics | Περιλαμβάνεται στον browser έλεγχο, όχι νέα αναδιάταξη στο παρόν κύμα | Ύψος metric cards, ίση οπτική βαρύτητα, μονάδες και πηγή μετρήσεων, περίοδοι/exports |
| Builder | Έξι συντομεύσεις ως ήρεμες compact επιφάνειες αντί για πλαίσιο μέσα σε πλαίσιο | Ίδιο document/context σε όλες τις καρτέλες, versions, collaborators, αποτυχία αποθήκευσης |
| Pitch deck | Συμπαγείς προτάσεις χωρίς περίγραμμα· πραγματική σύνδεση content/notes labels και word count με πεδία | Manual/AI race, import/export, preview, versions και save με πραγματικό backend |
| Applications | Διατηρούνται labels, ευρετήριο και οι προηγούμενοι έλεγχοι διατήρησης draft | Κάθε πρόγραμμα, long answers, errors, reload μετά την αποθήκευση, επικύρωση limits |
| Research list / canvas | Ο canvas αποκτά ονομασμένο main landmark χωρίς ενεργοποίηση των γενικών `#main-content` overrides | Selection, zoom, alignment, resize, layering, inspector states, συνδέσεις, undo και κοινή χρήση |
| Milestones | Φίλτρα χωρίς επαναλαμβανόμενα outlines, με διακριτή επιλογή και touch floor | Edit/complete/reopen/delete, dates, κανόνες προόδου, modal keyboard flow |
| Projects list | Η «Προβολή έργου» παύει να ανταγωνίζεται τη δημιουργία, παραμένει link· ορατό menu, αναδίπλωση ρόλων, αφαιρείται stray `0` | Grid/list ισοδυναμία, φίλτρα, κενές λίστες, team/actions, πραγματική υλοποίηση πέρα από demo |
| Project detail — 4 tabs | Ήρεμες βοηθητικές ενέργειες και role tiles· ίδια join/apply/message/calendar handlers | Δικαιώματα ιδιοκτήτη/μέλους/επισκέπτη, ακριβής κατάσταση αίτησης, persistence |
| Fundraising | Περιλαμβάνεται στον browser έλεγχο, δεν αλλάζει ο πυρήνας δεδομένων | Pipeline/Kanban/data room, scopes και διάκριση demo πραγματικού γύρου, status transitions |
| AI | Οι προτάσεις χάνουν τα περιττά περιγράμματα· παραμένει η διάκριση ανάγνωσης/μεταβολής | Context ανά route, consent, cancelled/failed/done, cache refresh, αληθινό undo, citations |
| Messages | Περιλαμβάνεται στον browser έλεγχο, χωρίς αφαίρεση ενεργειών | Conversation identity, composer/reply, scrolling, scheduling, attachment/error states |
| Calendar | Περιλαμβάνεται στον browser έλεγχο, χωρίς αφαίρεση views | Day/week/list, time zones, modal forms, συμβατότητα πηγών events/meetings/milestones |

Τα επόμενα κύματα συνεχίζουν στα admin/tenant/org/provider/investor/mentor, auth/onboarding και λοιπά dynamic routes. Δεν θεωρούνται ελεγμένα επειδή το static registry τα γνωρίζει.

### 33.4 Μέθοδος επαλήθευσης

Νέο `apps/web/e2e/workspace-clarity.spec.ts`: browser tests για πραγματική ενεργοποίηση shortcuts, ορατό menu χωρίς hover, φίλτρα και στόχους αφής, αναδίπλωση καρτών, τέσσερις project tabs, προσθήκη διαφάνειας, labels και drafts μεταξύ slides. Πρόσθετοι έλεγχοι στις 15 ζητούμενες διαδρομές σε desktop/mobile και στα τέσσερα light themes με κύρια γλώσσα ελληνικά στις κάρτες έργων. Τα screenshots δεν αποτελούν αυτόματα visual-diff acceptance.

Πριν τις διορθώσεις αναπαράχθηκαν τα borders σε Builder/Pitch, η έλλειψη `aria-pressed`, η έλλειψη accessible textbox names στο Pitch και η απουσία main landmark στον canvas. Η δοκιμή sidebar συνάντησε tour που ανοίγει μετά από 700ms· η αρχικοποίηση ελέγχου διορθώθηκε στο πραγματικό `cfb.tour.<tourId>.<userId>`, όχι με αλλαγή της λειτουργίας του tour. Η πρώτη συλλογή screenshots με tours/animations δεν χρησιμοποιείται ως τελικό οπτικό τεκμήριο.

Νέα στατική απογραφή: 160 routes, 533 endpoints, 0 parse errors, **0 αυτομάτως verified**. AI census: 110 operable, 23 askable, 27 μη λειτουργικές επιφάνειες AI με δηλωμένη αιτία, 0 unexplained. Αυτή είναι κάλυψη δηλώσεων, όχι πραγματική εκτέλεση/εξουσιοδότηση 160 σελίδων.

### 33.5 Κύμα 4 — πλήρες mobile sweep και οπτικός έλεγχος υπόλοιπων οικογενειών (αποτέλεσμα)

**Mobile sweep 390px, 143/143 στατικές διαδρομές:** HTTP 200 παντού, 0 uncaught errors, 0 οριζόντιο overflow, 0 ανώνυμα controls, 0 κενά icon-only targets. Χωρίς Ask AI seam μένουν μόνο 13 auth/legal/utility routes (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/pricing`, `/privacy`, `/terms`, `/unauthorized`, `/api-status`, `/auth/*`, `/test-onboarding`, `/themes/alliance`) — αναμενόμενο, όχι κενό.

- `deadBands` εντοπίστηκε μόνο στο `/analytics` σε 390px: είναι το uniform-height KPI grid όπου οι πέντε κάρτες χωρίς sparkline κρατούν το ύψος της έκτης. Top-aligned περιεχόμενο σε ίσες κάρτες είναι το πρότυπο του κλάδου — αποδεκτό trade-off, όχι ελάττωμα.
- Σε 1440px, `/analytics`, `/admin/analytics` και `/admin/dashboard` δείχνουν 0 dead bands· το παλιό «πιθανό κενό» του `/admin/analytics` δεν αναπαράγεται (ήταν πιθανώς snapshot mid-load). Greek share: 56% / 41% / 52% αντίστοιχα.
- Οπτικός έλεγχος screenshots στις υπόλοιπες οικογένειες (`/admin`, `/admin/users`, `/tenant/members`, `/tenant/settings`, `/org/members`, `/org/dashboard`, `/matches`, `/messages`, `/settings`, `/search`, profile-onboarding): συνεπής ιεράρχηση, χωρίς νέα ευρήματα καθαρότητας μετά τα κύματα 1–3. Τα per-row Review buttons και η Message ως κύρια ενέργεια ανά match card είναι ορθά — δεν ανταγωνίζονται page-level primary.

**Θέμα default (λύθηκε):** το `RoleTheme`/`getStoredTheme` όριζαν `'dark'` όταν δεν υπήρχε αποθηκευμένη επιλογή — κάθε νέος χρήστης έπεφτε σε dark. Τώρα, χωρίς αποθηκευμένη επιλογή, ακολουθείται το `prefers-color-scheme` (επαληθεύτηκε στον browser και για τις δύο κατευθύνσεις), και το OS tracking συνεχίζει όσο δεν έχει επιλεγεί θέμα. Οι αποθηκευμένες επιλογές δεν αγγίχθηκαν· το `system` παραμένει η ξεχωριστή slate παλέτα.

**Εναπομένοντα για επόμενα κύματα:** dynamic routes πέρα από `/projects/1` και `/research/board-gtm`, modals/dialogs (οι sweep δεν τα ανοίγει), πραγματικό backend persistence εκτός demo, πολλαπλοί ρόλοι ανά σελίδα, και το γνωστό `/fundraising` hydration μετά από καθαρή επανεκκίνηση του dev server.

## 34. Έλεγχος 2026-10-04 — fast-forward, καμία παράλειψη, και τι μένει μετά τα κύματα 1–4

### 34.1 Git

`git fetch origin --prune` στις 2026-10-04, από το `daae0191`. Το `origin/claude/project-audit-upgrade-y2ebnr` (`0b4a7818`) είναι αυστηρός απόγονος του HEAD (ο πρόγονος περιέχει και το §30). Έγινε `git merge --ff-only`. Μετά, κάθε remote head έχει **0** commits έξω από το HEAD:

| remote | SHA | commits έξω από το HEAD |
|---|---|---|
| `claude/project-audit-upgrade-y2ebnr` | `0b4a7818` | 0 |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | `daae0191` πριν το ff | 0 |
| `cursor/phone-component-sizes-53e0` | `477ca958` | 0 |
| `integration/ai-platform-upgrade` | `0e792ce7` | 0 |
| `cursor/ai-os-fullpage-chat-53e0` | `7ce1fe32` | 0 |
| `main` | `91d6ea3a` | 0 · το `0b4a7818` είναι 383 commits μπροστά· οι σημειώσεις αυτού του ελέγχου κάθονται από πάνω |

Τα 14 commits που μπήκαν είναι τα `9fab86d9` … `0b4a7818`: συγχώνευση του §30, κύματα καθαρότητας 1–4, ελληνικός κατάλογος, εξουσιοδότηση tenant/org, αναφορές εντολών του assistant, και το default θέμα που ακολουθεί το λειτουργικό. Δεν υπάρχει δεύτερο tip. Το April `main` δεν ενώθηκε. Το wrapper upstream του §33.1 δεν είναι remote αυτού του clone· η κρίση εκεί (χωρίς κοινό merge-base, δεν γίνεται merge) δεν αλλάζει.

### 34.2 Ξαναμέτρηση στο `0b4a7818`

| αντικείμενο | §30 | τώρα | διαφορά |
|---|---:|---:|---|
| `page.tsx` | 160 | **160** | καμία |
| στατικές διαδρομές στο `platform-sweep-routes.txt` | — | **143** | οι 143 πέρασαν το mobile sweep του §33.5 |
| δυναμικές διαδρομές εκτός λίστας | — | **17** | ο κατάλογος είναι στο 34.4 |
| `components/**/*.tsx` | 261 | **262** | + `ApplicationGenerator.test.tsx` |
| `<Button>` | 1324 | **1320** | −4, μέσα στα κύματα που ηρέμησαν επαναλαμβανόμενα CTA |
| native `<button>` | 571 | **572** | +1 |
| αρχεία με `Dialog` ή `Sheet` | 54 | **54** | κανένα νέο, κανένα λιγότερο· ο πίνακας του §30.4 ισχύει ως έχει |

Η σύμβαση κουμπιού του §30.3 δεν άλλαξε: variants και ύψη ίδια, floor 44px κάτω από 640px, desktop root 82% άθικτο. Τα 1.320 `<Button>` και τα 572 native δεν ξαναγράφονται. Όσα κάθονται μέσα σε κλειστό dialog δεν τα είδε το sweep των 143.

### 34.3 Τι έκλεισε από το πλάνο του §30.7

| βήμα §30.7 | κατάσταση στο `0b4a7818` |
|---|---|
| 1. Ύψος 44px στις 160 σελίδες στα 390px | **κλειστό για τις 143 στατικές**: §33.5, 0 ανώνυμα, 0 κενά icons, 0 οριζόντιο overflow. Ανοιχτό για τις 17 δυναμικές και για controls μέσα σε dialog |
| 2. Κάθε ανοιχτό dialog έχει accessible name | **ανοιχτό**. Το sweep δεν ανοίγει dialogs. Το §31.11 σημειώνει και προϋπάρχουσα προειδοποίηση Radix στο CreatePost |
| 3. `space-y-6` ως lint | **ανοιχτό**. Παραμένει σύμβαση, όχι φρουρός |
| 4. Τα 50 routes χωρίς ενέργεια assistant | **ισχύει, με νέο census**: §33.4 μετρά 110 operable, 23 askable, 27 με δηλωμένη αιτία, 0 χωρίς εξήγηση |

Τα «επόμενο: ένταξη στο sweep 390px» του §30.6 για σελίδες με rail **έκλεισαν**, όταν η διαδρομή είναι στη λίστα των 143. Δεν επαναλαμβάνονται ως εκκρεμότητα.

### 34.4 Οι 17 δυναμικές διαδρομές — το μόνο σύνολο σελίδων που το sweep δεν άνοιξε

Καθεμία χρειάζεται ένα πραγματικό id στο demo και τις ίδιες μετρήσεις με το §33.5 (390 και 1440: HTTP 200, 0 overflow, 0 ανώνυμα controls, 0 κενά icons), συν τον έλεγχο του §31.6 για την οικογένειά της. Το §33.5 άνοιξε δείγμα μόνο σε `/projects/1` και `/research/board-gtm`.

| route | οικογένεια §31.6 | επόμενο |
|---|---|---|
| `/projects/[projectId]` | milestones / projects | οι 4 καρτέλες του §33.3 σε id που δεν είναι demo-only· δικαιώματα ιδιοκτήτη, μέλους, επισκέπτη |
| `/research/[boardId]` | research / canvas | selection, zoom, layers, inspector, undo, κοινοποίηση· το main landmark ήδη μπήκε |
| `/matches/[userId]` | εύρεση | το προφίλ κρατά τους λόγους συνάφειας· σύνδεση και μήνυμα δεν φεύγουν |
| `/profiles/[userId]` | profile | ίδια στοιχεία με το `/profile`, χωρίς δεύτερο μοντέλο |
| `/p/[username]` | public | ανάγνωση χωρίς λογαριασμό· κανένα rail, κανένα AI |
| `/events/[id]` | calendar / events | κράτηση, timezone, άκυρη ημερομηνία |
| `/groups/[groupId]` | feed / communities | μέλος / μη μέλος, moderation ορατή μόνο σε όποιον την έχει |
| `/programs/[id]` | admin / programmes | αίτηση παραμένει ανθρώπινη επιβεβαίωση |
| `/data-room/[id]` | fundraising | δικαιώματα εγγράφου, όχι νέο μοντέλο γύρου |
| `/startups/[id]` | deals | στάδια pipeline· το §6 που το έλεγε 404 δεν ισχύει (§30) |
| `/pitch/[id]` | public share | ανάγνωση του deck χωρίς λογαριασμό |
| `/share/[token]` | public share | ληγμένο και άκυρο token έχουν δική τους κατάσταση |
| `/org/[slug]` | public | δημόσια σελίδα οργανισμού |
| `/org/[slug]/admin` | organisation operations | destructive μόνο με confirm |
| `/org/cohorts/[id]` | organisation operations | ίδια δικαιώματα με τα υπόλοιπα `/org/*` |
| `/admin/user-detail/[id]` | administration | ενέργειες μόνο για platform admin |
| `/t/[slug]` | public tenant | ανάγνωση χωρίς λογαριασμό |

Οι υπόλοιπες 143 σελίδες μένουν στον κατάλογο του §30.6. Το επόμενο βήμα τους δεν είναι νέο οπτικό πέρασμα. Είναι ο λεπτομερής έλεγχος της στήλης «επόμενος λεπτομερής έλεγχος» στο §33.3 για τις οικογένειες που αναφέρονται εκεί, και το κύμα 6 του §31.9 για admin, tenant, org, provider, investor, mentor: ίδια σύμβαση, όχι ίδια πυκνότητα ούτε ίδια δικαιώματα.

### 34.5 Κάθε modal

Τα 54 αρχεία του §30.4 δεν άλλαξαν σύνολο. Η σύμβαση (καρφωμένο πάνω στο τηλέφωνο, κεντραρισμένο από `md`, κλείσιμο 44×44, δίγλωσσο όνομα) ισχύει στον κοινό `DialogContent` / `Sheet`. Δεν έχει ανοιχτεί το καθένα.

Επόμενο, ένα για όλα: άνοιγμα σε demo, και αποτυχία αν το `dialog` δεν έχει accessible name, αν το Escape δεν κλείνει, αν το focus δεν γυρίζει στη σκανδάλη, ή αν το κλείσιμο είναι κάτω από 44px στα 390px. Το CreatePost μένει πρώτο, επειδή το §31.11 έχει ήδη προειδοποίηση Radix για περιγραφή.

### 34.6 Κάθε component και κάθε button

Κάθε αρχείο του §30.5 κληρονομεί τα κύματα 1–4. Το μόνο νέο αρχείο είναι τεστ, όχι επιφάνεια. Δεν προστίθεται variant κουμπιού.

Επόμενο για τα κουμπιά που το sweep δεν είδε: όσα είναι μέσα στα 54 dialogs και όσα ζωγραφίζονται μόνο αφού φορτώσει δυναμικό id. Ο φρουρός είναι ο ίδιος με το §33.5, όχι νέα κλίμακα μεγεθών. Στο desktop τα compact 32–36px του §33.2 μένουν.

### 34.7 Σειρά που μένει

| σειρά | δουλειά | αποδοχή |
|---|---|---|
| 1 | οι 17 δυναμικές με πραγματικό id, 390 και 1440 | ίδιες μηδενικές μετρήσεις με το §33.5 |
| 2 | άνοιγμα των 54 dialogs | accessible name, Escape, επιστροφή focus, κλείσιμο ≥44px στο τηλέφωνο |
| 3 | κύμα 6: admin / tenant / org / provider / investor / mentor, μία εργασία ανά ουρά | το δικαίωμα ελέγχεται στον server, όπως ήδη στα tenant/org writes του `15183f58` |
| 4 | persistence έξω από demo, και δεύτερος ρόλος στην ίδια σελίδα | αποτυχία εγγραφής φαίνεται ως αποτυχία· το toast δεν μετρά ως απόδειξη |
| 5 | `space-y-6` ως lint στο πρώτο stack | νέα σελίδα με άλλο ρυθμό αποτυγχάνει· τα tabs μένουν `space-y-4` |

### 34.8 Τι δεν αποδεικνύει αυτό το τμήμα

Δεν ξαναέτρεξαν typecheck, vitest ή το sweep. Τα 143/143 και τα 783/783 είναι τα νούμερα των §32.5 και §33.5 στο ίδιο tip, όχι νέα εκτέλεση αυτής της ώρας. Η απογραφή 160 / 262 / 1320 / 572 / 54 έγινε με ανάγνωση του δέντρου στο `0b4a7818`. Το live preview επιβεβαιώνει το `/demo` → `/dashboard/founder` σε αυτόν τον κώδικα.

## 35. Έλεγχος 2026-10-05 — fast-forward στο `86e44463`, και τι μένει αφού μπήκαν τα κύματα 5–6c

### 35.1 Git

`git fetch origin --prune` στις 2026-10-05, από το `aff511cf`. Το `origin/claude/project-audit-upgrade-y2ebnr` (`86e44463`) είναι αυστηρός απόγονος. Έγινε `git merge --ff-only`. Μετά, κάθε remote head έχει **0** commits έξω από το HEAD:

| remote | SHA | commits έξω από το HEAD |
|---|---|---|
| `claude/project-audit-upgrade-y2ebnr` | `86e44463` | 0 |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | `aff511cf` πριν το ff | 0 |
| `cursor/phone-component-sizes-53e0` | `477ca958` | 0 |
| `integration/ai-platform-upgrade` | `0e792ce7` | 0 |
| `cursor/ai-os-fullpage-chat-53e0` | `7ce1fe32` | 0 |
| `main` | `91d6ea3a` | 0 · το `86e44463` είναι 406 commits μπροστά· οι σημειώσεις αυτού του ελέγχου κάθονται από πάνω |

Τα 20 commits είναι τα `18f3aff0` … `86e44463`. Ανάμεσά τους το merge `ce5310be` που ξαναπαίρνει τις σημειώσεις του §34. Δεν υπάρχει δεύτερο tip. Το April `main` δεν ενώθηκε.

### 35.2 Ξαναμέτρηση στο `86e44463`

| αντικείμενο | §34 | τώρα | διαφορά |
|---|---:|---:|---|
| `page.tsx` | 160 | **160** | καμία· ο κατάλογος του §30.6 ισχύει |
| `components/**/*.tsx` | 262 | **264** | + `KeyboardShortcutsDialog.tsx`, + `dialog.returnFocus.test.tsx` |
| `<Button>` | 1320 | **1323** | +3 |
| native `<button>` | 572 | **581** | +9, μέσα στα κύματα πληκτρολογίου και role chrome |
| αρχεία με `Dialog` ή `Sheet` | 54 | **57** | το νέο shortcuts dialog, ένα dialog στο `/discover`, και το τεστ επιστροφής focus |

Η σύμβαση κουμπιού του §30.3 δεν άλλαξε. Νέο dialog περνά από `DialogContent` ή `SheetContent`, ώστε να πιάνει το `use-return-focus.ts`. Παράκαμψη αυτών των δύο αφήνει το focus στη θέση που το άφησε το Radix, δηλαδή μόνο σε `DialogTrigger`.

### 35.3 Τι μπήκε στον κώδικα από το §34.7

Αυτό καταγράφει τι υπάρχει στο δέντρο. Δεν είναι νέα εκτέλεση των sweeps σε αυτή την ώρα.

| βήμα §34.7 | τι υπάρχει στο `86e44463` |
|---|---|
| 1. Οι 17 δυναμικές | `scripts/platform-sweep-dynamic.txt` έχει ένα demo id για καθεμία (`/projects/1`, `/research/board-gtm`, `/matches/user-elena`, `/profiles/user-elena`, `/p/preview-demo-user`, `/events/ev-office-hours`, `/groups/grp-athens-founders`, `/programs/prog-seed-autumn-2026`, `/data-room/dr-harbor-seed`, `/startups/deal-harbor`, `/pitch/demo`, `/share/data-room-seed`, `/org/aegean-lab`, `/org/aegean-lab/admin`, `/org/cohorts/cohort-autumn-2026`, `/admin/user-detail/preview-demo-user`, `/t/aegean-lab`). Η εντολή είναι `node scripts/platform-sweep.mjs scripts/platform-sweep-dynamic.txt 390` |
| 2. Dialogs | `use-return-focus.ts` στο Dialog, στο Sheet, στο `useModalA11y` και στο chat popup. Unit test: `dialog.returnFocus.test.tsx`. Browser probe: `.probes/dialog_sweep.mjs` σε 40 routes (`dialog-routes.txt`) ελέγχει όνομα, ταίριασμα, κλείσιμο ≥44px στο τηλέφωνο, Escape και επιστροφή focus. Δεν πατά destructive ούτε submit |
| 3. Ρόλοι | Το demo διαβάζει το `cfb_primary_role` και δεν το πατάει πια. `role_routes.mjs` γράφει τα routes του sidebar ανά ρόλο· `role_audit.sh` τρέχει bilingual fit και dialog sweep ανά ρόλο. Τα role pages διαβάζουν enum ως λέξεις (`StatusText`) |
| 4. Persistence έξω από demo | **ανοιχτό.** Τα tests και τα sweeps μένουν σε demo cookies. Το `AGENTS.md` το λέει ρητά |
| 5. `space-y-6` ως lint | **ανοιχτό.** Δεν υπάρχει τεστ που να αποτυγχάνει σε άλλο ρυθμό |

Επιπλέον, μέσα στα ίδια 20 commits: κάθε label φόρμας ονομάζει το control (`18f3aff0`), οι επιφάνειες που ανοίγουν με κλικ πιάνουν και πληκτρολόγιο (`cb331d4d`), το `/fundraising` δεν διαβάζει overlay πριν το hydration (`5739215c`), το `/auth/verify-email` χρησιμοποιεί τους κοινούς helpers αντί για raw fetch (`d1a31bcd`). Το `AGENTS.md` καταγράφει μέτρηση bilingual fit της 2026-10-05: 13→4 escapes και 64→22 clips στα 1440px σε 160 routes. Αυτή η σημείωση δεν την ξανάτρεξε.

### 35.4 Πλάνο που μένει — κάθε σελίδα, component, modal, button

Ο κατάλογος σελίδων μένει ο §30.6. Ο κατάλογος components μένει ο §30.5, συν το `KeyboardShortcutsDialog`. Ο κατάλογος modals μένει ο §30.4, συν το shortcuts dialog και το dialog του `/discover`. Η σύμβαση button μένει ο §30.3.

| σε τι εφαρμόζεται | επόμενο | αποδοχή |
|---|---|---|
| και οι 160 σελίδες | ένα φρέσκο sweep στα 390 και στα 1440, στατική λίστα και `platform-sweep-dynamic.txt` | HTTP 200, 0 overflow, 0 ανώνυμα, 0 κενά icons. Το 143/143 του §33.5 είναι το προηγούμενο tip |
| και οι 160, δίγλωσσες ετικέτες | τα 4 escapes και τα 22 clips που καταγράφει το `AGENTS.md` | 0 escapes, 0 clips εκτός chrome. Δεν μικραίνει η γραμματοσειρά και δεν κόβεται η γλώσσα του αναγνώστη |
| κάθε αρχείο με Dialog/Sheet, 57 | τρέξιμο του `dialog_sweep.mjs` στα 40 routes του `dialog-routes.txt`, στα 390 και στα 1440, και ανά ρόλο μέσω `role_audit.sh` | όνομα, Escape, επιστροφή focus, κλείσιμο ≥44px στο τηλέφωνο |
| κάθε `<Button>` και native `<button>` | καμία νέα κλίμακα. Όσα γεννιούνται μέσα σε dialog τα βλέπει μόνο το dialog sweep | το floor 44px κάτω από 640px μένει· το desktop μένει 82% |
| admin, tenant, org, provider, investor, mentor | το `role_audit.sh` με το αντίστοιχο `ROLE` | το sidebar του ρόλου δεν μετρά το chrome του founder |
| κάθε εγγραφή | persistence έξω από demo, με αποτυχία που φαίνεται ως αποτυχία | το toast δεν μετρά ως απόδειξη· το `prisma db push` μένει προϋπόθεση για τα schema-only μοντέλα |
| κάθε νέα σελίδα | lint στο πρώτο `space-y-6` | άλλο root rhythm αποτυγχάνει· τα tabs μένουν `space-y-4` |

### 35.5 Τι δεν αποδεικνύει αυτό το τμήμα

Δεν ξαναέτρεξαν typecheck, vitest, contrast, το static sweep, το dynamic sweep, το dialog sweep ή το bilingual fit. Οι αριθμοί 4 escapes και 22 clips είναι η καταγραφή του `AGENTS.md`, όχι μέτρηση αυτής της ώρας. Η απογραφή 160 / 264 / 1323 / 581 / 57 έγινε με ανάγνωση του δέντρου στο `86e44463`. Το live preview επιβεβαιώνει το `/demo` → `/dashboard/founder` σε αυτόν τον κώδικα.

## 36. Γύρος 2026-10-05/06 — αποτέλεσμα εντολών, μία ελληνική φωνή, sidebar που διαβάζεται, κλίμακα κινητού

Το §35 κατέγραψε το fast-forward στο `86e44463`. Εδώ γράφεται τι άλλαξε στον κώδικα από το `dcd95c09` ως το `82980c01`, τι ελέγχθηκε από τη δουλειά άλλων agents, και τι μένει.

### 36.1 Git

| commit | τι |
|---|---|
| `dcd95c09` | εντολές σελίδας: αναφέρουν τι έγινε πραγματικά (ολοκληρώθηκε, ακυρώθηκε ή απέτυχε) |
| `5b547b86` | μία ελληνική φωνή και ένα γλωσσάριο στους δύο καταλόγους |
| `5c09c352` … `069e1cdf` | 26 commits άλλου agent (κύματα 3–6c, ρόλοι, dialogs, bilingual fit). Ελέγχθηκαν όλα: tsc καθαρό, 829/829 |
| `86e44463` | διακόπτης λειτουργιών, εικονίδια με badge, glyph αναζήτησης, φούσκα chat στο rail, «Βαθμολογία ετοιμότητας» |
| `0a411c6a` | κάθε σύνδεσμος του μενού με δικό του εικονίδιο· πλήρη και σωστά κείμενα sidebar |
| `bebb51e2` | merge του `cursor/ui-upgrade-cloudflare-preview-53e0` (7 commits: κλίμακα ανάγνωσης κινητού, §35) |
| `82980c01` | το chrome του κινητού μετά την κλίμακα |

Το `upstream/main` (tasoasteritopeleven) έχει 3 commits σε ξένο ιστορικό: το scaffold του Emergent και τις αναφορές του. Το μόνο εύρημα που αφορούσε τον κώδικά μας ήταν η ακύρωση εντολών. Υλοποιήθηκε στο `dcd95c09` (§36.2). Δεν υπάρχει άλλο remote head με commits έξω από το HEAD.

### 36.2 Εντολές σελίδας: ολοκληρώθηκε, ακυρώθηκε ή απέτυχε (`dcd95c09`)

Πριν, κάθε `run` που επέστρεφε χωρίς exception μετρούσε ως επιτυχία. Έτσι ένα «Όχι» σε επιβεβαίωση ή μια εγγραφή που απέτυχε σιωπηλά εμφανιζόταν στον βοηθό ως «Έγινε», με undo και audit.

- `PageControlRunResult = void | CANCELLED | { error }`. Οι βοηθοί είναι `settle()` (το throw γίνεται `{ error }`), `ROW_GONE` και `isCancelledRun`. Λίστα επιλογών χωρίς επιλογές απορρίπτεται πριν τρέξει.
- `useAIChat`: κλείδωμα `pendingRef` (μία ενέργεια τη φορά)· ακύρωση σημαίνει χωρίς audit και χωρίς invalidate· αποτυχία σημαίνει audit `failed` και γραμμή σφάλματος στην κάρτα.
- `ActionCard`: κατάσταση «Ακυρώθηκε — δεν έγιναν αλλαγές» και γραμμή «Δεν εφαρμόστηκε: …» (`role="alert"`). Οι άλλες κάρτες κλειδώνουν όσο τρέχει μία.
- Μετατράπηκαν περίπου 50 σελίδες με 143 εντολές. Φρουρός: `commandSettlement.test.ts` (καμία `.mutate` χωρίς αποτέλεσμα, κανένα επιβεβαιωτικό dialog χωρίς `CANCELLED`).

### 36.3 Ελληνικά (`5b547b86`, `0a411c6a`)

- Ελέγχθηκαν 2.501 + 697 εγγραφές καταλόγου. Τόνος: πληθυντικός ευγενείας («Πατήστε», «σας»). Ο βοηθός ακούει τον χρήστη στον ενικό, γιατί είναι η δική του φωνή.
- Γλωσσάριο: γνωριμία (intro), σύσταση (endorsement), προσχέδιο (draft), έμβλημα (badge), οργανισμός (tenant), κύκλος (cohort), καθοδήγηση/καθοδηγούμενος, συμφωνίες (deals), συνολικά προσβάσιμη αγορά (TAM).
- 321 τιμές του `el.json` δεν φαίνονταν ποτέ, γιατί το `catalog.ts` προηγείται. Το `glossary.test.ts` απαιτεί πλέον να συμφωνούν οι δύο κατάλογοι.
- Σχετικός χρόνος: ένας formatter (`relativeTimeLabel`) αντί για 13 τοπικούς. Ελληνικά «πριν 3 ώ.», όχι «πριν 2w».
- Sidebar (`0a411c6a`): 37 tooltips διορθώθηκαν. Είχαν δάνεια όπως mentees, deals, cohorts, tenant, founders, RSVPs, KPIs, engagement. Είχαν και λάθη νοήματος: «ετοιμότητας επενδυτών», «συντονισμός λογαριασμών» για το moderate, «αιτήματα εισαγωγής» αντί «γνωριμίας». Το tooltip του `/ai` έδειχνε σε όλους τα δεδομένα του demo («Βοηθός Harbor … γύρος $750K»). 29 σύνδεσμοι που δεν είχαν tooltip απέκτησαν, και στις δύο γλώσσες, με βάση την περιγραφή του page registry. Φρουρός: `navCopy.test.ts`.

### 36.4 Μεγέθη και αφή (Part B, μετρημένο στα 390 και στα 1440)

- Τηλέφωνο, κάτω από 640px: `.tap-target-y`, `select` και `.tap-target-phone` στα 44px. Τα switches κρατούν τη λεπτή τους ράγα με περιοχή αφής ±10px. Μένουν μικροί στόχοι μόνο όπου η περιοχή αφής είναι ήδη 44px.
- Μήκος γραμμής: οι γκρι παράγραφοι στο `main` σταματούν στα 75ch (`:where`, ώστε να υπερισχύει το `max-w-*` της σελίδας). Οι γραμμές πάνω από 90 χαρακτήρες πήγαν από 17 σε **0**.
- Σε επόμενη μέτρηση: η φούσκα chat κάλυπτε το τελευταίο κουμπί του δεξιού rail. Όταν υπάρχει rail, γίνεται 40px και μπαίνει μέσα του.

### 36.5 Sidebar (`86e44463`, `0a411c6a`)

| εύρημα | μέτρηση | τώρα |
|---|---|---|
| διακόπτης λειτουργιών στα ελληνικά | κελί 55px, το «Λογαριασμός» θέλει 81px, άρα «Εξερεύ-νηση» και «Λογαρια-σμός» | στήλη πάνω σε ράγα, εικονίδια στα 16px όπως οι σύνδεσμοι· στο κινητό τρία σε σειρά (χωρούν)· tooltip με το περιεχόμενο κάθε λειτουργίας |
| εικονίδια κρυμμένα από τον κανόνα «χωρίς διακοσμητικά εικονίδια» | το καμπανάκι και το ημερολόγιο του rail έδειχναν μόνο «2» και «3» | το absolutely positioned badge δεν μετρά ως ετικέτα· το `data-keep-icon` εξαιρεί ρητά |
| ίδιο εικονίδιο σε όλη τη λίστα | admin 15 σύνδεσμοι / 1 glyph, org 10/1, tenant 12/1, mentor, investor, provider 10–11/5 | ένα glyph ανά λίστα, το πιο συγκεκριμένο της διαδρομής, αλλιώς το εικονίδιο του nav-modes. Φρουρός: `navGlyphs.test.ts` |
| matches, spark και default ήταν η ίδια σκηνή | στα 16px, Αντιστοιχίσεις, Βοηθός AI και Για εσάς ήταν μία σταγόνα | δύο κύκλοι που τέμνονται· αστέρι τεσσάρων ακτίνων· νέο `star` και νέο `search` |
| δύο ενεργοί σύνδεσμοι | το prefix test άναβε το «Admin console» δίπλα σε κάθε σελίδα admin | `getActiveNavHref`, όπως ήδη στο κινητό |
| Overview του incubator | δείχνει σε redirect (`/org/dashboard`), οπότε δεν άναβε ποτέ | δείχνει κατευθείαν στο `/dashboard/incubator` |
| κομμένες ετικέτες | 8 στα ελληνικά, στο πλαίσιο των 141px | **0**: συντομότερα ονόματα (Κέντρο διαχείρισης, Συνολικά αναλυτικά, Υπό παρακολούθηση, Κέντρο βοήθειας, Αναλυτικά) και αναδίπλωση αντί για αποκοπή |
| ετικέτα χωρίς ελληνικά | `/admin/dashboard` και `/settings/ai`: αγγλικά που το DOM pass άλλαζε μέσα σε `lang="en"` | ελληνική ετικέτα, σωστό `lang`, δεύτερη γραμμή |

### 36.6 Κλίμακα ανάγνωσης κινητού (άλλος agent, `4a27007e` … `1a08ec68`): έλεγχος και συνέπειες

Η κλίμακα αφορά μόνο το τηλέφωνο (`max-width: 639.98px`) και έχει δικό της φρουρό (`phoneReadingScale.test.ts`). Συγχωνεύτηκε όπως ήταν. Μετά τη συγχώνευση μετρήθηκαν στα 360 και 390:

- Το μενού του κινητού είχε μείνει χωρίς εικονίδια συνδέσμων (ο κανόνας των overlays), ενώ στο desktop τα ίδια link τα είχαν. Το `<nav>` πήρε `data-keep-icon`, και ο κανόνας το σέβεται.
- Η καρτέλα «Μενού» της κάτω μπάρας ήταν σκέτο κείμενο δίπλα σε τέσσερις καρτέλες με εικονίδιο. `data-keep-icon`.
- Στα 360px το «Εξερεύνηση» έσπαγε «Εξερεύνησ / η». Με soft hyphen σπάει «Εξερεύ- / νηση», και από τα 375px χωρά σε μία γραμμή.
- Ο διακόπτης μέσα στο μενού κληρονομούσε το `text-sm`, που στο κινητό είναι πλέον 15.68px. Παίρνει το βήμα caption (13.31px) και χωρά από τα 360px.
- **Για απόφαση:** μετά τις διαδοχικές μειώσεις, στο τηλέφωνο το `text-lg` (15.29px) είναι μικρότερο από το `text-base` (16.66px), και ο τίτλος σελίδας (16.99px) σχεδόν ίσος με το σώμα. Η ιεραρχία στηρίζεται πλέον μόνο στο βάρος. Ήταν ρητή επιλογή, οπότε δεν άλλαξε· καταγράφεται εδώ για να αποφασιστεί συνειδητά.

### 36.7 Τι μένει

1. Οπτικός έλεγχος ανά σελίδα στα 1440 και 390, ξεκινώντας από όσες δεν ελέγχθηκαν σε αυτόν τον γύρο: `/discover`, `/messages`, `/analytics`, `/settings`, `/ai`, `/profile`, και μετά οι σελίδες κάθε ρόλου μέσω του cookie `cfb_primary_role`.
2. Ξαναμέτρηση των 4 escapes και 22 clips του bilingual fit (§35.4) πάνω στη νέα κλίμακα κινητού.
3. Από το §35.4: persistence έξω από το demo, και lint στο `space-y-6`.
4. Τα glyphs `home` και `default` κρατούν ακόμη τη σκηνή του σήματος (surfer). Στα 16px το `home` διαβάζεται, το `default` όχι. Το `default` μπαίνει μόνο όπου λείπει αντιστοίχιση, και το `navGlyphs.test.ts` κρατά τις λίστες του μενού μακριά του.

### 36.8 Επαλήθευση

`tsc --noEmit` καθαρό. Vitest **846/846** (106 αρχεία). Οι μετρήσεις έγιναν στον live dev server με Playwright (scripts στο scratchpad): `navtrunc.mjs` (κομμένες ετικέτες ανά ρόλο και λειτουργία), `hiddenicons.mjs` (κρυμμένα εικονίδια στο chrome: 16 → 2, και τα 2 σκόπιμα: το διακοσμητικό sparkle του σήματος «Δείγμα» και το chevron που κρύβεται στο κινητό), `modefit.mjs` και `phone_shot.mjs`. Ο ρόλος του demo ορίζεται με cookies `cfb_session=preview-demo`, `cfb_preview_demo=1`, `cfb_primary_role=<ρόλος>` και επίσκεψη στο `/dashboard`. Το `/demo` επαναφέρει τον ιδρυτή.

## 37. Γύρος 2026-10-06 — δεξί rail ως chrome, τιμές ως λέξεις, ένας ρυθμός, μετρήσεις ανά ρόλο

### 37.1 Git

`git fetch --all --prune` στις 2026-10-06. Το `origin/claude/project-audit-upgrade-y2ebnr` είχε **70** νέα commits άλλων agents (§29–§36: επτάφασο πέρασμα, κύματα 1–6c, ρόλοι, dialogs, γλωσσάριο, εικονίδια μενού, κλίμακα κινητού). Έγινε `merge --ff-only`. Το `cursor/ui-upgrade-cloudflare-preview-53e0` είχε **1** commit έξω (`ffd15fc`, κείμενο κινητού −3%). Συγχωνεύτηκε (`a3db632`). Μετά, κάθε remote head έχει **0** commits έξω από το HEAD. Στο συγχωνευμένο δέντρο: tsc web/api καθαρό, vitest web 846/846, api 299/299, scripts 12/12, αντίθεση 0.

### 37.2 Δεξί rail: η ίδια επιφάνεια με το αριστερό sidebar, πιο φαρδύ (`cabcf17`, `bc0c39a`)

| πριν | μέτρηση | τώρα |
|---|---|---|
| αδιαφανές panel με κάρτες μέσα σε κάρτες | κάθε ενότητα του rail ένα λευκό κουτί σε γκρι κουτί, δίπλα σε sidebar χωρίς κουτιά | η επιφάνεια του sidebar (`data-rail-surface`). Γυαλί (90% card, blur 24px) όσο το rail ή το sidebar αιωρούνται πάνω από τη σελίδα. Οι προεπιλεγμένες κάρτες του rail γίνονται επίπεδες ομάδες με μία λεπτή γραμμή ανάμεσα. Όσες έχουν δικό τους χρώμα (status, callout) το κρατούν |
| πλάτος 18.5rem παντού | ~243px στα 1440: «Full-time · Πλήρης απασχόληση» σε δύο γραμμές, κομμένο placeholder | `--page-rail-width`: 18.5rem στα 1024–1279 (πιο φαρδύ «έπνιγε» τη στήλη, μετρημένο στο `/admin`), 22rem από τα 1280 (~289px), 24rem από τα 1536 (~315px). Μία τιμή, που τη διαβάζουν και το panel και το margin της στήλης |
| `RailStats` με πλαίσιο, και σε δύο σελίδες τοπικά αντίγραφα | `/calendar` και `/admin/tenants` με δικά τους κουτιά, και το `/admin` με αγγλικά μόνο, ίδιο εικονίδιο σε όλες τις γραμμές και «↓ 2% open» (πλήθος που διαβαζόταν ως ποσοστό) | ένα `RailStats`: απαλό tile, δίγλωσσο, εικονίδιο ανά μέγεθος, προαιρετική σημείωση («+3 αυτή την εβδομάδα», «περιμένουν έλεγχο») |

Hover peek, κουμπί καρφιτσώματος, sheet κάτω από `lg` και όλες οι ενότητες μένουν. Φρουρός: `railSurface.test.ts`. Οπτικός έλεγχος σε 16 railed σελίδες στα 1440 και επίσης στα 1024 και 1600.

### 37.3 Τιμές ως λέξεις, μία φορά (`ff019b6`)

- `/profile`: το «Τι αναζητώ» έδειχνε **«cofoundermentor»**. Το `lookingFor` είναι λίστα, και το React ενώνει τα στοιχεία της χωρίς κενό. Τώρα: «Cofounder · Συνιδρυτής  Mentor · Μέντορας».
- Στάδιο και δέσμευση εμφανίζονταν δύο φορές στους ιδρυτές. Μένουν μόνο στα στοιχεία ιδρυτή, ως λέξεις («Idea · Ιδέα»).
- `StatusText`: στάδια startup και δέσμευση, με τα ελληνικά του καταλόγου έργων.
- Avatar προφίλ 96px στο κινητό (ήταν 128px σε οθόνη 390px). Στο `/discover` οι ρόλοι ως λέξεις.

### 37.4 Ένας ρυθμός ενοτήτων, με φρουρό (`f93e6b0`)

Το Phase 4 όρισε `space-y-6` στην πρώτη στοίβα κάτω από το `AppShell` (τα `Tabs` κρατούν `space-y-4`), αλλά χωρίς τεστ. Το `pageRhythm.test.ts` βρήκε **14** παλαιότερες σελίδες σε `space-y-4/5`. Διορθώθηκαν. Έτσι έκλεισε το ανοιχτό σημείο «lint στο `space-y-6`» του §35.4.

### 37.5 Bilingual fit στη νέα κλίμακα κινητού, και έλεγχος ανά ρόλο

| μέτρηση | §35 (AGENTS.md) | πριν τις διορθώσεις | τώρα |
|---|---|---|---|
| 1440, 160 routes | 4 escapes · 22 clips | 0 · 2 | 0 · 1 (προεπισκόπηση μηνύματος, σκόπιμο) |
| 390, 160 routes | — | 5 · 8 | 4 · 3: 4 σημειώσεις του καμβά εκτός οθόνης στον μετακινούμενο πίνακα (σκόπιμο), 2 προεπισκοπήσεις μηνυμάτων (σκόπιμο), 1 στο `/test-onboarding` (εργαλείο ανάπτυξης, όχι σελίδα προϊόντος) |

Διορθώθηκαν: ονόματα επενδυτών στο pipeline του `/fundraising` (ο ελληνικός τίτλος έβγαινε 33px έξω από τη γραμμή), το badge κατάστασης στο `/admin/users` (σταθερά 96px έκοβαν το «Σε αναστολή»), ετικέτα στο `/mentor/reviews`, περιλήψεις στο `/learning`.

Ανά ρόλο (`role_audit.sh`: existing_founder, mentor, angel_investor, service_provider, incubator_admin). Το bilingual fit στα 1440/390: μένουν μόνο οι προεπισκοπήσεις μηνυμάτων. Dialog sweep στα 390: **58** dialogs, 0 χωρίς όνομα, 0 χωρίς Escape, 0 χαμένο focus, 0 κλείσιμο <44px, 0 overflow.

Μετά την τελική συγχώνευση το sweep στα 390 βρήκε δύο ακόμη: το header του `/privacy` και του `/terms` πλάτυνε τη σελίδα κατά 17px (οι σύνδεσμοι μεγάλωσαν με την κλίμακα κινητού), και το slide του `/pitch/demo` είχε σταθερό ύψος 520px, άρα κενό μισό slide στο κινητό. Και τα δύο διορθώθηκαν.

### 37.6 Η e2e σουίτα προσβασιμότητας: 204 αποτυχίες από τη συγχώνευση, 0 μετά

Η πρώτη εκτέλεση του `test:a11y` πάνω στο συγχωνευμένο δέντρο έδωσε **204 failed / 73 passed**. Οι 70 εισερχόμενες αλλαγές άλλαξαν αποχρώσεις και επιφάνειες χωρίς να τρέξουν τη σουίτα. Βρέθηκαν τρεις αιτίες, και όλες λύθηκαν χωρίς να αλλάξει καμία απόχρωση:

| αιτία | μέτρηση (axe) | διόρθωση |
|---|---|---|
| το «Bay» του λογότυπου, σε κάθε σελίδα μέσω του sidebar | 1.79:1 | Το WCAG 1.4.3 εξαιρεί τα λογότυπα, και η απόχρωση είναι ρητή επιλογή του χρήστη (`53f8bdb`). Το wordmark φέρει `data-logotype` και οι σαρώσεις το εξαιρούν (`e2e/axe-scope.ts`), όχι τον κανόνα αντίθεσης. Το `aria-hidden` δοκιμάστηκε και απορρίφθηκε: το axe το μετρά ούτως ή άλλως, και ο σύνδεσμος του `/login` έμενε χωρίς όνομα |
| κείμενο έμφασης πάνω στις αποχρώσεις της έμφασης (38 avatars, badges, ενεργά chips· το `bg-primary/10..20` βγαίνει από το `--primary-mid`) | 3.66–4.40:1 | `--primary-accessible` στο ανοιχτό θέμα: 55% → 50% (ίδια απόχρωση και κορεσμός). Στα άλλα θέματα και στις παλέτες ρόλων: μόνο η φωτεινότητα, όσο χρειάζεται |
| βοηθητικό κείμενο σε απαλές αποχρώσεις (προτεινόμενο πλάνο, επιλεγμένη κάρτα ρόλου) | 4.38–4.49:1 | `--muted-foreground` στο ανοιχτό θέμα: 45% → 42% |

Επίσης: τα αρχικά «AD» στο μενού χρήστη και τα avatars του `/opportunities` πήραν κείμενο foreground πάνω σε απαλό lilac. Οι επικεφαλίδες ομάδων του `/admin` έχασαν την αδιαφάνεια 80%. Το `check-theme-contrast.py` ελέγχει πλέον και κείμενο έμφασης σε απόχρωση /10 και /20 και βοηθητικό κείμενο σε /5 και /10, σε όλα τα πλαίσια θέματος. Αποτέλεσμα: **277 passed, 0 failed**, 21 skipped σκόπιμα ανά οθόνη.

Επιπλέον βρέθηκε μια σιωπηλή αστοχία padding. Στο desktop το `globals.css` ξαναγράφει τα `px-*` σε pixels μετά τα utilities του Tailwind, άρα κάθε `pr-*`/`pl-*` που δεν ξαναγράφεται χάνει από το `px-*`. Το `pr-24` έλειπε: το `/register` κρατούσε 96px για το κουμπί «Show» και το desktop έδινε 12px, οπότε το placeholder περνούσε κάτω από το κουμπί. Προστέθηκαν `pr-24` και `pr-1.5`. Το `paddingRestatement.test.ts` αποτυγχάνει σε όποιο βήμα πλευράς χρησιμοποιείται χωρίς να ξαναγράφεται.

### 37.7 Σύγκριση με το streetupper.com — μπλοκαρισμένη

Το `streetupper.com` απορρίπτεται από την πολιτική δικτύου αυτού του περιβάλλοντος (HTTP 403 στο proxy, και στο WebFetch). Οι μηχανές αναζήτησης δεν το έχουν ευρετηριάσει. Καμία σύγκριση δεν γράφτηκε από υπόθεση. Χρειάζεται `streetupper.com` στα Allowed domains του περιβάλλοντος, ή στιγμιότυπα/κείμενο από τον χρήστη.

### 37.8 Για απόφαση (από §36.6, αμετάβλητο)

Στο τηλέφωνο, μετά τις διαδοχικές μειώσεις, το `text-lg` (15.29px) είναι μικρότερο από το `text-base` (16.66px), και ο τίτλος σελίδας (16.48px) σχεδόν ίσος με το σώμα. Η ιεραρχία στηρίζεται μόνο στο βάρος. Ήταν ρητή επιλογή του χρήστη, γι' αυτό δεν άλλαξε.

### 37.9 Πύλες

| πύλη | αποτέλεσμα |
|---|---|
| tsc web / api | 0 / 0 |
| vitest web / api | **854/854** (109 αρχεία) / **299/299** (24) |
| scripts | 12/12 |
| αντίθεση θεμάτων (με τα νέα ζεύγη αποχρώσεων) | 0 |
| production build | επιτυχές |
| sweep 160 routes (στατικά + δυναμικά) @1440 / @390 | 0 σφάλματα · 0 οριζόντιο scroll (μετά τη διόρθωση του `/privacy`) · 0 ανώνυμα · 0 κενά εικονίδια |
| clock-probe +50 ημέρες | 143 routes, 0 που πετούν |
| e2e `test:a11y` | **277 passed, 0 failed**, 21 skipped (ήταν 204 failed στο συγχωνευμένο δέντρο) |

## 38. Έλεγχος 2026-10-06 — fast-forward στο `075f0288`, καμία παράλειψη

### 38.1 Git

`git ls-remote --heads origin` και `git fetch` στις 2026-10-06, από το `ffd15fc9`. Το `origin/claude/project-audit-upgrade-y2ebnr` (`075f0288`) είναι αυστηρός απόγονος: 10 commits έξω από το HEAD, 0 commits του HEAD έξω από αυτό. Έγινε `git merge --ff-only`. Μετά, κάθε remote head έχει **0** commits έξω από το HEAD:

| remote | SHA | commits έξω από το HEAD |
|---|---|---|
| `claude/project-audit-upgrade-y2ebnr` | `075f0288` | 0 |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | `ffd15fc9` πριν το ff | 0 |
| `cursor/phone-component-sizes-53e0` | `477ca958` | 0 |
| `integration/ai-platform-upgrade` | `0e792ce7` | 0 |
| `cursor/ai-os-fullpage-chat-53e0` | `7ce1fe32` | 0 |
| `main` | `91d6ea3a` | 0 · το `075f0288` είναι 424 commits μπροστά· οι σημειώσεις αυτού του ελέγχου κάθονται από πάνω |

Τα 10 commits είναι τα `0a411c6a` … `075f0288` (§36 και §37: εικονίδια μενού, chrome κινητού, rail, λέξεις στα `/profile` και `/discover`, ρυθμός `space-y-6`, bilingual fit, σουίτα προσβασιμότητας). Ανάμεσά τους τα merges `bebb51e2` και `a3db6323`, που ξαναπαίρνουν την κλίμακα κινητού. Δεν υπάρχει δεύτερο tip. Το April `main` δεν ενώθηκε.

### 38.2 Ξαναμέτρηση στο `075f0288`

Ίδια τομή με το §35 (`<Button`, `<button`, αρχεία `.tsx`).

| αντικείμενο | §35 (`86e44463`) | τώρα | διαφορά |
|---|---:|---:|---|
| `page.tsx` | 160 | **160** | καμία· ο κατάλογος του §30.6 ισχύει |
| `components/**/*.tsx` | 264 | **264** | καμία· τα νέα αρχεία είναι `.ts` (φρουροί), όχι components |
| `<Button>` | 1323 | **1323** | καμία |
| native `<button>` | 581 | **581** | καμία |
| αρχεία με `DialogContent` ή `SheetContent` | 59 | **59** | καμία από το `86e44463`. Η τομή «λέξη Dialog ή Sheet» του §35 έδινε 57· αυτή η τομή μετρά όσα ζωγραφίζουν dialog |

Κάλυψη σελίδων, χωρίς παράλειψη: `scripts/platform-sweep-routes.txt` έχει 143 στατικές διαδρομές και δεν λείπει καμία στατική `page.tsx`. Οι 17 δυναμικές (`[id]`, `[slug]`, `[userId]`, `[groupId]`, `[projectId]`, `[boardId]`, `[username]`, `[token]`) είναι ακριβώς οι 17 γραμμές του `scripts/platform-sweep-dynamic.txt`. 143 + 17 = 160.

Η σύμβαση κουμπιού μένει ο §30.3. Η σύμβαση modal μένει ο §30.4. Νέο dialog περνά από `DialogContent` ή `SheetContent`.

### 38.3 Τι έκλεισε από το §35.4 και τι μένει

Το `pageRhythm.test.ts` (`f93e6b05`) κλείνει το lint του `space-y-6`: η πρώτη στοίβα κάτω από το `AppShell` είναι `space-y-6`, τα `Tabs` μένουν `space-y-4`. Το bilingual fit και το dialog sweep που ζητούσε το §35.4 καταγράφονται στο §37.5, στο ίδιο tip. Το persistence έξω από το demo μένει ανοιχτό: τα tests και τα sweeps μένουν σε demo cookies.

Μένει, για απόφαση και όχι ως παράλειψη καταλόγου:

1. Η ιεραρχία γραμμάτων στο τηλέφωνο (§37.8): `text-lg` 15.29px, τίτλος 16.48px, `text-base` 16.66px. Το βάρος κρατά την ιεραρχία. Ήταν ρητή επιλογή και δεν άλλαξε σε αυτόν τον έλεγχο.
2. Το glyph `default` κρατά ακόμη τη σκηνή του σήματος (§36.7).
3. Persistence έξω από demo.

### 38.4 Τι δεν αποδεικνύει αυτό το τμήμα

Δεν ξαναέτρεξαν typecheck, vitest, contrast, το static sweep, το dynamic sweep, το dialog sweep ή το bilingual fit σε αυτή την ώρα. Αυτά τα νούμερα είναι το §37.9, γραμμένο πάνω στο ίδιο `075f0288`. Αυτή η ώρα ξαναμέτρησε το git, την απογραφή, την κάλυψη των 160 σελίδων και το `/demo`. Το `/demo` θέτει `cfb_session=preview-demo`, `cfb_preview_demo=1`, `cfb_primary_role=existing_founder`, απαντά 307 προς `/dashboard/founder`, και με αυτά τα cookies το `/dashboard/founder` απαντά 200.

## 39. Γύρος 2026-10-06 — Δεσμεύσεις: η συμφωνία ως κατώφλι, όχι ως ταβάνι

Αφετηρία: η ανάλυση StreetUpper ↔ CoFounderBay που έδωσε ο χρήστης (οι δημόσιες σελίδες του StreetUpper ελέγχθηκαν από τον ίδιο στις 6/10· από αυτό το περιβάλλον ο ιστότοπος μένει μπλοκαρισμένος, §37.7). Τίποτα δεν αφαιρέθηκε: οι καταχωρίσεις του `/opportunities`, οι ρόλοι των έργων, τα μηνύματα και το data room μένουν όπως ήταν· οι δεσμεύσεις μπαίνουν δίπλα τους.

### 39.1 Τι πήραμε και πώς προσαρμόστηκε

| ιδέα | προσαρμογή στο CoFounderBay | πού |
|---|---|---|
| δομημένη κάρτα ευκαιρίας | **Κάρτα ανάγκης**: μία πρόταση για ό,τι υπάρχει, μία για το αποτέλεσμα, μία για το πρόσωπο που λείπει· προσφορά (ρόλος, equity, ώρες/εβδομάδα, εύρος)· κατηγορία, τόπος, στάδιο, δέσμευση ως πραγματικά φίλτρα. Δένεται σε έργο (`projectRef`) και φέρει **αποδεικτικά από τον χώρο του ίδιου του συντάκτη** (ολοκληρωμένα ορόσημα, έγγραφα Builder ≥80%, εγκεκριμένες συστάσεις, επαληθευμένο email) — όχι αριθμούς βάσης της πλατφόρμας | `packages/shared/src/commitments`, `NeedCard` |
| κλιμάκωση εμπιστοσύνης | **Κλίμακα δέσμευσης** μόνο για θέση συνιδρυτή, ρόλο με equity, σύσταση σε επενδυτή: ενδιαφέρον → προστατευμένη συζήτηση → χωριστή επιβεβαίωση → όροι σε εκδόσεις → συμφωνία. Mentoring και απλές συστάσεις κρατούν τα συνηθισμένα μηνύματα | `/commitments/[id]`, `ThreadWorkspace` |
| χωρίς στοιχεία επικοινωνίας στην πρώτη επαφή | φίλτρο που **αρνείται** (δεν ξαναγράφει) τηλέφωνα, email, συνδέσμους, λογαριασμούς, μετάβαση σε άλλη εφαρμογή και στοιχεία πληρωμής· ρυθμισμένο για Ελλάδα: 69…/21…/+30/0030, Viber, IBAN GR σε ομάδες, «παπάκι», «πάρε με τηλέφωνο». Ποσά, εύρη equity και έτη δεν πιάνονται | `contact.ts` (55 περιπτώσεις στο `commitmentRules.test.ts`) |
| όροι σε εκδόσεις | κάθε ουσιαστική αλλαγή (ρόλος, equity, vesting, cliff, ώρες, εύρος) είναι νέα έκδοση με diff· αλλαγή μόνο στη σημείωση γράφεται στην ίδια· **τρεις αναθεωρήσεις** μετά την πρώτη πρόταση· **πάγωμα** όσο η αίθουσα συμφωνίας είναι ανοιχτή· η πρώτη συζήτηση γίνεται read-only όταν ανοίγουν οι όροι | API + demo, ίδιες συναρτήσεις |
| οδηγός δύο λεπτών | `/commitments/new`: τρεις προτάσεις με παράδειγμα και μετρητή, προσφορά, φίλτρα, ζωντανή προεπισκόπηση, 12 έλεγχοι (11 υποχρεωτικοί, «χωράει σε μία οθόνη» ως συμβουλή), έναρξη από έργο, draft από τον βοηθό· στην επεξεργασία λέει πότε η αλλαγή της προσφοράς γίνεται νέα έκδοση | `PostingGuide` |
| ασφαλής δημόσια κάρτα | `/c/[token]`: όνομα και headline του συντάκτη (όχι ανωνυμία), καμία ταυτότητα χρήστη, έργο, token, email ή τηλέφωνο· `noindex`, Open Graph για LinkedIn· «Εγγραφή για απάντηση» → onboarding → **πίσω στην κάρτα**, όχι σε τοίχο καταχωρίσεων | `c/[token]`, `lib/return-to.ts` |
| καταστάσεις έκβασης | ανοιχτή / σε συζήτηση / συμφωνήθηκε / κλειστή: δίπλα στο στάδιο κάθε έργου, στο σκορ κάθε ταιριάσματος (βήμα της κλίμακας), σε πάνελ δίπλα στην ετοιμότητα στο `/dashboard/founder` | `OutcomeChip`, `StepChip`, `CommitmentOutcomes` |
| πρόταση μη-εγγύησης | «Το CoFounderBay οργανώνει την απόφαση. Δεν υπόσχεται χρηματοδότηση, εισόδημα ή αποδόσεις.» σε 6 επιφάνειες (κάρτα, όροι, έργο, ευκαιρίες, fundraising, διαφάνεια ask του pitch)· επιπλέον ο έλεγχος υποσχέσεων («εγγυημένη απόδοση», «σίγουρο κέρδος», «χωρίς ρίσκο») μπλοκάρει τη δημοσίευση, ενώ το «δεν εγγυόμαστε» περνά | `NonGuaranteeNote`, `promises.ts`, `nonGuarantee.test.ts` |
| ορατότητα 30 ημερών | συμφωνημένα και κλειστά μένουν ορατά 30 ημέρες και μετά πάνε στο Ιστορικό· ανοιχτή κάρτα χωρίς συζήτηση λήγει σε 90 ημέρες (κλείνει ως «έληξε», στην ανάγνωση) | `isInHistory`, `expireQuietCards` |

Δεν αντιγράφηκαν, όπως ζητήθηκε: αριθμοί βάσης ως κοινωνική απόδειξη, πρόγραμμα συνεργατών, τοίχος στη θέση του dashboard/pitch/data room, ανωνυμία.

### 39.2 Τι προσθέσαμε που δεν έχει το πρότυπο

- **Τυφλή αμοιβαία επιβεβαίωση.** Κανείς δεν μαθαίνει το «ναι» του άλλου πριν πουν και οι δύο ναι (ούτε ειδοποίηση, ούτε πεδίο στο payload), άρα κανείς δεν πιέζεται και κανείς δεν μαθαίνει μια σιωπηλή άρνηση. Ανακαλείται μόνο όσο ο άλλος δεν έχει επιβεβαιώσει.
- **Αποδεικτικά από τον ίδιο τον χώρο**, στιγμιότυπο τη στιγμή της δημοσίευσης, αντί για αυτοδηλωμένα.
- **Ένας κανόνας για browser και server.** Ο οδηγός προειδοποιεί όσο γράφει κανείς· το API αρνείται με τα ίδια `kinds` και ελληνικό μήνυμα στο `error.details`· ο demo κόσμος εφαρμόζει τις ίδιες συναρτήσεις, οπότε το demo αρνείται ό,τι και η παραγωγή.
- **Ο βοηθός λειτουργεί όλη την κλίμακα.** Νέες δηλώσεις: `get_commitments` (πού βρίσκεται κάθε κάρτα και απάντηση, τι περιμένει από τον χρήστη), `draft_need_card` (ανοίγει τον οδηγό συμπληρωμένο, δεν αποθηκεύει), `express_interest` (reversal **partial**: ανάκληση μόνο όσο ο συντάκτης δεν έχει απαντήσει, η ειδοποίηση μένει), `close_need_card` (reversal **full**: η επανενεργοποίηση ξαναϋπολογίζει την ίδια έκβαση από ανέγγιχτες απαντήσεις και κρατά τη λήξη). Κάθε κουμπί της κλίμακας είναι και page control με τον ίδιο handler (αποδοχή/απόρριψη/ανάκληση ενδιαφέροντος, επιβεβαίωση με undo την ανάκλησή της, αποδοχή όρων, κλείσιμο αίθουσας, αποχώρηση, κλείσιμο/επανενεργοποίηση/δημόσιος σύνδεσμος). Το eval έγινε 64 περιπτώσεις· οι 4 νέες αποτυγχάνουν χωρίς την αλλαγή του planner.

### 39.3 Ελαττώματα που βρέθηκαν στην πορεία

| εύρημα | συνέπεια | διόρθωση |
|---|---|---|
| οι controllers opportunities, marketplace, learning διάβαζαν `req.user.userId`· το `JwtStrategy` δίνει `req.user.id` | καμία καταχώριση/υπηρεσία/πόρος δεν δημιουργούνταν, και ο συντάκτης δεν μπορούσε να επεξεργαστεί ή να σβήσει το δικό του | `req.user.id`· `author-id.regression.test.ts` αποτυγχάνει χωρίς τη διόρθωση |
| το `/login` ακολουθούσε οποιοδήποτε `redirect` | open redirect (`//host`) | `safeInternalPath` |
| το `/share/` ήταν πίσω από το login | οι share links «για ενδιαφερόμενους χωρίς λογαριασμό» δεν άνοιγαν ποτέ γι' αυτούς | δημόσιο prefix στο middleware |
| οι δυναμικές σελίδες έπαιρναν τίτλο από το `[param]` του registry | δεν έπαιρναν: το fallback έδειχνε τον τίτλο του γονέα | `DYNAMIC_PATTERNS` για `/commitments/*`, `/c/*` |

### 39.4 Όρια και τι μένει

- Τα τέσσερα μοντέλα (`CommitmentCard`, `CommitmentThread`, `CommitmentMessage`, `CommitmentTerms`) είναι schema-only: υπάρχουν μετά το `prisma db push`. Οι δοκιμές API τρέχουν σε βάση στη μνήμη· δεν αποδεικνύουν Postgres.
- Τα έργα ζουν ακόμη στον browser, άρα το `projectRef` είναι id χωρίς foreign key.
- Η «αίθουσα συμφωνίας» είναι κατάσταση (πάγωμα όρων) με σύνδεσμο στο data room· δεν δημιουργεί ακόμη ξεχωριστό data room ανά συμφωνία.
- Το φίλτρο επαφών είναι φίλτρο, όχι εγγύηση: αριθμός γραμμένος ολογράφως περνά.
- Το Open Graph της δημόσιας κάρτας γίνεται συγκεκριμένο μόνο όταν το API είναι προσβάσιμο από τον server του Next· αλλιώς μένει γενικό (και αληθές).
- Ένα dead band στο `/analytics` @390 (πλακίδιο «Νέες συνδέσεις» τεντωμένο στο ύψος του γείτονα, 63px έναντι ορίου 60) και ένα στο `/org/cohorts/cohort-autumn-2026` @1440 προϋπήρχαν: οι σελίδες δεν άλλαξαν σε αυτόν τον γύρο.
- Η e2e σουίτα έπιασε μία φορά το `/discover` (κινητό) με δύο `main#main-content` για μια στιγμή, ενώ φόρτωνε (1.4s)· σε 6 επαναλήψεις δεν επανήλθε. Η σελίδα και το segment της δεν άλλαξαν· πιθανή αιτία η στιγμή που δύο κελύφη συνυπάρχουν κατά το streaming. Δεν διορθώθηκε, καταγράφεται.

### 39.5 Πύλες

| πύλη | αποτέλεσμα |
|---|---|
| tsc web / api | 0 / 0 |
| vitest web / api | **929/929** (112 αρχεία) / **337/337** (27) — +75 web, +38 api |
| scripts | 12/12 |
| αντίθεση θεμάτων | 0 |
| rail-candidates · ai-coverage | 0 υποψήφια · 164 σελίδες, 0 χωρίς αιτιολόγηση |
| production build | επιτυχές (`/commitments` 6.7 kB, `/commitments/[id]` 13.7 kB, `/commitments/new` 6.9 kB, `/c/[token]` 3.8 kB) |
| sweep 165 routes (145 στατικά + 20 δυναμικά) @1440 / @390 | 0 σφάλματα · 0 οριζόντιο scroll · 0 ανώνυμα · 0 κενά εικονίδια |
| clock-probe +50 ημέρες | 165 routes, 0 που πετούν |
| e2e `test:a11y` | **291 passed**, 24 skipped, 1 αποτυχία που δεν επανήλθε (βλ. 39.4)· νέες σαρώσεις: η δημόσια κάρτα χωρίς λογαριασμό (μέσω mock API), οι τέσσερις σελίδες δεσμεύσεων σε demo, και τρεις σε layout κινητού |

### 39.6 Συγχώνευση με το `cursor/ui-upgrade-cloudflare-preview-53e0`

Μετά το `9ad01d7` ο κλάδος του άλλου πράκτορα είχε δύο νέα commits: το `86a7240` (ο έλεγχος fast-forward στο `075f0288`, τώρα §38) και το `987b841` (κουμπιά κινητού 5% κοντύτερα: κάτω από 640px το κατώφλι γίνεται 41.8px αντί για 44px, τα πεδία και τα native select μένουν 44px). Ενώθηκαν με merge και τίποτα δεν απορρίφθηκε. Το μόνο conflict ήταν αυτό το αρχείο: και οι δύο πλευρές έγραψαν §38. Το δικό τους είναι παλαιότερο (11:30 έναντι 15:29) και κρατά το §38, ενώ οι δεσμεύσεις έγιναν §39.

Τρία σημεία μετρούσαν ακόμη 44px για κουμπιά και ευθυγραμμίστηκαν με τη νέα απόφαση, ώστε να μη χτυπούν ψευδώς:

- η e2e `workspace-clarity.spec.ts` (φίλτρο σταδίου στο `/projects`)
- το `.probes/dialog_sweep.mjs` (κουμπί κλεισίματος dialog)
- η γραμμή του `AGENTS.md`

Το `phoneTouchFloor.test.ts` του άλλου κλάδου φυλάει τώρα και το 41.8 και τα πεδία των 44.

Το layout κουμπώνει το 41.8 σε μονάδες 1/64px, άρα το κουμπί μετρά 41.796875. Γι' αυτό η e2e και το probe ζητούν ≥41.75.

Τι ξανατρέξαμε μετά το merge:

| πύλη | αποτέλεσμα |
|---|---|
| tsc web / api | 0 / 0 |
| vitest web / api | 929/929 / 337/337 |
| scripts | 12/12 |
| αντίθεση θεμάτων | 0 |
| e2e στον dev server: `workspace-clarity`, `navigation-chrome`, `phone-layout` | `workspace-clarity`: 47 passed· το 48ο (φίλτρο του `/projects`, κινητό) απέτυχε στο 41.8 και πέρασε όταν ξανατρέξαμε μόνο αυτό με όριο 41.75. Τα άλλα δύο: 33 passed, 22 skipped ανά project |
| μέτρηση @390 στα `/projects`, `/commitments`, `/commitments/need-harbor`, `/commitments/new` | κάθε κουμπί 41.8px, κανένα κάτω από αυτό, 0 οριζόντιο scroll |

Τα πεδία μένουν στο `h-11` (43.5px στην κλίμακα της επιφάνειας). Το ενσωματωμένο «Ρωτήστε το AI» της κεφαλίδας μετρά 41.8 επειδή τεντώνεται στο χάπι του, που ακολουθεί το κατώφλι κουμπιών.

## 40. Γύρος 2026-10-06 (β) — Επανέλεγχος StreetUpper με τη ζωντανή σελίδα, και τα κενά που έμειναν

Η αρχική του `streetupper.com` ανοίχτηκε από αυτό το περιβάλλον (το §37.7 δεν ισχύει πλέον). Επιβεβαιώνει την ανάλυση του χρήστη: τρεις κινήσεις, παράδειγμα κάρτας πριν την εγγραφή, «έλεγχος πριν από τη δημοσίευση», «προστατευμένη ταυτότητα και μηνύματα», «καμία εγγύηση οικονομικής απόδοσης», και αριθμοί που η ίδια η σελίδα ονομάζει «τιμές βάσης εκκίνησης — δεν είναι καταγεγραμμένα σύνολα».

### 40.1 Τι από το §39.1 επαληθεύτηκε ξανά στον κώδικα

Και οι δέκα γραμμές του πίνακα §39.1 υπάρχουν όπως γράφτηκαν: `COMMITMENT_KINDS/STEPS/OUTCOMES`, `MAX_TERMS_REVISIONS = 3`, `SETTLED_VISIBLE_DAYS = 30`, `canReviseTerms` με πάγωμα, φίλτρα `kind/stage/category/commitment/place/q` στο `GET /commitments/cards`, `CommitmentOutcomes` δίπλα στο `VentureReadinessCard`, `/c/[token]` με `noindex`, `NON_GUARANTEE_COPY` σε έξι επιφάνειες, φίλτρο υποσχέσεων.

### 40.2 Τα κενά που έμειναν, και τι έγινε με το καθένα

| κενό | εύρημα | απόφαση |
|---|---|---|
| αριθμοί στην αρχική | `LandingHome.tsx` έδειχνε σταθερές «12,400+ members», «3,200+ connections», «820+ mentors», «95% match accuracy — reported by users», «240+ events», «60+ partners» — χωρίς endpoint, χωρίς ετικέτα. Χειρότερο από τις «τιμές βάσης» του προτύπου, που τουλάχιστον δηλώνονται | δημόσιο `GET /public/stats` με μετρημένα σύνολα και cache· η αρχική δείχνει αριθμούς **μόνο** όταν τους έχει· το «95%» φεύγει γιατί δεν μετριέται από τίποτα |
| η πρώτη υπόσχεση | το hero μιλούσε για matching, μηνύματα, εκδηλώσεις· η κάρτα ανάγκης, που είναι «η μία κίνηση», δεν φαινόταν πουθενά πριν την εγγραφή | ενότητα «Μία κάρτα, τρεις προτάσεις» με ενδεικτική κάρτα (ίδιο `NeedCard`), τρεις κινήσεις, «κατώφλι, όχι ταβάνι», φράση μη-εγγύησης. Τίποτα από την αρχική δεν αφαιρέθηκε |
| πρώτη κίνηση μετά το onboarding | το άδειο πάνελ δεσμεύσεων του dashboard ήταν μόνο κείμενο | κουμπί «Γράψτε την πρώτη κάρτα» → `/commitments/new` |
| αναφορά/αποκλεισμός μέσα στην κλίμακα | το `ReportBlockModal` υπήρχε σε feed, μηνύματα, discover — όχι στο `ThreadWorkspace`, δηλαδή ακριβώς στην προστατευμένη συζήτηση | προστέθηκε εκεί, με context το thread και την κάρτα, ώστε η ουρά του admin να ξέρει από πού ήρθε |
| ανθρώπινος έλεγχος πριν τη δημοσίευση | το πρότυπο περνά κάθε ανάρτηση από ουρά· εμείς όχι | **δεν αντιγράφεται.** Οι 12 έλεγχοι του οδηγού, το φίλτρο υποσχέσεων και το φίλτρο επαφών τρέχουν στον server πριν τη δημοσίευση, στο δευτερόλεπτο· η ουρά θα καθυστερούσε τον ιδρυτή ώρες για να πιάσει ό,τι πιάνουν ήδη οι κανόνες. Ο άνθρωπος μπαίνει *μετά*, από την αναφορά της προηγούμενης γραμμής |

Δεν αντιγράφηκαν, όπως και πριν: αριθμοί βάσης ως κοινωνική απόδειξη, πρόγραμμα συνεργατών, ανωνυμία, τοίχος αντί για dashboard/pitch/data room.

## 41. Σύγκριση με το LinkedIn (2026-10-07)

Πλήρες κείμενο: `docs/LINKEDIN_COMPARISON.md`. Από αυτό το περιβάλλον το linkedin.com είναι μπλοκαρισμένο. Η εικόνα του LinkedIn βγαίνει από πηγές σε τρεις βαθμίδες (πρωτογενείς, τύπος, blogs), και η εικόνα του CoFounderBay από τον κώδικα στο `00ace42`. Τα ευρήματα ξαναελέγχθηκαν στο `aefb5fc`.

Τρία ευρήματα αφορούν τον κώδικα και όχι τη στρατηγική:

1. Η σύνδεση με LinkedIn ζητά `r_liteprofile` / `r_emailaddress` (`passport-linkedin-oauth2@2.0.0`). Αυτά τα scopes δεν δίνονται σε εφαρμογές LinkedIn που δημιουργήθηκαν μετά την 1/8/2023. Χρειάζεται OpenID Connect.
2. Η σύγκριση κλήσεων client με routes server βρίσκει 19 κλήσεις χωρίς route σε 5 λειτουργίες που δουλεύουν μόνο στο demo: αποθηκευμένες αναζητήσεις, feed, δημόσιο pitch, `/api/v1/search` και AI του research canvas. Υπάρχουν ακόμη 2 σε νεκρό κώδικα του builder. Το follow είναι μοντέλο χωρίς endpoint και χωρίς UI.
3. Το `/p/[username]` δεν έχει metadata ή Open Graph, οπότε η κοινοποίησή του στο LinkedIn δεν δείχνει προεπισκόπηση.

Η πρόταση είναι να μην ανταγωνιστούμε το γράφημα του LinkedIn. Το χρησιμοποιούμε για ταυτότητα (Verified on LinkedIn, Member Data Portability API του DMA) και για διανομή (κοινοποιήσιμες κάρτες), και κρατάμε τη συμφωνία ως δικό μας έδαφος. Η σειρά υλοποίησης είναι στο §9 του κειμένου.

## 42. Έλεγχος 2026-10-07 — fast-forward στο `1295670c`, πλάνο για κάθε σελίδα, component, modal, button

### 42.1 Git — καμία παράλειψη

`git fetch origin --prune` στις 2026-10-07, από το `987b8411` (κουμπιά κινητού 5% κοντύτερα). Το `origin/claude/project-audit-upgrade-y2ebnr` (`1295670c`) είναι αυστηρός απόγονος: 23 commits έξω από το προηγούμενο HEAD, 0 commits εκείνου του HEAD έξω από το Claude. Έγινε `git merge --ff-only`. Μετά, κάθε remote head έχει **0** commits έξω από το HEAD:

| remote | SHA | commits έξω από το HEAD |
|---|---|---|
| `claude/project-audit-upgrade-y2ebnr` | `1295670c` | 0 |
| `cursor/ui-upgrade-cloudflare-preview-53e0` | `987b8411` πριν το ff· το tip αυτού του ελέγχου είναι το `1295670c` | 0 |
| `cursor/phone-component-sizes-53e0` | `477ca958` | 0 |
| `integration/ai-platform-upgrade` | `0e792ce7` | 0 |
| `cursor/ai-os-fullpage-chat-53e0` | `7ce1fe32` | 0 |
| `main` | `91d6ea3a` | 0 · το `1295670c` είναι 449 commits μπροστά· οι σημειώσεις αυτού του ελέγχου κάθονται από πάνω |

Τα 23 commits, από το νεότερο: `1295670c` εισαγωγή προφίλ από LinkedIn, `8cb2b03d` προοδευτική επαλήθευση, `167e03b1` πέντε λειτουργίες που ήταν μόνο demo, `f15a15bb` σύνδεση LinkedIn με OpenID Connect, `febdc7df` και `06994f7f` η σύγκριση LinkedIn, `aefb5fca` δακτύλιοι, `9743fb30` μία ανατομία συνεδρίας, `f5a542b5` ένα κατάστημα συνεδριών mentoring, `c9388979` ταίριασμα σε πλατιά οθόνη, `f3764f87` αλήθεια στην αρχική και αναφορά μέσα στη σκάλα, `00ace42a` ένα `main#main-content`, `9ad65e37` φίλτρο επαφών για τηλέφωνα ολογράφως, `fa724557` dead bands, `0cde27e0` διπλό import στο discover, `6478c428` έλεγχος συγχώνευσης, `a8383a11` i18n, `07b2f884` συγχώνευση του `987b8411`, `9ad01d75` δεσμεύσεις μέρος 4, `73a7c8a8` διπλά κλειδιά μετάφρασης, `6ef25777` μέρος 3, `a3bfd78b` μέρος 2, `c4d25b91` μέρος 1. Δεν υπάρχει δεύτερο tip. Το April `main` δεν ενώθηκε.

### 42.2 Ξαναμέτρηση στο `1295670c`

Ίδια τομή με το §38 (`<Button`, `<button`, αρχεία `.tsx`).

| αντικείμενο | §38 (`075f0288`) | τώρα | διαφορά |
|---|---:|---:|---|
| `page.tsx` | 160 | **164** | + `/commitments`, `/commitments/new`, `/commitments/[id]`, `/c/[token]` |
| `components/**/*.tsx` | 264 | **286** | +22 από το §38· +25 ονόματα που δεν είναι στον κατάλογο του §30.5, καμία διαγραφή· το `NotificationCenter.tsx` υπάρχει και στο `common` και στο `notifications` |
| `<Button>` | 1323 | **1380** | +57, μέσα στις δεσμεύσεις, την επαλήθευση και την εισαγωγή |
| native `<button>` | 581 | **585** | +4 |
| αρχεία με `DialogContent` ή `SheetContent` | 59 | **60** | + `LinkedInImportDialog.tsx` |

Κάλυψη σελίδων, χωρίς παράλειψη. Οι 145 στατικές `page.tsx` και οι 145 γραμμές του `scripts/platform-sweep-routes.txt` είναι το ίδιο σύνολο URL. Οι τέσσερις σελίδες κάτω από `(auth)` είναι τα `/login`, `/register`, `/forgot-password`, `/reset-password` της λίστας· δεν λείπει στατική διαδρομή. Οι δυναμικές `page.tsx` είναι 19 πρότυπα. Το `scripts/platform-sweep-dynamic.txt` έχει 20 γραμμές: και τα 19 πρότυπα έχουν τουλάχιστον ένα demo id, και το `/commitments/[id]` ανοίγει δύο φορές (`need-harbor`, `need-athens-intros`). 145 + 19 = 164.

Ο κατάλογος του §30.6 καλύπτει τις 160. Οι τέσσερις νέες μπαίνουν στον πίνακα του 42.7. Η στήλη «επόμενο» του §30.6 που έλεγε «ένταξη στο sweep 390» είναι παλιά: το §39.5 κατέγραψε sweep 165 διαδρομών. Αυτό το τμήμα δεν το ξαναέτρεξε.

### 42.3 Τι έκλεισε στον κώδικα και δεν ξανανοίγει

Διαβάζεται στο δέντρο αυτού του tip. Δεν είναι νέα εκτέλεση των πυλών του §39.5.

- Δεσμεύσεις, κάρτα ανάγκης, οδηγός, δημόσια κάρτα, φράση μη-εγγύησης, βοηθός στην σκάλα: §39 και §40.
- Το φίλτρο επαφών πιάνει τηλέφωνα ολογράφως, αγγλικά και ελληνικά (`9ad65e37`). Η γραμμή του §39.4 που έλεγε το αντίθετο δεν ισχύει πια.
- Τα dead bands του §39.4 έχουν commit (`fa724557`). Αυτή η ώρα δεν τα ξαναμέτρησε, άρα δεν τα ξανανοίγει.
- Το διπλό `main#main-content` έχει commit εγγύησης (`00ace42a`). Το flaky του §39.4 δεν ξανανοίγει χωρίς νέα μέτρηση.
- Σύνδεση LinkedIn: `LINKEDIN_SCOPES` είναι `openid`, `profile`, `email`, και το μέλος διαβάζεται από `/v2/userinfo` (`linkedin.strategy.ts`). Τα `r_liteprofile` / `r_emailaddress` δεν ζητιούνται.
- Οι πέντε λειτουργίες του §4.2 στο `docs/LINKEDIN_COMPARISON.md` έχουν controller: `saved-searches`, `feed`, `pitch` (`public`, `view`, `contact`), `search` στο `/api/search`, και `research` `ai/extract`, `ai/connections`, `ai/synthesize`, `ai/questions`, `ai/chat`.
- Προοδευτική επαλήθευση και εισαγωγή προφίλ: `verification.controller.ts`, `profile-import.controller.ts`, `VerificationCard`, `LinkedInImportDialog`.
- Αρχική: αριθμοί μόνο από `GET /public/stats` (`LiveStats`). Η ενότητα της μία κάρτας είναι στο §40.2.
- Mentoring: οι δύο αποθήκες διαβάζονται ως μία λίστα (`f5a542b5`).

Μένει, και είναι το πλάνο παρακάτω, όχι παράλειψη καταλόγου.

### 42.4 Κάθε button

Η σύμβαση variant του §30.3 ισχύει για καθένα από τα 1380 `<Button>` και για τα 585 native `<button>` όταν φορούν τις κλάσεις του floor. Δεν προστίθεται variant. Δεν ξαναγράφονται τα call sites.

Το ύψος άλλαξε μόνο κάτω από 640px, στο `987b8411`, και είναι ήδη μέσα σε αυτό το tip. Ο πίνακας μεγεθών του §30.3 που γράφει 44px για το τηλέφωνο είναι παλιός. Το ζωντανό κατώφλι είναι **41.8px** (44 × 0.95). Το layout το κουμπώνει σε 41.796875· ο έλεγχος ζητά ≥41.75.

| τι | κάτω από 640px | από 640px και πάνω |
|---|---|---|
| `button` / `a` / `[role=tab]` / `[role=button]` με `h-7`…`h-12`, `min-h-7`…`min-h-12`, `min-h-[44px]` | ύψος αυτόματο, `min-height: 41.8px` | οι κλάσεις σημαίνουν ό,τι λένε· το desktop μένει root 82% |
| τετράγωνα `w-7`…`w-11`, `min-w-[44px]`, και τα ζεύγη `h-10.w-10` / `h-11.w-11` / `h-12.w-12` | 41.8 × 41.8 | αμετάβλητα |
| `.tap-target-phone` | 41.8 × 41.8 | — |
| `select`, `.tap-target-y`, αυτόνομα πεδία `h-11` | 44px· το input στο `@layer base` είναι 16.16px ώστε το iOS να μην κάνει zoom | αμετάβλητα |
| κάτω μενού `[data-mobile-tabs]` | γράμματα 12.74px, ύψος `min-h-[3.75rem]`· δεν κόντυνε | `sm:hidden` |
| variant `link` | εκτός ύψους, όπως στο §30.3 | εκτός |

Το «Ρωτήστε το AI» της κεφαλίδας μετρά 41.8 επειδή τεντώνεται στο χάπι, όχι επειδή το πεδίο έγινε κουμπί.

Επόμενο, ένα, για όλα τα κουμπιά: όποιος γράψει φρουρό ύψους ζητά ≥41.75 κάτω από 640px, όχι 44. Ένα native `button` με ύψος εκτός της λίστας (`h-6`, arbitrary) μπορεί ακόμη να ξεφύγει· αυτό είναι το μόνο άνοιγμα, και κλείνει με τον ίδιο φρουρό, όχι με νέα κλίμακα. Δεν γυρίζει το κατώφλι στα 44px.

### 42.5 Κάθε modal και sheet

Νέο dialog περνά από `DialogContent` ή `SheetContent`, ώστε να πιάνει το `use-return-focus.ts`. Τα 60 αρχεία αυτής της τομής:

| αρχείο | επόμενο |
|---|---|
| `apps/web/src/app/admin/billing/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/admin/communities/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/admin/feature-flags/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/admin/programs/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/admin/reports/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/admin/taxonomy/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/admin/user-management/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/data-room/[id]/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/discover/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/groups/components/CreateGroupModal.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/jobs/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/matches/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/mentoring/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/messages/ComposeMessageDialog.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/opportunities/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/org/[slug]/admin/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/org/applications/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/pitch/[id]/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/programs/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/provider/projects/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/provider/services/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/recommendations/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/research/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/saved-searches/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/tenant/members/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/app/tenant/programs/page.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/auth/TwoFactorManagement.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/builder/BranchPanel.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/builder/BuilderWorkspace.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/builder/CollabToolbar.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/builder/ReviewPanel.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/builder/VersionHistoryDrawer.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/collaboration/CollaborationStarter.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/common/CommandPalette.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/common/ConnectionRequest.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/common/KeyboardShortcutsDialog.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/common/ReportBlockModal.tsx` | υπάρχει και στο `ThreadWorkspace`· το context κρατά το thread και την κάρτα |
| `apps/web/src/components/common/ScheduleCallModal.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/discover/SearchFilters.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/endorsements/GiveEndorsementDialog.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/feed/CreatePost.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/layout/MobileNav.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/layout/PageRail.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/mentoring/SessionDialogs.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/messaging/ConversationValidation.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/profile/LinkedInImportDialog.tsx` | προτείνει πεδία· αποθήκευση μόνο με υποβολή του ανθρώπου |
| `apps/web/src/components/research/BoardHistoryDrawer.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/research/BoardSettingsPanel.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/research/BoardTemplates.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/research/CanvasVersionPanel.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/research/EntityReferenceSelector.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/research/ResearchNodeViewer.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/ui/confirm-dialog.tsx` | από εδώ περνά κάθε destructive· δεν μπαίνει μόνο του σε λίστα |
| `apps/web/src/components/ui/dialog.returnFocus.test.tsx` | τεστ επιστροφής focus· όχι επιφάνεια |
| `apps/web/src/components/ui/dialog.tsx` | primitive· το κλείσιμο είναι `h-11 w-11`, άρα 41.8px στο τηλέφωνο |
| `apps/web/src/components/ui/export-dialog.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/ui/image-cropper.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/ui/rich-text-editor.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/ui/share-modal.tsx` | η σύμβαση του §30.4· στο τηλέφωνο το κλείσιμο μετρά 41.8px και ο έλεγχος ζητά ≥41.75 |
| `apps/web/src/components/ui/sheet.tsx` | primitive· το κλείσιμο είναι `h-11 w-11`, άρα 41.8px στο τηλέφωνο |

### 42.6 Κάθε component

Τα 261 αρχεία του §30.5 είναι όλα στον δίσκο. Κληρονομούν το 42.4 και το 42.5. Δεν ξανασχεδιάζονται. Οι φάκελοι, με το πλήθος `.tsx` αυτού του tip:

| φάκελος | αρχεία | επόμενο |
|---|---:|---|
| `common` | 56 | το `KeyboardShortcutsDialog` είναι το +1 από το §35· κανένα νέο οπτικό |
| `ui` | 40 | primitives· το floor είναι 41.8, όχι νέο variant |
| `research` | 34 | τα κουμπιά ανάλυσης έχουν πλέον route στον server· κανένα νέο οπτικό |
| `layout` | 24 | το κάτω μενού μένει 3.75rem· το desktop μένει 82% |
| `builder` | 19 | + `PitchPublication`· ο βοηθός δεν γράφει στον καμβά |
| `commitments` | 12 | νέα οικογένεια· το επόμενο είναι το `prisma db push`, όχι άλλη κάρτα |
| `dashboard` | 11 | τα νούμερα μένουν αναγνώσεις· το πάνελ εκβάσεων κάθεται δίπλα στην ετοιμότητα |
| `gamification` | 10 | κανένα οπτικό |
| `ai` | 9 | κανένα chrome |
| `admin` | 5 | destructive μόνο μέσω `confirm-dialog` |
| `feed` | 5 | ο controller υπάρχει· το δείγμα μένει δείγμα στο demo |
| `providers` | 5 | κανένα, όσο το marketplace δηλώνει δείγμα |
| `auth` | 4 | ο βοηθός δεν αγγίζει μυστικά |
| `messaging` | 4 | κανένα αυτόνομο DM |
| `mentoring` | 4 | + `BookingCard`, `SessionDateTile`· δεν ενώνεται το ημερολόγιο |
| `profile` | 3 | + εισαγωγή LinkedIn· πρόταση, όχι σιωπηλή αποθήκευση |
| `settings` | 3 | + `VerificationCard`· το κατώφλι είναι οι όροι |
| `video` | 3 | κανένα νέο transport |
| `workspace` | 3 | ίδιο chrome με τις σελίδες εργασίας |
| `behavioral` | 2 | κανένα |
| `canvas` | 2 | ο φρουρός ύψους, αν γραφτεί, ζητά 41.8 |
| `discover` | 2 | το sheet μένει στο 42.5 |
| `endorsements` | 2 | το write μένει partial με reversal |
| `icons` | 2 | το glyph `default` κρατά τη σκηνή του σήματος (§36.7)· απόφαση, όχι παράλειψη |
| `landing` | 2 | `LiveStats` δείχνει αριθμό μόνο όταν απαντά το endpoint |
| `members` | 2 | κανένα |
| `messages` | 2 | κανένα |
| `social` | 2 | η πρόσκληση μένει ανθρώπινη |
| `activity` | 1 | κανένα |
| `analytics` | 1 | κανένα hex έξω από το allowlist |
| `billing` | 1 | καμία πληρωμή από τον βοηθό |
| `brand` | 1 | κανένα |
| `charts` | 1 | tokens |
| `chat` | 1 | ο φρουρός ύψους, αν γραφτεί, ζητά 41.8 |
| `collaboration` | 1 | το dialog είναι στον 42.5 |
| `events` | 1 | κανένα |
| `notifications` | 1 | δεύτερο αρχείο με το ίδιο όνομα, δίπλα σε αυτό του `common` |
| `optimization` | 1 | κανένα |
| `recommendations` | 1 | δεν συγχωνεύεται με το `/matches` |
| `search` | 1 | `AdvancedSearch` δεν το εισάγει σελίδα και καλεί `/api/v1/search`· όταν αγγιχτεί, δείχνει το `/api/search` ή φεύγει |
| `shared` | 1 | κανένα |
| `theme` | 1 | δεν αλλάζει το primary hue |

Τα 25 αρχεία που δεν είναι στον κατάλογο του §30.5, ένα προς ένα:

| αρχείο | επόμενο |
|---|---|
| `AppShellFrame.test.tsx` | τεστ· όχι επιφάνεια |
| `ApplicationGenerator.test.tsx` | τεστ· όχι επιφάνεια |
| `BookingCard.tsx` | μία ανατομία συνεδρίας στις σελίδες mentoring |
| `CommitmentLadder.tsx` | τα κουμπιά της σκάλας είναι και page controls, με τον ίδιο handler |
| `CommitmentOutcomes.test.tsx` | τεστ· όχι επιφάνεια |
| `CommitmentOutcomes.tsx` | δίπλα στην ετοιμότητα· δεν υπόσχεται απόδοση |
| `ContactWarning.tsx` | δείχνει την άρνηση· δεν ξαναγράφει το μήνυμα |
| `KeyboardShortcutsDialog.tsx` | ήδη σημειωμένο στο §35· τώρα και στη λίστα του 42.5 |
| `LinkedInImportDialog.test.tsx` | τεστ· όχι επιφάνεια |
| `LinkedInImportDialog.tsx` | πρόταση προφίλ από αρχείο εξαγωγής ή από το API φορητότητας |
| `LiveStats.test.tsx` | τεστ· όχι επιφάνεια |
| `LiveStats.tsx` | αριθμοί μόνο από `GET /public/stats` |
| `NeedCard.tsx` | τρεις προτάσεις· δεν γίνεται τοίχος στη θέση του dashboard |
| `NeedCardsSection.tsx` | φίλτρα όσα δέχεται το `GET /commitments/cards` |
| `NonGuaranteeNote.tsx` | η φράση μένει στις έξι επιφάνειες του §39.1 |
| `OutcomeChip.tsx` | η έκβαση γράφεται ως λέξη |
| `PitchPublication.tsx` | δημοσίευση pitch πάνω στον controller που μπήκε στο `167e03b1` |
| `ProjectNeedCard.tsx` | `projectRef` χωρίς foreign key, όσο τα έργα ζουν στον browser |
| `SessionDateTile.tsx` | διαβάζει την ίδια λίστα συνεδριών με το `BookingCard` |
| `ThreadWorkspace.tsx` | αναφορά/αποκλεισμός μέσα στη συζήτηση· η αίθουσα είναι κατάσταση συν σύνδεσμος data room |
| `VerificationCard.test.tsx` | τεστ· όχι επιφάνεια |
| `VerificationCard.tsx` | email εργασίας και Verified on LinkedIn, ως κατώφλι των όρων |
| `VerifiedBadge.tsx` | τεκμήριο, όχι σήμα δημοφιλίας |
| `commitments.test.tsx` | τεστ· όχι επιφάνεια |
| `dialog.returnFocus.test.tsx` | τεστ· όχι επιφάνεια |

### 42.7 Κάθε σελίδα

Οι 164 διαδρομές. Η στήλη είναι το ένα επόμενο βήμα. «Η σύμβαση ισχύει» σημαίνει ότι ο τύπος κινητού, το 41.8 και τα dialogs δεν ξανανοίγουν. Δεν ανοίγουν Feed Prisma ως νέο σχέδιο, ένωση ημερολογίου, μοντέλα fundraising, δημιουργία αγγελίας, ή συγχώνευση `/matches` με `/recommendations`.

| route | επόμενο |
|---|---|
| `/` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/achievements` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/activity` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/analytics` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/audit-log` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/automations` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/billing` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/communities` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/admin/community-management` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/content-moderation` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/dashboard` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/domains` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/feature-flags` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/mentorship-management` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/programs` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/admin/reports` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/security-monitoring` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/sso` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/admin/system-settings` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/admin/taxonomy` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/tenants` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/user-detail/[id]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/admin/user-management` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/admin/users` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/ai` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/ai/capabilities` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/analytics` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/api-status` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/auth/oauth-callback` | χειραψία ή `/demo`· το middleware θέτει τα τρία cookies και γυρίζει στο `/dashboard/founder` |
| `/auth/sso-complete` | χειραψία ή `/demo`· το middleware θέτει τα τρία cookies και γυρίζει στο `/dashboard/founder` |
| `/auth/verify-email` | χειραψία ή `/demo`· το middleware θέτει τα τρία cookies και γυρίζει στο `/dashboard/founder` |
| `/builder` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/builder/applications` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/builder/pitch-deck` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/c/[token]` | δημόσια κάρτα με `noindex` και Open Graph· το OG γίνεται συγκεκριμένο μόνο όταν το API φαίνεται από τον server του Next |
| `/calendar` | μένει `SampleDataNotice`· δεν ενώνεται με τα bookings του mentoring |
| `/coaching` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/commitments` | η σκάλα είναι στον κώδικα· τα μοντέλα μένουν schema-only μέχρι `prisma db push`· το `projectRef` δεν είναι foreign key· η αίθουσα συμφωνίας είναι κατάσταση και σύνδεσμος στο data room |
| `/commitments/[id]` | η σκάλα είναι στον κώδικα· τα μοντέλα μένουν schema-only μέχρι `prisma db push`· το `projectRef` δεν είναι foreign key· η αίθουσα συμφωνίας είναι κατάσταση και σύνδεσμος στο data room |
| `/commitments/new` | η σκάλα είναι στον κώδικα· τα μοντέλα μένουν schema-only μέχρι `prisma db push`· το `projectRef` δεν είναι foreign key· η αίθουσα συμφωνίας είναι κατάσταση και σύνδεσμος στο data room |
| `/compare` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/connections` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/dashboard` | ανακατεύθυνση· κανένα οπτικό |
| `/dashboard/founder` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/dashboard/incubator` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/dashboard/investor` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/dashboard/mentor` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/dashboard/provider` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/data-room/[id]` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/demo` | χειραψία ή `/demo`· το middleware θέτει τα τρία cookies και γυρίζει στο `/dashboard/founder` |
| `/discover` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/endorsements` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/events` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/events/[id]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/events/create` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/expert-reviews` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/feed` | ο controller `feed` υπάρχει· η σελίδα κρατά `SampleDataNotice` στο demo· επόμενο είναι εγγραφή έξω από demo, όχι νέο μοντέλο |
| `/forgot-password` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/fundraising` | μένει δείγμα· δεν εφευρίσκονται μοντέλα γύρου |
| `/groups` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/groups/[groupId]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/groups/manage` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/groups/moderation` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/help` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/investor/analytics` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/investor/dashboard` | ανακατεύθυνση· κανένα οπτικό |
| `/investor/pipeline` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/investor/portfolio` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/investor/scouting` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/investor/watchlist` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/investors` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/invite` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/jobs` | δεν ανοίγει route δημιουργίας αγγελίας· δεν εφευρίσκεται σε αυτόν τον κύκλο |
| `/learning` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/login` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/marketplace` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/matches` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/matches/[userId]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/matches/compare` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/members` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/mentor/availability` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/mentor/dashboard` | ανακατεύθυνση· κανένα οπτικό |
| `/mentor/earnings` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/mentor/mentees` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/mentor/profile` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/mentor/requests` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/mentor/reviews` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/mentor/sessions` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/mentoring` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/messages` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/milestones` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/milestones/new` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/notifications` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/onboarding` | ανακατεύθυνση· κανένα οπτικό |
| `/opportunities` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/org/[slug]` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/org/[slug]/admin` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/org/analytics` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/applications` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/cohorts` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/cohorts/[id]` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/org/dashboard` | ανακατεύθυνση· κανένα οπτικό |
| `/org/events` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/members` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/mentors` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/programs` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/org/settings` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/org/startups` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/p/[username]` | λείπει `generateMetadata` και Open Graph· η κοινοποίηση δεν έχει προεπισκόπηση |
| `/pitch/[id]` | τα `public` / `view` / `contact` υπάρχουν στον server· λείπει Open Graph, όπως στο δημόσιο προφίλ |
| `/pricing` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/privacy` | νομικό κείμενο· το πού τρέχει το AI και ότι δεν υπάρχει στοχευμένη διαφήμιση είναι απόφαση κειμένου του ιδιοκτήτη, όχι αλλαγή οθόνης |
| `/profile` | το `LinkedInImportDialog` προτείνει πεδία από εξαγωγή ή από το API φορητότητας· αποθήκευση μόνο με υποβολή |
| `/profile/edit` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/profiles/[userId]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/programs` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/programs/[id]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/projects` | τα έργα ζουν στον browser· γι’ αυτό το `projectRef` των καρτών δεν έχει foreign key· δεν εφευρίσκεται projects API εδώ |
| `/projects/[projectId]` | τα έργα ζουν στον browser· γι’ αυτό το `projectRef` των καρτών δεν έχει foreign key· δεν εφευρίσκεται projects API εδώ |
| `/projects/create` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/provider/analytics` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/provider/dashboard` | ανακατεύθυνση· κανένα οπτικό |
| `/provider/inquiries` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/provider/profile` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/provider/projects` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/provider/reviews` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/provider/services` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/readiness` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/recommendations` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/referrals` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/register` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/reputation` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/research` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/research/[boardId]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/research/canvas` | ανακατεύθυνση· κανένα οπτικό |
| `/reset-password` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/saved-searches` | τα πέντε routes του client υπάρχουν στον server, μαζί με `run`· δεν ισχυρίζεται αυτός ο έλεγχος ότι φεύγει εβδομαδιαία ειδοποίηση |
| `/search` | η σελίδα καλεί `/api/search`· το αχρησιμοποίητο `AdvancedSearch` καλεί ακόμη `/api/v1/search` |
| `/settings` | το `VerificationCard` ζητά email εργασίας και Verified on LinkedIn για να ανοίξουν οι όροι, όχι για να δηλωθεί ενδιαφέρον |
| `/settings/ai` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/settings/billing` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/settings/data-export` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/settings/notifications` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/share/[token]` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/shortlist` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/startups/[id]` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/t/[slug]` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/tenant/analytics` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/tenant/api-keys` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/tenant/automation` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/tenant/billing` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/tenant/branding` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/tenant/dashboard` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/tenant/domains` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/tenant/members` | η σύμβαση του 42.4 και του 42.5 ισχύει ήδη· επόμενο κοινό είναι η εγγραφή έξω από demo, με αποτυχία που φαίνεται |
| `/tenant/programs` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/tenant/settings` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/tenant/sso` | φόρμα του ανθρώπου· ο βοηθός δεν γεμίζει μυστικά και δεν αλλάζει SSO ή πληρωμή |
| `/tenant/webhooks` | μένει `SampleDataNotice`· δεν εφευρίσκεται πηγή αλήθειας |
| `/terms` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/test-onboarding` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/themes/alliance` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |
| `/unauthorized` | δημόσια ανάγνωση· η σύμβαση τύπου και κουμπιού ισχύει· κανένα νέο οπτικό |

### 42.8 Σειρά που μένει

| σειρά | δουλειά | αποδοχή | ρητά εκτός |
|---|---|---|---|
| 1 | `prisma db push` για τα μοντέλα `Commitment*` | εγγραφή που αποτυγχάνει στη βάση φαίνεται ως αποτυχία· τα tests σε μνήμη δεν μετρούν ως Postgres | δεν σχεδιάζεται δεύτερο data room ανά συμφωνία σε αυτό το βήμα· η αίθουσα μένει κατάσταση και σύνδεσμος |
| 2 | εγγραφή έξω από demo cookies, σε κάθε σελίδα που γράφει | το toast δεν μετρά ως απόδειξη | τα sweeps μένουν σε demo μέχρι να υπάρξει αυτή η διαδρομή |
| 3 | Open Graph στο `/p/[username]` και στο `/pitch/[id]` | κοινοποίηση με τίτλο και περιγραφή, χωρίς email, τηλέφωνο, id ή token | η κάρτα `/c/[token]` το έχει ήδη |
| 4 | endpoint και UI για το μοντέλο `UserFollow`, ή ρητή αφαίρεση του μοντέλου | δεν μένει μοντέλο χωρίς δρόμο | οι ενημερώσεις ιδρυτή δεν ξεκινούν πριν από αυτό |
| 5 | το `AdvancedSearch` να καλεί `/api/search` ή να φύγει | καμία κλήση προς `/api/v1/search` | η σελίδα `/search` δεν είναι η σπασμένη διαδρομή· εκείνη καλεί ήδη `/api/search` |
| 6 | τα κύματα 3–6 του `docs/LINKEDIN_COMPARISON.md` §9 | κάθε υιοθέτηση κρίνεται από το αν φέρνει ομάδες σε συμφωνημένους όρους | το κύμα 0 και το κύμα 1 είναι ήδη στον κώδικα· δεν ξαναγράφονται |
| 7 | κείμενο πολιτικής απορρήτου | λέει ό,τι κάνει ο κώδικας για το AI και για τη διαφήμιση | είναι απόφαση του ιδιοκτήτη· δεν τη γράφει αυτός ο κύκλος |

Δεν αλλάζει σε κανένα βήμα: η κλίμακα ανάγνωσης κινητού (caption 13.31, meta 14.7, body 15.21, lead 14.75, figure 16.66, section 15.29, title 16.48), το ότι στο τηλέφωνο το `text-lg` είναι μικρότερο από το `text-base` και η ιεραρχία είναι βάρος (§37.8), το 41.8, τα πεδία 44px / 16.16px, το κάτω μενού, το tablet, το desktop 82%.

### 42.9 Τι δεν αποδεικνύει αυτό το τμήμα

Δεν ξαναέτρεξαν typecheck, vitest, contrast, το static sweep, το dynamic sweep, το dialog sweep ή η σουίτα προσβασιμότητας. Τα 929/929, 337/337 και το sweep 165 διαδρομών είναι το §39.5, σε προγενέστερο tip της ίδιας γραμμής, όχι εκτέλεση αυτής της ώρας. Η απογραφή 164 / 286 / 1380 / 585 / 60 έγινε με ανάγνωση του δέντρου στο `1295670c`. Οι controllers του 42.3 διαβάστηκαν· δεν κλήθηκαν με φορτίο. Το `/demo` επιβεβαιώθηκε με cookie jar, τοπικά και μέσα από το quick tunnel: 307, τα cookies `cfb_session=preview-demo`, `cfb_preview_demo=1`, `cfb_primary_role=existing_founder`, και 200 στο `/dashboard/founder`. Το `/commitments` απάντησε 200 με τα ίδια cookies. Το quick tunnel πεθαίνει· το ενεργό την ώρα αυτού του ελέγχου είναι `https://son-rapidly-rehabilitation-packets.trycloudflare.com/demo`.

## 43. Υλοποίηση της σύγκρισης με το LinkedIn (2026-10-07)

Ο χρήστης επικόλλησε την ενότητα «Τι να υιοθετήσουμε και πώς να το κάνουμε δικό μας» του §41 ως εντολή υλοποίησης. Έγινε σε επτά κύματα, το καθένα με δικό του commit, όλα στο `claude/project-audit-upgrade-y2ebnr`. Καμία προϋπάρχουσα λειτουργία δεν αφαιρέθηκε: όπου άλλαξε κάτι υπάρχον (endorsements, matching, αναζήτηση, κάρτα ανάγκης), η αλλαγή είναι προσθετική και τα παλιά δεδομένα δουλεύουν όπως πριν.

### 43.1 Από το αίτημα στον κώδικα

| αίτημα του χρήστη | τι υπάρχει τώρα | πού |
|---|---|---|
| Σύνδεση LinkedIn με OpenID Connect | scopes `openid profile email`, `/v2/userinfo`· λογαριασμός με ίδιο email συνδέεται μόνο αν το LinkedIn δηλώνει το email επαληθευμένο | `auth/strategies/linkedin.strategy.ts` |
| Οι πέντε λειτουργίες χωρίς endpoint | αποθηκευμένες αναζητήσεις με ειδοποιήσεις, εξατομικευμένο feed, δημόσιο pitch, `/api/search`, AI του research canvas | §41 κύμα 0b |
| «Verified on LinkedIn», βαθμιαία | εταιρικό email (κωδικός hashed, 15′, 5 προσπάθειες), Verified on LinkedIn (`r_verify`, μόνο κατηγορίες), επαληθευμένος ρόλος· ζητείται **μόνο** για όρους και deal room, όχι για ενδιαφέρον | `shared/verification`, `api/verification`, Settings |
| Εισαγωγή προφίλ μέσω DMA | ZIP/CSV εξαγωγής που διαβάζεται στον browser, ή DMA portability API (πρόχειρο 15′, διαβάζεται μία φορά)· τίποτα δεν αποθηκεύεται χωρίς «Αποθήκευση» | `lib/linkedin-import`, `api/profile-import` |
| Κοινοποιήσιμα με σωστή προεπισκόπηση | Open Graph για `/p/[username]`, `/pitch/[id]`, `/u/[token]`, `/c/[token]`· ορόσημο → ενημέρωση | segment `layout.tsx` |
| Ενημερώσεις ιδρυτή | follow (πρώτη χρήση του `UserFollow`), ενημερώσεις σε ακολούθους ή δημόσιες με σύνδεσμο για LinkedIn, φίλτρο υποσχέσεων, σημείωση μη-εγγύησης | `/updates`, `/u/[token]` |
| Ιδιωτικό σήμα «Ανοιχτός σε» | συνίδρυση / συμβουλευτικός / angel / μέντορας· ορατότητα: κανείς (προεπιλογή), επαληθευμένοι, όλοι· γραμμή στο προφίλ, **ποτέ πλαίσιο**· λήγει στις 90 ημέρες· ανεβάζει έως 0,08 στο matching και ονομάζεται μόνο όπου επιτρέπεται | `shared/open-to`, `api/open-to`, Settings |
| Ζεστές συστάσεις μέσω της σκάλας | διαδρομές μέσω συνδέσεων, καθοδήγησης, κοινού κύκλου· ο ενδιάμεσος προωθεί ή όχι (η άρνηση δεν εξηγείται και δεν φτάνει στον τρίτο)· η αποδοχή είναι ενδιαφέρον στην κάρτα ανάγκης του ιδρυτή | `shared/intros`, `api/intros`, `/intros` |
| Συστάσεις από επαληθευμένη σχέση | ετικέτα «Συνεργάστηκαν: συμφωνημένοι όροι / συνεδρία καθοδήγησης / ίδιος κύκλος» όταν η πλατφόρμα βλέπει τη σχέση· οι υπόλοιπες δουλεύουν όπως πριν, χωρίς ετικέτα | `shared/evidence`, `EndorsementsService` |
| Δεξιότητες δεμένες σε τεκμήρια | ορόσημο, έγγραφο builder, συμφωνημένη δέσμευση, με έλεγχο ιδιοκτησίας στον server· μέτρηση συστάσεων ανά δεξιότητα | `api/skill-evidence`, προφίλ |
| Agent αναζήτησης συνιδρυτή | ο ανιχνευτής προτείνει έως 5, με λόγους και πρόχειρο σημείωμα· δεν στέλνει, δεν συνδέει, δεν ειδοποιεί κανέναν· ημερήσιο πέρασμα που ενημερώνει μόνο τον ιδρυτή | `shared/scout`, `api/scout`, `/scout` |
| Όριο ταυτόχρονων ενδιαφερόντων | έως 5 απαντήσεις σε αναμονή· ελευθερώνεται θέση όταν γίνει δεκτή ή αποσυρθεί | `INTEREST_BUDGET` |
| «Προτεραιότητα στην αναζήτηση» ως προώθηση | πουλιόταν χωρίς υλοποίηση. Τώρα είναι ξεχωριστή θέση «Προώθηση» (έως 2, μόνο όσοι ήδη ταιριάζουν), δεν αλλάζει βαθμολογίες ή σειρά· το πλάνο τη γράφει ως τέτοια | `shared/promotion`, `/discover`, τιμολόγηση |
| Πολιτική απορρήτου που περιγράφει τον κώδικα | νέα ενότητα 4 με ό,τι ελέγχθηκε στον κώδικα: Ollama για τον βοηθό, OpenAI για προτάσεις προφίλ όταν είναι ενεργό, μεταδεδομένα (όχι κείμενο) στο log, κανόνες με λόγους στο matching, κατηγορίες μόνο από το LinkedIn, 15′ για το DMA | `/privacy` |

### 43.2 Ο βοηθός σε όλα τα παραπάνω

Κάθε νέα λειτουργία έχει δηλωμένες δυνατότητες στο `packages/shared/src/actions` με επαληθευμένη αναστρεψιμότητα: `get_founder_updates`, `get_intros`, `get_skill_evidence`, `get_scout` (ανάγνωση)· `follow_person` (partial), `request_intro` (partial), `set_open_to` (partial), `link_skill_evidence` (full), `run_scout` (none)· `draft_founder_update`, `draft_scout_brief` (φόρμες ως προτάσεις). Οι σελίδες `/updates`, `/intros`, `/scout` δίνουν τις εντολές γραμμών τους με `usePageControls`. Το rule engine δείχνει πλέον και τις κάρτες `draft_need_card`, που σχεδίαζε χωρίς να εμφανίζει. Το σύνολο αξιολόγησης πήγε από 64 σε 78 αιτήματα (39 ανά γλώσσα).

### 43.3 Τι δεν μπορεί να κάνει ο κώδικας μόνος του

- **Έγκριση από το LinkedIn.** Το `r_verify` (Verified on LinkedIn) και το `r_dma_portability_3rd_party` απαιτούν έγκριση της εφαρμογής από το LinkedIn. Μέχρι τότε μένουν κλειστά (`LINKEDIN_VERIFY_ENABLED`, `LINKEDIN_DMA_ENABLED`) και η σελίδα το λέει· το εταιρικό email και το αρχείο εξαγωγής δουλεύουν χωρίς έγκριση.
- **Δημόσιες δεσμεύσεις.** Η πολιτική απορρήτου περιγράφει τι κάνει ο κώδικας· δεν υπόσχεται τίποτα για εκπαίδευση μοντέλων από τρίτους παρόχους. Το αν και τι θα δεσμευτεί η εταιρεία δημόσια είναι απόφαση του ιδιοκτήτη.
- **EU AI Act.** Ο ανιχνευτής και το matching κατατάσσουν ανθρώπους για συνεργασία, όχι για πρόσληψη ή πίστωση· παρ' όλα αυτά, η κατάταξη ανθρώπων αξίζει νομικό έλεγχο ως προς τα Παραρτήματα του κανονισμού πριν από ευρεία κυκλοφορία. Ο κώδικας κρατά κάθε λόγο κατάταξης ορατό στον χρήστη, που διευκολύνει τη διαφάνεια όποιο κι αν είναι το συμπέρασμα.
- **Βάση δεδομένων.** Τα νέα μοντέλα (`FounderUpdate`, `OpenToSignal`, `IntroRequest`, `SkillEvidence`, `ScoutBrief`, `ScoutProposal`, `UserVerification`, `WorkEmailChallenge`, `ProfileImportDraft`, `PublicPitch`) και το πεδίο `Endorsement.basis` υπάρχουν μόνο στο schema· χρειάζεται `prisma db push`, όπως για τα υπόλοιπα (AGENTS.md).

### 43.4 Πύλες (τελική εκτέλεση, κύμα 6)

| πύλη | αποτέλεσμα |
|---|---|
| `tsc` web / api | 0 / 0 σφάλματα |
| vitest api | 439/439 |
| vitest web | 1000/1000 (μία αποτυχία συμβολαίου `layoutGuards` στο κύμα 5 διορθώθηκε πριν το commit) |
| `node --test scripts/…` | 12/12 |
| `check-theme-contrast.py` | 0 αποτυχίες |
| `next build` (production) | επιτυχές· `/updates`, `/intros`, `/scout`, `/u/[token]` στη λίστα routes |
| `platform-sweep` σε 12 νέα/αλλαγμένα routes, 390 και 1440 | 12/12 200, 0 σφάλματα, 0 οριζόντια κύλιση, 0 ανώνυμα controls, 0 νεκρές ζώνες |

Το `/privacy` δείχνει 2% ελληνικά στα 1440: το νομικό κείμενο ήταν ήδη μόνο αγγλικά πριν από αυτή τη δουλειά, και η νέα ενότητα 4 ακολουθεί το ίδιο. Η μετάφραση νομικού κειμένου είναι απόφαση του ιδιοκτήτη (ή νομικού), όχι αυτόματη.

Οι οπτικοί έλεγχοι (στιγμιότυπα 1440 των `/scout`, `/intros`, `/updates`, `/discover`) έδειξαν δύο θέματα διατύπωσης, που διορθώθηκαν: ο ενδιάμεσος έβλεπε «Περιμένει τον ενδιάμεσο» για τη δική του απόφαση (τώρα «Περιμένει την απόφασή σας»), και οι επιλογές δέσμευσης/σταδίου στον ανιχνευτή ήταν πεζά.
