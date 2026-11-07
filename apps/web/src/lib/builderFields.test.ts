import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILDER_FIELDS, builderEditor, findBuilderField, registerBuilderEditor, type BuilderEditor } from './builder-fields';
import { planCopilotTools } from './copilot-planner';
import { executeAction, undoAction } from './action-registry';

const args = (message: string) => planCopilotTools(message).find((tool) => tool.name === 'set_builder_field')?.args;

describe('which field a person means', () => {
  it('takes the page\'s labels, in either language, with or without accents', () => {
    expect(findBuilderField('Προτάσεις αξίας')?.key).toBe('valuePropositions');
    expect(findBuilderField('value propositions')?.key).toBe('valuePropositions');
    expect(findBuilderField('το προβλημα')?.key).toBe('problemStatement');
    expect(findBuilderField('τα κανάλια')?.key).toBe('channels');
  });

  it('guesses nothing: a wrong block is worse than asking again', () => {
    expect(findBuilderField('το όνομα της εταιρείας')).toBeUndefined();
    expect(findBuilderField('')).toBeUndefined();
  });

  it('gives every field a name of its own', () => {
    const names = BUILDER_FIELDS.flatMap((field) => [field.en, field.el, ...(field.aliases ?? [])].map((name) => name.toLowerCase()));
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('from the chat', () => {
  it('reads the field and the text', () => {
    expect(args('Άλλαξε τα Κανάλια σε: Συνεργάτες και LinkedIn')).toEqual({ field: 'channels', content: 'Συνεργάτες και LinkedIn' });
    expect(args('Set the value proposition to: Find a co-founder in a week')).toEqual({ field: 'valuePropositions', content: 'Find a co-founder in a week' });
    expect(args('Γράψε στη Δομή κόστους: Μισθοί και hosting')).toEqual({ field: 'costStructure', content: 'Μισθοί και hosting' });
  });

  it('leaves everything else alone', () => {
    expect(args('Τι είναι τα κανάλια;')).toBeUndefined();
    expect(args('Change the theme to: dark')).toBeUndefined();
    expect(args('Άλλαξε τη διαφάνεια Πρόβλημα σε: Κείμενο')).toBeUndefined();
  });
});

describe('the capability', () => {
  afterEach(() => {
    registerBuilderEditor({ setField: vi.fn(), restoreField: vi.fn() })();
  });

  it('says so when the Builder is not open, and changes nothing', async () => {
    expect(builderEditor()).toBeNull();
    await expect(executeAction('set_builder_field', { field: 'channels', content: 'x' })).resolves.toMatchObject({ ok: false });
  });

  it('writes through the page and keeps the earlier text for Undo', async () => {
    const editor: BuilderEditor = {
      setField: vi.fn(async () => ({ document: 'bmc' as const, key: 'channels', before: 'Old' })),
      restoreField: vi.fn(async () => undefined),
    };
    const clear = registerBuilderEditor(editor);
    const done = await executeAction('set_builder_field', { field: 'channels', content: 'New' });
    expect(done).toEqual({ ok: true, undo: { document: 'bmc', key: 'channels', before: 'Old' } });
    await undoAction('set_builder_field', {}, done.undo);
    expect(editor.restoreField).toHaveBeenCalledWith('bmc', 'channels', 'Old');
    clear();
  });

  it('refuses a field that is not there', async () => {
    const clear = registerBuilderEditor({ setField: vi.fn(), restoreField: vi.fn() });
    await expect(executeAction('set_builder_field', { field: 'nothing', content: 'x' })).resolves.toMatchObject({ ok: false });
    clear();
  });
});
