/**
 * The Builder's text fields the assistant can write (docs §114): the nine blocks
 * of the canvas and the idea core's six. The names are the page's own labels,
 * in both languages, so what a founder reads is what a founder can ask for.
 */

export type BuilderField = {
  document: 'bmc' | 'ideaCore';
  key: string;
  en: string;
  el: string;
  /** Other ways people say it. */
  aliases?: readonly string[];
};

export const BUILDER_FIELDS: readonly BuilderField[] = [
  { document: 'bmc', key: 'keyPartners', en: 'Key Partners', el: 'Βασικοί συνεργάτες', aliases: ['partners', 'συνεργάτες'] },
  { document: 'bmc', key: 'keyActivities', en: 'Key Activities', el: 'Βασικές δραστηριότητες', aliases: ['activities', 'δραστηριότητες'] },
  { document: 'bmc', key: 'keyResources', en: 'Key Resources', el: 'Βασικοί πόροι', aliases: ['resources', 'πόροι'] },
  { document: 'bmc', key: 'valuePropositions', en: 'Value Propositions', el: 'Προτάσεις αξίας', aliases: ['value proposition', 'πρόταση αξίας'] },
  { document: 'bmc', key: 'customerRelationships', en: 'Customer Relationships', el: 'Σχέσεις πελατών' },
  { document: 'bmc', key: 'channels', en: 'Channels', el: 'Κανάλια' },
  { document: 'bmc', key: 'customerSegments', en: 'Customer Segments', el: 'Τμήματα πελατών', aliases: ['segments', 'πελάτες'] },
  { document: 'bmc', key: 'costStructure', en: 'Cost Structure', el: 'Δομή κόστους', aliases: ['costs', 'κόστη'] },
  { document: 'bmc', key: 'revenueStreams', en: 'Revenue Streams', el: 'Ροές εσόδων', aliases: ['revenue', 'έσοδα'] },
  { document: 'ideaCore', key: 'problemStatement', en: 'Problem Statement', el: 'Δήλωση προβλήματος', aliases: ['problem', 'πρόβλημα'] },
  { document: 'ideaCore', key: 'targetAudience', en: 'Target Audience', el: 'Κοινό', aliases: ['audience', 'κοινό στόχος'] },
  { document: 'ideaCore', key: 'solution', en: 'Your Solution', el: 'Η λύση σας', aliases: ['solution', 'λύση'] },
  { document: 'ideaCore', key: 'uniqueValue', en: 'Unique Value Proposition', el: 'Μοναδική πρόταση αξίας', aliases: ['unique value', 'μοναδική αξία'] },
  { document: 'ideaCore', key: 'timing', en: 'Why Now', el: 'Γιατί τώρα', aliases: ['timing'] },
  { document: 'ideaCore', key: 'marketSize', en: 'Market Size', el: 'Μέγεθος αγοράς', aliases: ['market', 'αγορά'] },
];

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[?;:.]/g, '').trim();

/** The field a person named. Exact only: writing to the wrong block is worse than asking again. */
export function findBuilderField(ref: string): BuilderField | undefined {
  const wanted = plain(ref).replace(/^(the|το|τα|τη|την|τον|τις|στο|στα|στη|στην|στον|στις)\s+/, '');
  if (!wanted) return undefined;
  return BUILDER_FIELDS.find((field) => [field.en, field.el, ...(field.aliases ?? [])].some((name) => plain(name) === wanted));
}

export type BuilderFieldChange = { document: BuilderField['document']; key: string; before: string };

export type BuilderEditor = {
  setField: (field: BuilderField, content: string) => Promise<BuilderFieldChange>;
  restoreField: (document: BuilderField['document'], key: string, content: string) => Promise<void>;
};

let editor: BuilderEditor | null = null;

/** The Builder page registers itself while it is open; writing past it would leave the screen stale. */
export function registerBuilderEditor(next: BuilderEditor): () => void {
  editor = next;
  return () => {
    if (editor === next) editor = null;
  };
}

export function builderEditor(): BuilderEditor | null {
  return editor;
}
