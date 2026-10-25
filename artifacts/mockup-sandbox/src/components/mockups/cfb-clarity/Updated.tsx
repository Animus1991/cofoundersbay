import './_group.css';
import './_updated.css';
import { useState } from 'react';
import { Button } from './_updated/button';
import { Input } from './_updated/input';
import { Textarea } from './_updated/textarea';

export function Updated() {
  const [note, setNote] = useState('Local demonstration only. Nothing here is saved or sent.');
  const demo = (what: string) => () => setNote(`Local demonstration: "${what}" was clicked. Nothing was saved or sent.`);
  const [title, setTitle] = useState('');
  return (
    <main className="cfb-source cfb-updated min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">CoFounderBay · Shared component review (updated)</p>
          <h1 className="text-2xl font-semibold">A clear next step</h1>
          <p className="mt-2 text-muted-foreground">Improved copies of the shared components. All actions are local demonstrations.</p>
        </header>
        <p data-demo-note role="status" aria-live="polite">{note}</p>
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Tell a potential co-founder what you need</h2>
          <div className="space-y-2">
            <label htmlFor="upd-search" className="text-sm font-medium">Find a skill / Αναζήτηση δεξιότητας</label>
            <Input id="upd-search" type="search" placeholder="Search skills or expertise" aria-describedby="upd-search-help" />
            <p id="upd-search-help" data-field-help className="text-xs text-muted-foreground">Use a specific skill, such as product design.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="upd-message" className="text-sm font-medium">Your message / Το μήνυμά σου</label>
            <Textarea id="upd-message" placeholder="Describe the person you would like to meet" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={demo('Save draft')}>Save draft (demo)</Button>
            <Button type="button" variant="outline" onClick={demo('Preview')}>Preview (demo)</Button>
            <Button type="button" variant="ghost" onClick={demo('Cancel')}>Cancel (demo)</Button>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">States and feedback</h2>
          <Input aria-label="Title example" aria-describedby="upd-title-err" invalid={!title} value={title} onChange={(e) => setTitle(e.target.value)} />
          {!title && <p id="upd-title-err" data-field-error role="alert">Error: add a title that explains what you need.</p>}
          <div className="flex flex-wrap gap-3">
            <Button loading type="button">Saving draft</Button>
            <Button disabled type="button" variant="secondary">Send introduction</Button>
            <Input disabled aria-label="Disabled example" defaultValue="Disabled field" className="max-w-[12rem]" />
            <Button type="button" variant="destructive" onClick={demo('Delete draft')}>Delete draft (demo)</Button>
          </div>
          <p className="text-xs text-muted-foreground">An updated specimen, not a live submission form.</p>
        </section>
      </div>
    </main>
  );
}

export default Updated;
