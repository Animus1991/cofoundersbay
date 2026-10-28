'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';

/**
 * The workspace's name, renamed where it is shown (docs §81.2, §111). The API
 * always took a new name; the page offered no way to give one, so a typo in
 * the name chosen at creation stayed for good. Enter saves, Escape leaves it
 * as it was, and an empty or unchanged name saves nothing.
 */
export function WorkspaceNameEditor({ name, onRename }: { name: string; onRename: (next: string) => Promise<void> }) {
  const sayOne = useBilingualString();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setValue(name);
  }, [name, editing]);
  useEffect(() => {
    if (editing) field.current?.select();
  }, [editing]);

  const next = value.trim();

  async function save() {
    if (!next || next === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1">
        <p className="page-section min-w-0 font-semibold tracking-tight text-foreground">{name}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          onClick={() => setEditing(true)}
          aria-label={bilingualAria('Rename the workspace', 'Μετονομασία του χώρου εργασίας')}
          title={sayOne('Rename', 'Μετονομασία')}
          data-keep-icon=""
        >
          <Pencil className="icon-sm" aria-hidden="true" />
        </Button>
      </span>
    );
  }

  return (
    <form
      className="flex min-w-0 items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Input
        ref={field}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setEditing(false);
          }
        }}
        maxLength={120}
        disabled={saving}
        aria-label={bilingualAria('Workspace name', 'Όνομα χώρου εργασίας')}
        className="h-9 min-w-0 max-w-xs"
      />
      <Button type="submit" size="icon" variant="outline" className="h-9 w-9 shrink-0" disabled={!next || saving} aria-label={bilingualAria('Save the name', 'Αποθήκευση του ονόματος')} data-keep-icon="">
        <Check className="icon-sm" aria-hidden="true" />
      </Button>
      <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setEditing(false)} aria-label={bilingualAria('Cancel', 'Ακύρωση')} data-keep-icon="">
        <X className="icon-sm" aria-hidden="true" />
      </Button>
    </form>
  );
}
