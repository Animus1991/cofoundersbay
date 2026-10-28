# Συγκριτικός έλεγχος και πλάνο — αρχικές οθόνες & AI

Ημερομηνία: 2026-10-28. Εγκεκριμένη πρώτη ομάδα: **Αρχικές οθόνες και AI βοηθός**.
Αρχή: καμία αντικατάσταση αρχιτεκτονικής, κατάργηση διαδρομής ή τυφλή αντιγραφή ενός δεύτερου μοντέλου δεδομένων.

## 1. Επαληθεύσιμη βάση — όχι «100% ελεγμένο»

- Τοπική αφετηρία: `aea3d864f7e048fd14e509a5a135b5d0bd76cc45`.
- Κύριο remote: `claude/project-audit-upgrade-y2ebnr`, `7d861e314657800d1dfb4964377bcfd705c6dd16`.
- Διαφορά αφετηρίας: 0 τοπικά / 3 εισερχόμενα commits, **27 αρχεία, +882/-47 γραμμές**.
- Commits: `7f6a2029` (pins, εξήγηση σκορ, ύφος βοηθού), `1496c55d` (δημοσιευμένο σκορ και ασύγχρονη αποθήκευση), `7d861e31` (αναδόμηση shared πριν το dev).
- Το main `81d7edab` υπολείπεται του ενεργού κλάδου κατά 278 commits. Το integration κατά 472. Όλοι οι άλλοι fetched κλάδοι του κυρίου έργου είναι ancestors, **εκτός** του `wip/main-checkout-pre-audit` (ένα αποκλίνον WIP `62509a49`). Δεν αντιγράφεται αυθαίρετα πάνω στο ενεργό έργο: παλιά ατελής εργασία, όχι αποδεδειγμένα νεότερη λειτουργικότητα.
- Το sibling main παραμένει `e64adb1d5e2f287f281de8cf07d9ded5bfb82217`. **Δεν είναι η νεότερη γραμμή ανάπτυξης.**
- Εξετάστηκε επιπλέον το `claude/ai-studio-platform-upgrade`, `bedc6cc587fdcccbe9630e7fdca0f2060446338f`: 17 commits πάνω στο main, 82 διαφορετικά αρχεία (+7808/-962). Ο μεγάλος γύρος `2d00905` αφορά εξατομίκευση/AI/χωροθέτηση· οι επόμενοι κυρίως χρώματα.
- Τα αποκλίνοντα sibling `cursor/bilingual-real-numbers-b491`, `cursor/comfort-design-system-b491`, `cursor/ux-patterns-keep-style-b491` έχουν 5/6/15 μοναδικά commits έναντι αυτού του branch στην fetched ιστορία. Η παρουσία τους καταγράφεται, **δεν** ισχυριζόμαστε ότι όλα τα branches είναι συγχωνευμένα ή όλα τα περιεχόμενά τους καλύτερα.

### Τρόπος ενσωμάτωσης

Έγινε `fetch` και σύγκριση. Η ενσωμάτωση των 27 εισερχόμενων αρχείων γίνεται ως ελεγχόμενο patch περιεχομένου, όχι ως `git pull`/merge ή push. Οι προστατευμένοι φάκελοι `.git`, `.emergent`, τα περιβάλλοντα και ο preview adapter δεν αντικαθίστανται. Πριν τις δικές μας αλλαγές, τα 27 αρχεία πρέπει να συγκριθούν byte-for-byte με το remote snapshot. Το ιστορικό Git δεν πρέπει να παρουσιαστεί ως συγχωνευμένο.

## 2. Κάλυψη και μεθοδολογία

Η σημερινή στατική απογραφή (`node scripts/platform-inventory.cjs --summary`) δίνει:

| Αντικείμενο | Υποψήφια σημεία | Τι αποδεικνύεται |
|---|---:|---|
| Αρχεία πηγής | 1267 | εντοπίστηκαν από parser |
| Διαδρομές | 172 | παρουσία στον κώδικα |
| Όρια/layouts | 225 | παρουσία στον κώδικα |
| Σημεία αλληλεπίδρασης | 4432 | υποψήφια UI surfaces, όχι 4432 επιτυχείς δοκιμές |
| Δηλώσεις endpoints | 666 | παρουσία, όχι live λειτουργία |
| Parse errors | 0 | επιτυχής απογραφή |

Απογραφή AI: **117 operable / 24 askable / 31 τεκμηριωμένες εξαιρέσεις / 0 ανεξήγητες**. Το «operable» σημαίνει δηλωμένα controls, όχι απόδειξη εκτέλεσης κάθε πιθανού αιτήματος φυσικής γλώσσας.

Επίπεδα τεκμηρίωσης:
1. **Απογραφή:** αρχεία/διαδρομές/σχέσεις. Πλήρης για τα στοιχεία που εξάγουν οι συγκεκριμένοι parsers.
2. **Σύγκριση κώδικα:** εισερχόμενο diff και στοχευμένες αρχικές/κοινά components/AI ροή.
3. **Μονάδες & τύποι:** εκτέλεση μετά την ενσωμάτωση· καλύπτει μόνο ό,τι ασκούν οι δοκιμές.
4. **Πραγματικός browser σε demo:** επιλεγμένα flows ανά ρόλο, desktop και κινητό. Δεδομένα **MOCKED**.
5. **Live backend / πραγματικοί λογαριασμοί / διατήρηση δεδομένων / όλες οι καταστάσεις:** δεν πιστοποιούνται εδώ χωρίς τις αντίστοιχες υπηρεσίες και fixtures.

Τα ιστορικά «233 αρχεία / 1636 tests» και «42 scans χωρίς axe violations» δεν είναι νέα αποτελέσματα. Οι upstream αναφορές στο `PLATFORM_DESIGN_AI_PLAN.md` είναι ιστορικές αναφορές άλλου περιβάλλοντος, όχι εκτέλεση αυτής της συνεδρίας. Ούτε τα μηδενικά axe findings αποδεικνύουν συνολική WCAG συμμόρφωση.

## 3. Αντιστοίχιση όλων των δηλωμένων sibling διαδρομών

Πηγή: `bedc6cc:src/App.tsx` γραμμές 486–551. Οι αντιστοιχίες είναι **λειτουργικός χάρτης**, όχι πιστοποίηση οπτικού ελέγχου κάθε modal/button. Οι εκτός αρχικών σελίδες χρειάζονται επόμενο επιμέρους έλεγχο πριν αλλάξουν.

| Sibling route | Τοπικό ισοδύναμο | Απόφαση / κάλυψη |
|---|---|---|
| `/` | `/`, `/dashboard` | κρατάμε δημόσια σελίδα και role redirect· όχι αυθαίρετη αλλαγή αρχικής |
| `/login` | `/login` | καμία αλλαγή auth |
| `/signup` | `/register` | καμία αλλαγή auth |
| `/quiz` | `/profile#how-you-work` (όχι δημόσιο) | υποψήφιο δημόσιο funnel χωρίς δεύτερο σκορ· εκκρεμεί |
| `/dashboard` | `/dashboard/founder`, `/mentor`, `/investor`, `/incubator`, `/provider` κάτω από dashboard, `/admin/dashboard` | εμβάθυνση αυτής της φάσης |
| `/profile` | `/profile`, `/profile/edit` | διατήρηση trust/compatibility/evidence |
| `/profile/:id` | `/profiles/[userId]`, `/p/[username]` | ιδιωτική και δημόσια μορφή παραμένουν ξεχωριστές |
| `/matches` | `/matches`, `/matches/[userId]`, `/matches/compare` | εισερχόμενη κοινή εξήγηση σκορ· όχι δεύτερος engine |
| `/discovery` | `/discover`, `/search`, `/compare` | διατήρηση φυσικής αναζήτησης, φίλτρων, σύγκρισης |
| `/events` | `/events`, `/events/[id]`, `/events/create` | επόμενος flow audit |
| `/mentors` | `/mentoring`, `/mentor/*`, `/coaching` | καθαρότητα αρχικής μέντορα τώρα· κατάλογος αργότερα |
| `/communities`, `/community` alias | `/groups`, `/groups/[groupId]` | διατήρηση community permissions/moderation |
| `/messages` | `/messages`, `/connections`, `/intros` | διαφορετικοί τύποι σχέσεων δεν συγχέονται |
| `/milestones` | `/milestones`, `/milestones/new` | κοινά δεδομένα με home και AI, όχι τοπική δεύτερη λίστα |
| `/founder-tools` | `/builder`, `/builder/pitch-deck`, `/builder/applications` | διατήρηση υπάρχοντος workspace |
| `/fundraising` | `/fundraising`, `/investors`, `/data-room/[id]` | ξεχωριστά tracked round / κατάλογος / room |
| `/workspace` | `/research`, `/research/[boardId]`, `/projects` | όχι μεταφορά Zustand/Firebase store |
| `/calendar` | `/calendar` | κοινά events, όχι demo-only νέα βάση |
| `/programs` | `/programs`, `/programs/[id]`, `/org/programs` | συμμετέχων και διαχειριστής χωριστά |
| `/network` | `/connections`, `/members`, `/shortlist` | διατήρηση accepted/pending/saved διαφορών |
| `/resources` | `/learning`, `/jobs`, `/marketplace` | ξεχωριστές πλήρεις σελίδες αντί υπερφόρτωσης μίας |
| `/insights` | `/analytics`, `/readiness` | readiness και πραγματικά analytics δεν είναι το ίδιο σκορ |
| `/legal` | `/legal` | ήδη μεταφερμένο· 13 templates, όχι 14 |
| `/perks` | `/perks` | ήδη πλήρης ροή offers/claims/manage |
| `/notifications` | `/notifications` | AI διαλογή υποψήφια επόμενη φάση |
| `/settings` | `/settings`, `/settings/ai`, `/settings/notifications`, `/settings/data-export` | εισερχόμενο reply style κοινό με AI |
| `/settings/billing` | `/settings/billing` | καμία νέα πληρωμή |
| `/pricing` | `/pricing` | απογραφή, όχι αλλαγή εμπορικής πολιτικής |
| `/admin` | `/admin`, `/admin/dashboard` | console και overview παραμένουν ξεχωριστά |
| `/admin/users` | `/admin/users`, `/admin/user-management` | απαιτεί ρολικό audit |
| `/admin/automation` | `/admin/automations`, `/tenant/automation` | όχι νέο scheduler |
| `/admin/branding` | `/tenant/branding` | tenant boundary διατηρείται |
| `/admin/sso` | `/tenant/sso`, `/admin/sso` | καμία αλλαγή SSO |
| `/admin/taxonomy`, `/admin/taxonomies` alias | `/admin/taxonomy` | απογραφή |
| `/admin/domains` | `/tenant/domains`, `/admin/domains` | όχι αλλαγές DNS |
| `/admin/billing` | `/tenant/billing` | όχι συγχώνευση tenant/platform permissions |
| `/admin/billing-oversight` | `/admin/billing` | απογραφή |
| `*` | Next not-found | διατήρηση σαφούς εξόδου |

Το `OnboardingWizard`/`TenantLanding` και οι global modals υπάρχουν και ως components χωρίς δική τους δηλωμένη route. Αντίστοιχα εδώ: onboarding component/test harness, `/t/[slug]`, profile/match dialogs, form drafts. Δεν προσμετρώνται αυθαίρετα ως επιπλέον σελίδες.

## 4. Σύγκριση component προς component — τι αξίζει πραγματικά

| Ζήτημα | Sibling bedc6cc | Τοπικό | Ενέργεια |
|---|---|---|---|
| Ενιαία πρώτη εικόνα | DashboardPage: ask → next/waiting → πρόσωπα → ροή | HomeAskHero + HomeNextStep ήδη κοινά σε 6 ρόλους | όχι ανακατασκευή ήδη υπάρχοντος |
| Ask δίπλα στην επόμενη κίνηση | NextMove `askPrompt` | HomeNextStep `onAsk`, αλλά δεν χρησιμοποιείται στις βασικές άλλες role homes | συνδέεται με υπάρχοντα reads |
| Πλήθος εντολών | mixed τώρα/προτάσεις/πλοήγηση | mixed now chips + role actions + προσωπικές σελίδες | σαφείς μικρές ομάδες χωρίς κατάργηση επιλογών |
| Επίδραση κουμπιού | κάποιες εντολές ανοίγουν modal, άλλες AI | διαφορετικά prompt/href ήδη στο registry | καθαρή προσβάσιμη διάκριση Ask/Open, ίδια handlers |
| Επόμενη ενέργεια μέντορα | γενικό NextMove | μπορεί να εμφανίσει δύο ισότιμα banners | μία κύρια προτεραιότητα· υπόλοιπα παραμένουν στις λίστες |
| AI εικόνα home | γενικό context από stores | founder δημοσιεύει snapshot· άλλες homes όχι | snapshots από τα ίδια δεδομένα με τα tiles, unknown αντί 0 |
| Προσωπική πλοήγηση | PinToggle + favorites/homePath | usage-profile + YourPages + incoming PinPageButton | κοινό υπάρχον store, όχι δεύτερα favorites |
| Ύφος απαντήσεων | assistantPrefs + `/style` | server prefs + incoming set_reply_style με undo | εισερχόμενο action, επιβεβαίωση πριν εγγραφή |
| Πώς βγαίνει το σκορ | νέο modal | incoming MatchScoreExplainer από shared constants | διατηρείται η πηγή αλήθειας |
| Save feedback | protected drafts / accurate save | incoming awaited Research save & Builder error propagation | εφαρμόζεται και ελέγχεται ως regression |
| Χρωματικές αλλαγές | 16 commits κυρίως palette | ώριμα tokens/πολλά θέματα/guards | δεν μεταφέρεται αυθαίρετα άλλη παλέτα |
| Fit Check | δικά του axes/result | υφιστάμενα privacy-aware compat answers | καμία μη τεκμηριωμένη ψυχομετρία ή δεύτερο «επιστημονικό» σκορ |

Πηγές επιθεώρησης: sibling `DashboardPage.tsx`, `NextMove.tsx`, `assistantPrefs.ts`, `personalization.ts`, `assistantOps.ts`, `ChatWidget.tsx`, `App.tsx`· κύριο `HomeAskHero.tsx`, `HomeNextStep.tsx`, `YourPages.tsx`, 4 role homes, `page-questions.ts`, `home-ask.ts`, `PageSnapshotContext.tsx`, `copilot-engine.ts` και όλο το εισερχόμενο diff.

## 5. Στοχευμένα ευρήματα και κανόνες δεδομένων

1. **Ελλιπές context AI στις role homes:** ο βοηθός δεν πρέπει να παρουσιάζει στοιχεία founder για investor/mentor/org. Δημοσίευση μόνο ορατών aggregate facts, route-scoped, όχι δεύτερες API εγγραφές.
2. **Μη αναγνωσμένο δεν σημαίνει μηδέν:** null/undefined/error/pending διακρίνονται από πραγματικό 0. Ισχύει στα snapshots και στα ορατά tiles.
3. **Μία προτεραιότητα μέντορα:** άμεση συνεδρία → κρατήσεις που περιμένουν → αίτημα καθοδήγησης → επόμενη συνεδρία. Όλες οι υπόλοιπες εγγραφές παραμένουν διαθέσιμες στις ενότητες.
4. **Προσωπικός κωδικός ≠ οργανωσιακές ρυθμίσεις:** το `where_is` δεν πρέπει να προτείνει org/admin routes για ρητά προσωπική αλλαγή κωδικού, εκτός αν ζητείται οργανισμός.
5. **Incoming αλλαγή ranking:** το `1496c55d` επιλέγει/ταξινομεί κατά listScore, με learning/Open-to μόνο στην ισοβαθμία. Διατηρείται η εισερχόμενη επιλογή, αλλά η τεκμηρίωση πρέπει να το λέει, όχι να υπόσχεται ευρύτερο boost. Το Open-to εξακολουθεί να εμφανίζεται μόνο όπου επιτρέπεται στον viewer.
6. **Weekly email score:** εντοπίστηκε στο `apps/api/src/digests/email-digest.service.ts:639`: προτιμά `listScore` όταν υπάρχει. Επιθεώρηση κώδικα, όχι απόδειξη αποστολής email.
7. **Προϋπάρχοντα iteration_2:** Legal έχει 13 ορθά τεκμηριωμένα entries· moved nav Learn και μετάφραση Dismiss υπάρχουν ήδη. Research async save έρχεται από upstream· χρειάζεται regression. Δεν «διορθώνουμε» ξανά λύσεις που ήδη υπάρχουν.

## 6. Πλάνο με κριτήρια αποδοχής

### P0 — αυτή η εγκεκριμένη φάση
- Ενσωμάτωση όλων των 27 incoming αρχείων με byte comparison, καμία αλλαγή προστατευμένων αρχείων.
- Σαφής κοινή ομαδοποίηση actions σε όλες τις homes. Κάθε προηγούμενη ενέργεια παραμένει προσβάσιμη με ίδια λειτουργία.
- Ask στο επόμενο βήμα mentor/investor/org· contextual snapshot πραγματικών αναγνωσμένων στοιχείων, όχι φανταστικοί αριθμοί.
- Μία κύρια mentor προτεραιότητα. Επεξηγηματικές, όχι πολυλογικές, καταστάσεις.
- Τύποι + πλήρες web regression + API unit όπου εφικτό· browser desktop/mobile, EN/EL, θετικά και αποτυχημένα reads, AI πρόταση/confirm/undo, session continuity.

### P1 — μετά την ανασκόπηση αυτής της φάσης
- Discovery/Matches/Profile/Connections: ανά στοιχείο αντιστοίχιση, ίδια δεδομένα και κουμπιά κατάστασης, φίλτρα, focus/escape, φόρτωση/σφάλμα/κενό/πολλά rows.
- Builder/Research: κάλυψη όλων των editors με πραγματικό save/error/retry, προστασία edits κατά εκκρεμή εγγραφή, ίδιες API ενέργειες από UI και AI.
- Ροές mentor bookings, org applications και provider inquiries με ταυτόσημα δεδομένα σε home/list/detail/AI.
- Full backend με διαθέσιμο Postgres/Redis/Meilisearch: persistence, πραγματικοί λογαριασμοί/ρόλοι, αποτυχίες δικτύου, race conditions.

### P2 — νέες δυνατότητες μόνο με ξεχωριστή απόφαση
- Δημόσιο Fit Check πάνω στις ίδιες ερωτήσεις, χωρίς επιστημονικοφανή δεύτερη βαθμολογία.
- Αναστρέψιμη AI διαλογή ειδοποιήσεων και προτεινόμενο εβδομαδιαίο πλάνο με επιμέρους επιβεβαιώσεις.
- Προαιρετική προσωπική αρχική σελίδα και cross-device shortcuts με ελεγχόμενη αποθήκευση.
- Έλεγχος υπολοίπων αποκλινόντων sibling branches για μοναδική λειτουργική αξία, όχι τυφλή συγχώνευση παλιών styles.

### Μετρήσεις προϊόντος (στόχοι, όχι ήδη αποδεδειγμένα αποτελέσματα)
Χρόνος μέχρι χρήσιμη πρώτη ενέργεια, επιτυχία εύρεσης λειτουργίας, ολοκλήρωση προτεινόμενης ενέργειας, ποσοστό undo/error, επάνοδος 7/30 ημερών. Κανένας ισχυρισμός αύξησης loyalty χωρίς πραγματικά δεδομένα και δοκιμές με χρήστες.

## 7. Αποτελέσματα αυτής της φάσης
Ενημερώνονται μετά τις πραγματικές εκτελέσεις. Το παρόν καταγράφει τη σύγκριση **πριν** τις νέες αλλαγές, όχι εκ των υστέρων καθολική πιστοποίηση.