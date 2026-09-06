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
- Backend regression tests: `pnpm --filter @cofounderbay/api test`. Configuration is `.devin/vitest.api.config.ts`; it preserves NestJS decorator metadata with TypeScript transpilation. The jobs HTTP tests use mocked authentication, Prisma, queue, and providers; they do not prove production JWT verification, database persistence, or Redis behavior.
- Backend typecheck: `pnpm --filter @cofounderbay/api exec tsc --noEmit --incremental false -p tsconfig.json`.
- Script regression tests: `node --test scripts/deploy.test.cjs scripts/platform-inventory.test.cjs`. Deployment tests extract functions and stub external side effects; they never execute a deployment. Bash-dependent checks require Git Bash on Windows or `CFB_TEST_BASH`.
- Static platform inventory: `node scripts/platform-inventory.cjs --summary`; omit `--summary` for JSON containing route, boundary, interaction, and API declaration candidates. Every inventory entry starts as `not_tested`; static presence is not proof of functional, accessibility, or authorization coverage.
- Keep `apiRequest` as a named export from `apps/web/src/lib/api.ts` for existing clients. `apiFetch` shares authentication and CSRF handling for non-JSON transports. Never automatically repeat an AI POST after partial streaming output or an authorization/rate-limit error.
