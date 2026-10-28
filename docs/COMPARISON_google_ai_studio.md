# Σύγκριση: cofoundersbay (αυτό το repo) ↔ CofounderBay_google_ai_studio

Ημερομηνία: 2026-06 · Σύγκριση στο commit `e64adb1` του sibling repo και `e9557d75` του παρόντος.

## 1. Αρχιτεκτονική — δύο διαφορετικά «ζώα»

| Διάσταση | cofoundersbay (εδώ) | google_ai_studio |
| --- | --- | --- |
| Runtime | Next.js 15 App Router, Turborepo, NestJS API, Prisma/Postgres, Redis, Meilisearch | Vite SPA, React Router 7, Firebase Auth/Firestore, Express+Socket.IO mock server |
| Σελίδες | 171 routes (4 ρόλοι: founder/mentor/investor/org + admin/tenant/public) | 31 pages (ένας ρόλος + admin) |
| Design system | `@cofounderbay/ui` + shadcn, tokens σε `globals.css`, bilingual `BilingualText`/`FactLine` | Tailwind v4 `@theme`, stone/white monochrome, `Both` bilingual helper |
| AI | 92 δηλωμένα actions (50 reads / 42 writes) σε `packages/shared/actions`, planner → engine → loop, citations, undo, role gating, eval suite | 1 deterministic router (`assistantOps.ts`, ~45 tools), proposals με apply/undo, knowledge cards, slash commands |
| Ταίριασμα | `compatibility` questionnaire (ordinal/categorical/complement), engine-computed score ανά ζεύγος | `fitCheck` 5 ερωτήσεων → archetype, γράφει πεδία που διαβάζει το scoring |
| Ασφάλεια αποθήκευσης | `useUnsavedForm` + `UnsavedNotice` (docs §105) | `SaveSafetyGuard` + `useProtectedDraft` + `SaveStatus` chip |
| Δοκιμές | vitest 686 tests, Playwright a11y (authenticated + demo sweep) | vitest, Playwright, `check:links`, `check:buttons` |

**Συμπέρασμα:** το παρόν repo είναι σαφώς πιο εξελιγμένο σε έκταση, βάθος AI, πολυ-ρολικότητα και backend. Το sibling υπερέχει μόνο σε λίγα, συγκεκριμένα σημεία καθαρότητας UX που αξίζει να μεταφερθούν (παρακάτω).

## 2. Σελίδα-προς-σελίδα (αντιστοιχίες)

| google_ai_studio | Εδώ | Τι υπερέχει εκεί | Απόφαση |
| --- | --- | --- | --- |
| `DashboardPage` | `/dashboard/{founder,mentor,investor,org}` | Μία «ανατομία αρχικής»: NextMove → KPI → «περιμένει εσένα» → ροή | Ήδη portαρισμένο (§107-109). Έλεγχος ομοιομορφίας στους 4 ρόλους (Φάση 3) |
| `Discovery` / `MatchDiscovery` | `/discover`, `/matches`, `/matches/[userId]` | Undo στο Pass, «γιατί ταιριάζετε» chips | Υπάρχουν ήδη (Pass undo, AIMatchExplainer) |
| `FitCheck` (`/quiz`) | — (ερωτηματολόγιο συμβατότητας μόνο μετά το login) | Δημόσιο 60″ fit check ως funnel πριν την εγγραφή | **Νέο** (Φάση 4), με επαναχρησιμοποίηση `COMPAT_QUESTIONS` |
| `LegalHub` (`/legal`) | — | Κατάλογος νομικών προτύπων ανά κατηγορία + legal office hours → Ημερολόγιο | **Νέο** (Φάση 2) |
| `Insights` | `/analytics`, `/readiness` | — | Τίποτα· εδώ πληρέστερο |
| `Resources` (Learning/Jobs/Services) | `/learning`, `/jobs`, `/marketplace`, `/provider/*` | — | Τίποτα· εδώ χωριστές, πληρέστερες σελίδες |
| `Workspace` | `/builder`, `/projects`, `/research` | — | Τίποτα |
| `Perks` | `/perks` (offers/claimed/manage) | — | Τίποτα |
| `Settings` (+Billing) | `/settings/*` | Danger zone: export my data | Υπάρχει (`dataExport`) |
| `OnboardingWizard` | `/onboarding` (conversational) | — | Εδώ ήδη stepper + «γιατί το ρωτάμε» |
| `CommunicationHub` | `/messages` | — | Εδώ πληρέστερο (intros, drafts από match reasons §108) |
| `ChatWidget` + `assistantOps` | `CopilotWorkspace` + `action-registry` | (α) Knowledge cards «πού ζει το Χ», (β) ρητή ένδειξη αναστρεψιμότητας (full/partial/none + γιατί) στην πρόταση, (γ) `/help` «τι μπορεί να αλλάξει εδώ» | **Φάση 1** (α, β)· το (γ) υπάρχει ως `/ai/capabilities` |
| `SaveStatus` chip | μόνο «Saving…» σε κουμπιά | Μόνιμη ένδειξη «Αποθηκεύτηκε · πριν 2′ / Αποθήκευση… / Απέτυχε — Δοκίμασε ξανά» δίπλα στον τίτλο κάθε editor | **Φάση 1** |

## 3. Τι ΔΕΝ μεταφέρεται και γιατί
- Firebase/Firestore, Zustand store, Vite config: ασύμβατα με το monorepo· καμία λειτουργική υπεροχή.
- Hardcoded knowledge cards με demo ονόματα (Sequoia, YC S26…): εδώ τα ίδια δεδομένα διαβάζονται ζωντανά από το API/demo layer· θα χτιστεί **γενικευμένο** «where-is» πάνω στο `page-registry` + `pageControls`, όχι λίστα κειμένων.
- Stone monochrome palette: το παρόν design system έχει tokens/θέματα (themes route)· αλλαγή παλέτας δεν ζητήθηκε.

## 4. Φάσεις υλοποίησης (έγκριση ανά φάση)

**Φάση 1 — Καθαρότητα AI & αποθήκευσης (frontend + demo mocks)**
1. `SaveStatus` primitive (`components/common/SaveStatus.tsx`) + ενσωμάτωση σε Builder artefacts, Research node viewer, Settings/Profile forms, Provider services/projects.
2. Assistant read tool `where_is`: «Πού κάνω export το pitch;» → σελίδα → ενότητα → control, με link και one-tap «Άνοιγμα»· τροφοδοτείται από `page-registry` (171 σελίδες, bilingual) + `pageControls`.
3. ActionCard: ετικέτα αναστρεψιμότητας (Πλήρως / Μερικώς / Μη αναστρέψιμο + μία γραμμή γιατί) από το declaration κάθε action.

**Φάση 2 — Legal Hub `/legal`**: κατάλογος προτύπων (Σύσταση / IP / Προσλήψεις / Χρηματοδότηση) με κατάσταση (Verified/Critical/Standard/Optional), «Σύνταξη με τον βοηθό», legal office hours που γράφουν στο Ημερολόγιο· registry + contextual help + nav· read tool `get_legal_templates`.

**Φάση 3 — Ομοιομορφία αρχικών 4 ρόλων**: ίδια ανατομία NextMove → KPI → «περιμένει εσένα» → ροή· ίδιο sample pill· ίδια θέση ερώτησης προς τον βοηθό.

**Φάση 4 — Δημόσιο Fit Check `/quiz`**: 5 ερωτήσεις από `COMPAT_QUESTIONS`, αποτέλεσμα + «τι θα δεις στα Matches», αποθήκευση απαντήσεων για το onboarding (δεν ξαναρωτιούνται).
