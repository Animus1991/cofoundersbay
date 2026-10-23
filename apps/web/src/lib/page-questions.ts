import type { CopilotToolName } from './copilot-types';

/**
 * The ready questions the product hands to the assistant, in both languages.
 *
 * A page asks the assistant from its header ("Ask about this page", sent as
 * is when the field is empty), from an empty list, from a "Sample data" note
 * and from cards. These were English sentences in each page: a Greek reader
 * pressing Ask sent, and saw in the chat, an English question, and the rule
 * planner read several of them as something else - "which expert review
 * should I request ... go-to-market ... readiness" ticked a market criterion,
 * "I have not joined any groups" proposed joining one, and many searched
 * people for the words of the sentence. They live here now, each with what
 * answers it, and `pageAsks.test.ts` holds both languages to that.
 *
 * The asker (`useAskAssistant`) sends the reader's language.
 */

/** A question in both languages. */
export type AskText = { en: string; el: string };

/** What a page hands the assistant: a pair, or one string (typed, or built from data). */
export type AskPrompt = string | AskText;

/**
 * A ready question and what answers it: the capability the planner reads it
 * as, or `samples` - "why is this sample data?", which the engine answers
 * from the page itself.
 */
export type PageQuestion = AskText & ({ tool: CopilotToolName; answer?: undefined } | { answer: 'samples'; tool?: undefined });

/** /programs, after the list: which open programme fits. */
export const PROGRAMS_QUESTION: PageQuestion = {
  en: 'Which accelerator programmes are open right now, and which fit my stage and goals?',
  el: 'Ποια προγράμματα επιτάχυνσης δέχονται αιτήσεις τώρα, και ποια ταιριάζουν στο στάδιο και τους στόχους μου;',
  tool: 'get_programs',
};

export const ASK = {
  // Asked from a page header ("Ask about this page", sent when the field is empty).
  achievements: {
    en: 'What achievements should I work toward next, and which unlocked badges are most useful to show investors?',
    el: 'Ποια επιτεύγματα να κυνηγήσω στη συνέχεια, και ποια από τα εμβλήματα που έχω ξεκλειδώσει αξίζει να δουν οι επενδυτές;',
    tool: 'get_reputation',
  },
  activity: {
    en: 'Summarise my recent network activity and tell me what to act on first: intros, unread notifications, or upcoming events.',
    el: 'Σύνοψε την πρόσφατη δραστηριότητα του δικτύου μου και πες μου με τι να ασχοληθώ πρώτα: γνωριμίες, αδιάβαστες ειδοποιήσεις ή επερχόμενες εκδηλώσεις.',
    tool: 'get_notifications',
  },
  builder: {
    en: 'Summarize this startup workspace and tell me the next Builder section to complete — Idea Core, BMC, Market, or Pitch.',
    el: 'Σύνοψε αυτόν τον χώρο εργασίας και πες μου ποια ενότητα του Builder να συμπληρώσω μετά — Πυρήνας ιδέας, BMC, Αγορά ή Pitch.',
    tool: 'get_builder_state',
  },
  calendar: {
    en: 'What is coming up on my calendar this week, and what should I prepare first?',
    el: 'Τι έχει το ημερολόγιό μου αυτή την εβδομάδα, και τι να προετοιμάσω πρώτα;',
    tool: 'get_events',
  },
  needCardNew: {
    en: 'Draft my need card from my workspace: what exists, the outcome, who is missing and what I offer.',
    el: 'Σύνταξε την κάρτα ανάγκης μου από τον χώρο εργασίας μου: τι υπάρχει, το αποτέλεσμα, ποιος λείπει και τι προσφέρω.',
    tool: 'draft_need_card',
  },
  commitments: {
    en: 'Which of my commitments needs me next, and what should I say?',
    el: 'Ποια από τις δεσμεύσεις μου με χρειάζεται μετά, και τι να πω;',
    tool: 'get_commitments',
  },
  events: {
    en: 'What\'s coming up in events, and which should I RSVP to or create to meet cofounders?',
    el: 'Ποιες εκδηλώσεις έρχονται, και σε ποιες να πάω ή ποιες να οργανώσω για να γνωρίσω συνιδρυτές;',
    tool: 'get_events',
  },
  expertReviews: {
    en: 'Which expert review should I request first — pitch deck, financial model, or go-to-market — given my current readiness gaps?',
    el: 'Ποια αξιολόγηση ειδικού να ζητήσω πρώτα — pitch deck, οικονομικό μοντέλο ή go-to-market — με βάση τα σημερινά κενά της ετοιμότητάς μου;',
    tool: 'get_expert_reviews',
  },
  learning: {
    en: 'Which readiness gap should I study first, and which learning path or resource covers it?',
    el: 'Ποιο κενό ετοιμότητας να μελετήσω πρώτα, και ποια διαδρομή μάθησης ή ποιο μάθημα το καλύπτει;',
    tool: 'get_learning',
  },
  mentoring: {
    en: 'Which mentors are available, and how should I prepare the first session?',
    el: 'Ποιοι μέντορες είναι διαθέσιμοι, και πώς να προετοιμάσω την πρώτη συνεδρία;',
    tool: 'get_mentors',
  },
  milestoneNew: {
    en: 'Draft my next milestone from my Startup Builder workspace, my fundraising round and anything overdue.',
    el: 'Ετοίμασε το επόμενο ορόσημό μου από τον χώρο εργασίας μου στον Startup Builder, τον γύρο χρηματοδότησης και ό,τι έχει καθυστερήσει.',
    tool: 'draft_milestone',
  },
  notifications: {
    en: 'I am looking at my notifications. What should I act on first — messages, connections, or matches?',
    el: 'Βλέπω τις ειδοποιήσεις μου. Με τι να ασχοληθώ πρώτα — μηνύματα, συνδέσεις ή αντιστοιχίσεις;',
    tool: 'get_notifications',
  },
  perks: {
    en: 'Which of these perks suit my startup\'s stage, and what do I need to redeem them?',
    el: 'Ποιες από αυτές τις προσφορές συνεργατών είναι κατάλληλες για το στάδιο της startup μου, και τι χρειάζομαι για να τις εξαργυρώσω;',
    tool: 'get_perks',
  },
  projectNew: {
    en: 'Draft my next project from my Startup Builder workspace: the Idea Core, the go-to-market board or the role my team is missing.',
    el: 'Ετοίμασε το επόμενο project μου από τον χώρο εργασίας μου στον Startup Builder: τον Πυρήνα ιδέας, τον πίνακα go-to-market ή τον ρόλο που λείπει από την ομάδα μου.',
    tool: 'draft_project',
  },
  referrals: {
    en: 'Who have I invited to CoFounderBay, and which invitations are still pending?',
    el: 'Ποιους έχω προσκαλέσει στο CoFounderBay, και ποιες προσκλήσεις εκκρεμούν ακόμη;',
    tool: 'get_invites',
  },
  shortlist: {
    en: 'I have saved profiles. Who should I reach out to first, and what should I write?',
    el: 'Έχω αποθηκευμένα προφίλ. Σε ποιον να απευθυνθώ πρώτα, και τι να του γράψω;',
    tool: 'get_shortlist',
  },
  // Asked from the founder home's cards.
  dashProfile: {
    en: 'Review my founder profile and suggest what would make it stronger for investors and co-founders.',
    el: 'Δες το προφίλ μου ως ιδρυτή και πες μου τι θα το έκανε πιο δυνατό για επενδυτές και συνιδρυτές.',
    tool: 'get_profile',
  },
  dashNeedCard: {
    en: 'Help me draft my first need card: ask me who my startup needs, then open the filled guide so I can review and publish it.',
    el: 'Βοήθησέ με να συντάξω την πρώτη μου κάρτα ανάγκης: ρώτα με ποιον χρειάζεται η startup μου και άνοιξε τον συμπληρωμένο οδηγό για να τον ελέγξω και να τον δημοσιεύσω.',
    tool: 'draft_need_card',
  },
  dashReadiness: {
    en: 'What should I improve next on venture readiness, given the lowest dimension on this dashboard?',
    el: 'Τι να βελτιώσω μετά στην ετοιμότητα της startup μου, με βάση τη χαμηλότερη διάσταση σε αυτόν τον πίνακα;',
    tool: 'get_readiness',
  },
  dashFundraising: {
    en: 'Review this fundraising round against my readiness and tell me the next investor action.',
    el: 'Έλεγξε αυτόν τον γύρο χρηματοδότησης σε σχέση με την ετοιμότητά μου και πες μου την επόμενη κίνηση προς τους επενδυτές.',
    tool: 'get_fundraising',
  },
  dashMatches: {
    en: 'How can I improve these matches and who should I reach out to first?',
    el: 'Πώς μπορώ να βελτιώσω αυτές τις αντιστοιχίσεις, και σε ποιον να απευθυνθώ πρώτα;',
    tool: 'get_recommendations',
  },
  dashBetterMatches: {
    en: 'How can I start receiving better matches from this profile?',
    el: 'Πώς θα αρχίσω να παίρνω καλύτερες αντιστοιχίσεις με αυτό το προφίλ;',
    tool: 'get_recommendations',
  },
  dashMilestones: {
    en: 'How do I hit these milestone dates, and what should I sequence first?',
    el: 'Πώς θα πετύχω αυτές τις ημερομηνίες ορόσημων, και με ποια σειρά να ξεκινήσω;',
    tool: 'get_milestones',
  },
  // Asked from an empty list: what to do while there is nothing here.
  calendarEmpty: {
    en: 'What should I put on my calendar first: milestones, a mentoring session, or an event?',
    el: 'Τι να βάλω πρώτα στο ημερολόγιό μου: ορόσημα, μια συνεδρία καθοδήγησης ή μια εκδήλωση;',
    tool: 'get_events',
  },
  compareEmpty: {
    en: 'Help me pick two or three people from my matches to compare as potential cofounders.',
    el: 'Βοήθησέ με να διαλέξω δύο ή τρία άτομα από τις αντιστοιχίσεις μου για να τα συγκρίνω ως πιθανούς συνιδρυτές.',
    tool: 'get_recommendations',
  },
  introsEmpty: {
    en: 'I have no intro requests yet. Who from my matches should I connect with first?',
    el: 'Δεν έχω ακόμη αιτήματα γνωριμίας. Με ποιους από τις αντιστοιχίσεις μου να συνδεθώ πρώτα;',
    tool: 'get_recommendations',
  },
  connectionsEmpty: {
    en: 'My connections list is empty. Who should I reach out to first from my matches?',
    el: 'Η λίστα των συνδέσεών μου είναι άδεια. Σε ποιον από τις αντιστοιχίσεις μου να απευθυνθώ πρώτα;',
    tool: 'get_recommendations',
  },
  discoverNobody: {
    en: 'Discover search returned nobody. Suggest filters and a prompt to find a technical cofounder.',
    el: 'Η αναζήτηση στην Ανακάλυψη δεν βρήκε κανέναν. Πρότεινε φίλτρα για να βρω τεχνικό συνιδρυτή.',
    tool: 'search_people',
  },
  discoverNoSuggestions: {
    en: 'I have no Discover suggestions. What should I add to my profile so recommendations appear?',
    el: 'Δεν έχω προτάσεις στην Ανακάλυψη. Τι να προσθέσω στο προφίλ μου για να εμφανιστούν;',
    tool: 'get_profile',
  },
  discoverMatchesEmpty: {
    en: 'Discover matches tab is empty. Help me find complementary people from the network.',
    el: 'Η καρτέλα αντιστοιχίσεων στην Ανακάλυψη είναι άδεια. Βοήθησέ με να βρω ανθρώπους που με συμπληρώνουν.',
    tool: 'get_recommendations',
  },
  eventsEmpty: {
    en: 'I have no events. Suggest how to use Events and Calendar to meet cofounders this month.',
    el: 'Δεν έχω εκδηλώσεις. Πρότεινε πώς να χρησιμοποιήσω τις Εκδηλώσεις και το Ημερολόγιο για να γνωρίσω συνιδρυτές αυτόν τον μήνα.',
    tool: 'get_events',
  },
  groupsManage: {
    en: 'How do I start and run a community on CoFounderBay?',
    el: 'Πώς ξεκινώ και πώς τρέχω μια κοινότητα στο CoFounderBay;',
    tool: 'get_groups',
  },
  groupsModeration: {
    en: 'Where do I handle reports about a member of my community?',
    el: 'Πού χειρίζομαι αναφορές για ένα μέλος της κοινότητάς μου;',
    tool: 'get_groups',
  },
  pipelineEmpty: {
    en: 'My investment pipeline is empty. How should I scout startups on CoFounderBay and what to shortlist first?',
    el: 'Το pipeline επενδύσεών μου είναι άδειο. Πώς να εντοπίσω startups στο CoFounderBay και ποιες να ξεχωρίσω πρώτες;',
    tool: 'get_investor_board',
  },
  portfolioEmpty: {
    en: 'My investor portfolio is empty. What should I review in the pipeline before marking a company as invested?',
    el: 'Το χαρτοφυλάκιό μου είναι άδειο. Τι να ελέγξω στο pipeline πριν σημειώσω μια εταιρεία ως επένδυση;',
    tool: 'get_investor_board',
  },
  mentorReviewsEmpty: {
    en: 'I have no mentor reviews yet. What should I do in sessions so mentees leave useful feedback?',
    el: 'Δεν έχω ακόμη κριτικές ως μέντορας. Τι να κάνω στις συνεδρίες ώστε οι καθοδηγούμενοι να αφήνουν χρήσιμα σχόλια;',
    tool: 'get_mentorship_sessions',
  },
  mentorsEmpty: {
    en: 'No mentors are listed yet. Which mentors are available for a first-time founder, and how do I book a session?',
    el: 'Δεν εμφανίζονται μέντορες ακόμη. Ποιοι μέντορες είναι διαθέσιμοι για κάποιον που ιδρύει πρώτη φορά, και πώς κλείνω συνεδρία;',
    tool: 'get_mentors',
  },
  sessionsEmpty: {
    en: 'I have no mentoring sessions. Recommend who to book and what to ask in the first call.',
    el: 'Δεν έχω συνεδρίες καθοδήγησης. Πρότεινε με ποιον να κλείσω και τι να ρωτήσω στην πρώτη κλήση.',
    tool: 'get_mentorship_sessions',
  },
  notificationsDone: {
    en: 'I am all caught up on notifications. What should I do next on Discover, Matches, or Messages?',
    el: 'Έχω δει όλες τις ειδοποιήσεις. Τι να κάνω μετά στην Ανακάλυψη, στις Αντιστοιχίσεις ή στα Μηνύματα;',
    tool: 'get_graph',
  },
  providerReviewsEmpty: {
    en: 'I have no client reviews yet. What should I do in inquiries and projects so reviews start appearing?',
    el: 'Δεν έχω ακόμη κριτικές πελατών. Τι να κάνω στα αιτήματα πελατών και στα projects ώστε να αρχίσουν να εμφανίζονται κριτικές;',
    tool: 'get_inquiries',
  },
  servicesEmpty: {
    en: 'I have not listed any services yet. Help me draft my first service listing.',
    el: 'Δεν έχω καταχωρίσει ακόμη υπηρεσίες. Βοήθησέ με να ετοιμάσω την πρώτη καταχώριση υπηρεσίας μου.',
    tool: 'draft_provider_listing',
  },
  readinessNoWorkspace: {
    en: 'I have no Startup Builder workspace yet. How do I start a readiness assessment?',
    el: 'Δεν έχω ακόμη χώρο εργασίας στον Startup Builder. Πώς ξεκινώ μια αξιολόγηση ετοιμότητας;',
    tool: 'get_builder_state',
  },
  referralsEmpty: {
    en: 'How do I invite a co-founder to CoFounderBay?',
    el: 'Πώς στέλνω πρόσκληση σε έναν συνιδρυτή στο CoFounderBay;',
    tool: 'get_invites',
  },
  savedSearchesEmpty: {
    en: 'I have no saved searches. Suggest a search I should save for a technical cofounder in my city.',
    el: 'Δεν έχω αποθηκευμένες αναζητήσεις. Πρότεινε μια αναζήτηση για τεχνικό συνιδρυτή στην πόλη μου, που αξίζει να κρατήσω.',
    tool: 'search_people',
  },
  automationNoOrg: {
    en: 'No organisation is selected here. How do I choose one, and what should I turn on first?',
    el: 'Δεν έχει επιλεγεί οργανισμός εδώ. Πώς επιλέγω έναν, και τι να ενεργοποιήσω πρώτα;',
    tool: 'get_graph',
  },
  builderReadiness: {
    en: 'Score my Startup Builder readiness. Which dimension is weakest, and what should I complete next in Idea Core, BMC, Market, or Pitch?',
    el: 'Βαθμολόγησε την ετοιμότητα του Startup Builder μου. Ποια διάσταση είναι η πιο αδύναμη, και τι να συμπληρώσω μετά: Πυρήνα ιδέας, BMC, Αγορά ή Pitch;',
    tool: 'get_builder_state',
  },
  shortlistEmpty: {
    en: 'I have no saved profiles. Who from my matches should I shortlist first?',
    el: 'Δεν έχω αποθηκευμένα προφίλ. Ποιους από τις αντιστοιχίσεις μου να αποθηκεύσω πρώτους;',
    tool: 'get_recommendations',
  },
  connectionsNone: {
    en: 'I have no connections yet. Which of my matches would make a complementary cofounder?',
    el: 'Δεν έχω ακόμη συνδέσεις. Ποια από τις αντιστοιχίσεις μου θα ήταν συμπληρωματικός συνιδρυτής;',
    tool: 'get_recommendations',
  },
  inboxEmpty: {
    en: 'My inbox is empty. Who should I message first from my matches or connections?',
    el: 'Τα εισερχόμενά μου είναι άδεια. Σε ποιον από τις αντιστοιχίσεις ή τις συνδέσεις μου να στείλω πρώτα;',
    tool: 'get_recommendations',
  },
  eventsNone: {
    en: 'There are no upcoming events. Suggest how I should use Events and Calendar to meet cofounders.',
    el: 'Δεν υπάρχουν επερχόμενες εκδηλώσεις. Πρότεινε πώς να χρησιμοποιήσω τις Εκδηλώσεις και το Ημερολόγιο για να γνωρίσω συνιδρυτές.',
    tool: 'get_events',
  },
  jobsNone: {
    en: 'Help me write a cofounder or early-hire job post based on my profile gaps.',
    el: 'Βοήθησέ με να γράψω αγγελία για συνιδρυτή ή για πρώτη πρόσληψη, με βάση τα κενά του προφίλ μου.',
    tool: 'get_jobs',
  },
  groupsNone: {
    en: 'I have not joined any groups. Which communities fit a founder looking for a technical cofounder?',
    el: 'Δεν είμαι μέλος σε καμία ομάδα. Ποιες κοινότητες είναι κατάλληλες για ιδρυτή που ψάχνει τεχνικό συνιδρυτή;',
    tool: 'get_groups',
  },
  notificationsNone: {
    en: 'I am all caught up on notifications. What should I do next on CoFounderBay?',
    el: 'Έχω δει όλες τις ειδοποιήσεις. Τι να κάνω μετά στο CoFounderBay;',
    tool: 'get_graph',
  },
  learningNone: {
    en: 'There are no learning resources yet. What should I study next given my venture readiness?',
    el: 'Δεν υπάρχουν ακόμη εκπαιδευτικοί πόροι. Τι να μελετήσω μετά, με βάση την ετοιμότητα της startup μου;',
    tool: 'get_learning',
  },
  marketplaceNone: {
    en: 'The marketplace is empty. Should I list a service of my own, and what should I do next?',
    el: 'Η αγορά υπηρεσιών είναι άδεια. Να καταχωρίσω δική μου υπηρεσία, και τι να κάνω μετά;',
    tool: 'get_graph',
  },
  sessionsNone: {
    en: 'I have no mentoring sessions yet. Which mentors are available for a first-time founder, and how do I book one?',
    el: 'Δεν έχω ακόμη συνεδρίες καθοδήγησης. Ποιοι μέντορες είναι διαθέσιμοι για κάποιον που ιδρύει πρώτη φορά, και πώς κλείνω συνεδρία;',
    tool: 'get_mentors',
  },
  // Asked from a "Sample data" note. A "why" question is answered from the page itself (`answer: 'samples'`); the others ask what to do meanwhile.
  dataRoomSample: {
    en: 'Why does the data room show sample documents?',
    el: 'Γιατί το data room δείχνει δείγματα εγγράφων;',
    answer: 'samples',
  },
  scoutingSample: {
    en: 'Why does scouting show sample startups?',
    el: 'Γιατί η ανίχνευση δείχνει δείγματα startups;',
    answer: 'samples',
  },
  earningsSample: {
    en: 'Why does the earnings page show sample transactions?',
    el: 'Γιατί η σελίδα εσόδων δείχνει δείγματα συναλλαγών;',
    answer: 'samples',
  },
  orgAdminSample: {
    en: 'Why does the organisation admin page show sample members?',
    el: 'Γιατί η σελίδα διαχείρισης του οργανισμού δείχνει δείγματα μελών;',
    answer: 'samples',
  },
  cohortSample: {
    en: 'Why am I seeing a sample cohort?',
    el: 'Γιατί βλέπω δείγμα κύκλου;',
    answer: 'samples',
  },
  orgCohortsSample: {
    en: 'Why does the cohorts page show sample cohorts?',
    el: 'Γιατί η σελίδα κύκλων δείχνει δείγματα κύκλων;',
    answer: 'samples',
  },
  orgEventsSample: {
    en: 'Why does the events page show sample events?',
    el: 'Γιατί η σελίδα εκδηλώσεων δείχνει δείγματα εκδηλώσεων;',
    answer: 'samples',
  },
  orgProgramsSample: {
    en: "Why does the organisation's programmes page show sample programmes?",
    el: 'Γιατί η σελίδα προγραμμάτων του οργανισμού δείχνει δείγματα προγραμμάτων;',
    answer: 'samples',
  },
  orgStartupsSample: {
    en: 'Why does the portfolio show sample startups?',
    el: 'Γιατί το χαρτοφυλάκιο δείχνει δείγματα startups;',
    answer: 'samples',
  },
  orgMentorsSample: {
    en: 'Why does the mentor pool show sample mentors?',
    el: 'Γιατί η δεξαμενή μεντόρων δείχνει δείγματα μεντόρων;',
    answer: 'samples',
  },
  providerAnalyticsSample: {
    en: 'Why does the analytics page show sample numbers?',
    el: 'Γιατί η σελίδα αναλυτικών δείχνει δείγματα αριθμών;',
    answer: 'samples',
  },
  apiKeysSample: {
    en: 'Why does the API keys page show sample keys?',
    el: 'Γιατί η σελίδα κλειδιών API δείχνει δείγματα κλειδιών;',
    answer: 'samples',
  },
  tenantProgramsSample: {
    en: 'Why does the programs page show sample programs?',
    el: 'Γιατί η σελίδα προγραμμάτων δείχνει δείγματα προγραμμάτων;',
    answer: 'samples',
  },
  webhooksSample: {
    en: 'Why does the webhooks page show sample endpoints?',
    el: 'Γιατί η σελίδα webhooks δείχνει δείγματα endpoints;',
    answer: 'samples',
  },
  adminProgramsSample: {
    en: 'Why does the admin programs page show sample programmes?',
    el: 'Γιατί η σελίδα προγραμμάτων της διαχείρισης δείχνει δείγματα προγραμμάτων;',
    answer: 'samples',
  },
  adminUsersSample: {
    en: 'Why does admin user management show sample accounts?',
    el: 'Γιατί η διαχείριση χρηστών δείχνει δείγματα λογαριασμών;',
    answer: 'samples',
  },
  endorsementsSample: {
    en: 'These endorsements are samples. Who should I ask for an endorsement first, and what should it say?',
    el: 'Αυτές οι συστάσεις είναι δείγματα. Από ποιον να ζητήσω πρώτα σύσταση, και τι να λέει;',
    tool: 'get_endorsements',
  },
  feedSample: {
    en: 'The feed is showing sample posts. What should I do next on Discover, Matches, or Messages instead?',
    el: 'Η ροή δείχνει δείγματα αναρτήσεων. Τι να κάνω μετά στην Ανακάλυψη, στις Αντιστοιχίσεις ή στα Μηνύματα;',
    tool: 'get_graph',
  },
  investorsSample: {
    en: 'Some investors here are samples. Which kind of investor suits my stage and industry, and how should I ask for an intro?',
    el: 'Κάποιοι επενδυτές εδώ είναι δείγματα. Ποιο είδος επενδυτή είναι κατάλληλο για το στάδιο και τον κλάδο μου, και πώς να ζητήσω γνωριμία;',
    tool: 'search_people',
  },
  marketplaceSample: {
    en: 'The marketplace is showing sample providers. How should I evaluate legal, finance, and coaching help for an early-stage startup?',
    el: 'Η αγορά υπηρεσιών δείχνει δείγματα παρόχων. Πώς να αξιολογήσω νομική, οικονομική βοήθεια και coaching για μια startup σε αρχικό στάδιο; Τι να κάνω πρώτα;',
    tool: 'get_graph',
  },
  matchesSignedOut: {
    en: 'I am not signed in. Explain how matching works on CoFounderBay and what I should complete after login.',
    el: 'Δεν έχω μπει στον λογαριασμό μου. Εξήγησε πώς λειτουργούν οι αντιστοιχίσεις στο CoFounderBay και τι να συμπληρώσω όταν μπω.',
    tool: 'get_recommendations',
  },
  matchesEmpty: {
    en: 'I have no matches yet. Tell me which profile fields to complete so I get better cofounder suggestions.',
    el: 'Δεν έχω ακόμη αντιστοιχίσεις. Πες μου ποια πεδία του προφίλ να συμπληρώσω για να παίρνω καλύτερες προτάσεις συνιδρυτών.',
    tool: 'get_recommendations',
  },
  opportunitiesSample: {
    en: 'These opportunities are samples. How should I judge a co-founder or investment opportunity when one arrives?',
    el: 'Αυτές οι ευκαιρίες είναι δείγματα. Πώς να κρίνω μια ευκαιρία για συνιδρυτή ή επένδυση όταν έρθει;',
    tool: 'get_opportunities',
  },
  adminCommunitiesSample: {
    en: 'The communities list is showing sample rows. Which communities are live, and what can you do with them here?',
    el: 'Η λίστα κοινοτήτων δείχνει δείγματα. Ποιες κοινότητες είναι ενεργές, και τι μπορείς να κάνεις με αυτές εδώ;',
    tool: 'get_groups',
  },
} satisfies Record<string, PageQuestion>;

export type AskKey = keyof typeof ASK;

/** Every ready question a page hands over, for the tests. */
export const PAGE_QUESTIONS: Record<string, PageQuestion> = {
  programs: PROGRAMS_QUESTION,
  ...ASK,
};
