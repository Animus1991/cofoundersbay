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
