import './_group.css';
import { Button } from './_shared/button';
import { Input } from './_shared/input';
import { Textarea } from './_shared/textarea';

export function Current() {
  return (
    <main className="cfb-source min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">CoFounderBay · Shared component review</p>
          <h1 className="text-2xl font-semibold">A clear next step</h1>
          <p className="mt-2 text-muted-foreground">Existing source components, isolated from live accounts and data.</p>
        </header>
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Tell a potential co-founder what you need</h2>
          <div className="space-y-2">
            <label htmlFor="current-search" className="text-sm font-medium">Find a skill / Αναζήτηση δεξιότητας</label>
            <Input id="current-search" type="search" placeholder="Search skills or expertise" />
            <p className="text-xs text-muted-foreground">Use a specific skill, such as product design.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="current-message" className="text-sm font-medium">Your message / Το μήνυμά σου</label>
            <Textarea id="current-message" placeholder="Describe the person you would like to meet" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button">Save draft</Button>
            <Button type="button" variant="outline">Preview</Button>
            <Button type="button" variant="ghost">Cancel</Button>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">States and feedback</h2>
          <Input aria-label="Invalid title example" invalid defaultValue="Missing a clear title" />
          <p className="text-sm text-destructive">Add a title that explains what you need.</p>
          <div className="flex flex-wrap gap-3">
            <Button loading type="button">Saving draft</Button>
            <Button disabled type="button" variant="secondary">Send introduction</Button>
            <Button type="button" variant="destructive">Delete draft</Button>
          </div>
          <p className="text-xs text-muted-foreground">A source-component specimen, not a live submission form.</p>
        </section>
      </div>
    </main>
  );
}
