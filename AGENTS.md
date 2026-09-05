# CoFounderBay project guidance

- Use pnpm (root packageManager: pnpm@9.14.2). The frontend is Next.js/React in apps/web, not Vite.
- Frontend interaction tests: `pnpm --filter @cofounderbay/web test`.
- Frontend typecheck without changing tracked build metadata: `pnpm --filter @cofounderbay/web exec tsc --noEmit --incremental false -p tsconfig.json`.
- Vitest configuration lives in `.devin/vitest.config.ts`. Tests are adjacent `src/**/*.test.{ts,tsx}` files using jsdom and Testing Library. Native Node webstorage is disabled in test workers when the runtime supports that flag, so jsdom owns localStorage.
- These tests do not establish real-browser layout, contrast, native contenteditable behavior, or backend persistence correctness. Verify those separately.
- `pnpm --filter @cofounderbay/web build` shares the `.next` output with development. Do not run a production build over a user's running development server.
- The existing frontend lint script invokes `next lint`; no ESLint flat configuration was found during the UI review. Do not report lint as passing based on TypeScript or build output.
- Keep EN and EL content. Use existing BilingualText / LanguagePreferenceContext conventions; rules from other workspace projects using `useLanguage` are not this application's translation API.
- Preserve existing operations and routes during UI changes. Inspect actual API behavior before claiming that demo mode prevents writes, a delete removes related records, or an archive is reversible.
- Use the existing shared UI components, semantic colors, and radius/type tokens. Review replacements contextually rather than blindly mapping every color or size (brand colors, chart encodings and canvas data may have different purposes).
