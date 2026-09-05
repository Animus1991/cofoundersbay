export type { BilingualPair, PageMetaEl } from './types';
export { bilingualAria, bilingualInline, fromPair } from './format';
export { COMMON_STRINGS, commonEn, commonEl } from './strings-common';
export { PAGE_META_EL, PAGE_META_EL_PATTERNS, getPageMetaEl } from './strings-pages';
export {
  NAV_LABEL_EL,
  NAV_SECTION_EL,
  SIDEBAR_MODE_EL,
  NAV_DESCRIPTION_EL,
  getNavLabelEl,
  getNavSectionEl,
  getNavDescriptionEl,
} from './strings-nav';
export {
  SEARCH_STRINGS,
  searchEn,
  searchEl,
  categoryLabelEn,
  categoryLabelEl,
  resultTypeEn,
  resultTypeEl,
  noMatchMessageEn,
  noMatchMessageEl,
  resultsSummaryEn,
  resultsSummaryEl,
  type SearchCategoryKey,
  type SearchResultTypeKey,
} from './strings-search';
export {
  PROFILE_STRINGS,
  profileEn,
  profileEl,
} from './strings-profile';
export {
  MATCHES_STRINGS,
  matchesEn,
  matchesEl,
} from './strings-matches';
export {
  DASHBOARD_STRINGS,
  dashboardEn,
  dashboardEl,
} from './strings-dashboard';
export {
  CONNECTIONS_STRINGS,
  connectionsEn,
  connectionsEl,
} from './strings-connections';
export {
  MESSAGES_STRINGS,
  messagesEn,
  messagesEl,
} from './strings-messages';
export {
  DISCOVER_STRINGS,
  discoverEn,
  discoverEl,
} from './strings-discover';
export {
  SETTINGS_STRINGS,
  settingsEn,
  settingsEl,
} from './strings-settings';
export {
  NOTIFICATIONS_STRINGS,
  notificationsEn,
  notificationsEl,
} from './strings-notifications';
export {
  READINESS_STRINGS,
  readinessEn,
  readinessEl,
} from './strings-readiness';
export {
  ACHIEVEMENTS_STRINGS,
  achievementsEn,
  achievementsEl,
} from './strings-achievements';
export {
  LanguagePreferenceProvider,
  useLanguagePreference,
  resolveBilingualPair,
  type PrimaryLanguage,
  type LanguageDisplayMode,
} from './LanguagePreferenceContext';
