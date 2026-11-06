# Deploying CoFounderBay to Cloudflare Workers

The web app deploys as a **Worker**, not a static export: `middleware.ts`
resolves the tenant from the request hostname and enforces auth on every
request, and several routes render on demand — a static export would drop all
of that.

The adapter is [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare),
which compiles the Next.js server output into a Worker plus a static asset
bundle.

## Files

| File | Purpose |
|---|---|
| `apps/web/open-next.config.ts` | OpenNext adapter config; serves prerendered pages from the Worker's static assets (KV is an opt-in switch) |
| `apps/web/wrangler.jsonc` | Worker name, entrypoint, compatibility flags, asset binding, vars |
| `.github/workflows/deploy-cloudflare.yml` | Typecheck, build and deploy on push to `main`, or on demand |

## One-time setup

1. **Create an API token** at <https://dash.cloudflare.com/profile/api-tokens>
   using the *Edit Cloudflare Workers* template. It needs:
   - Account → Workers Scripts → Edit
   - Account → Workers KV Storage → Edit (only if you enable the KV cache)
   - Zone → Workers Routes → Edit (only if you attach a custom domain)

2. **Add repository secrets** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` — shown in the Workers & Pages sidebar

3. **Add repository variables**:
   - `NEXT_PUBLIC_SITE_URL` — the public origin, e.g. `https://cofounderbay.com`.
     It drives `metadataBase`, canonical URLs, `robots.txt` and `sitemap.xml`,
     so in production it must be the real origin.
   - `NEXT_PUBLIC_API_URL` — the NestJS API origin. It is also interpolated into
     the `connect-src` CSP directive in `next.config.ts`, so a wrong value here
     blocks the app's own API calls in the browser.

4. **(Optional) Cache the revalidating routes in KV**. By default the
   incremental cache is the read-only static-assets cache: prerendered pages
   come from the Worker's own assets and nothing else is needed. The routes
   that revalidate (`/profiles/[userId]`, `/org/[slug]`, the Open Graph
   fetches of the shareable layouts) then render fresh on every request. To
   cache them:
   ```bash
   cd apps/web
   npx wrangler kv namespace create NEXT_INC_CACHE_KV
   ```
   Paste the returned id into the commented `kv_namespaces` block in
   `wrangler.jsonc` **and** switch the import in `open-next.config.ts` to
   `kv-incremental-cache`. Do both or neither: with the KV import and no
   binding, `opennextjs-cloudflare deploy` stops at
   `No KV binding "NEXT_INC_CACHE_KV" found!` (the first deploy from `main`,
   run 37736389279, failed exactly there).

5. **Plan size**. The worker is about 8.3 MiB gzipped (41 MiB raw) for 153
   prerendered pages and the dynamic routes. Cloudflare accepts at most 3 MiB
   on the Workers Free plan and 10 MiB on Workers Paid, so the account needs
   Workers Paid. `pnpm exec wrangler deploy --dry-run --outdir /tmp/w` in
   `apps/web` after `pnpm run cf:build` prints the current figure.

## Readiness

`node scripts/check-cloudflare-readiness.mjs` checks what can be checked without
an account: the worker config, the KV pairing that failed the first deploy, the
workflow's order and variables, and that uploads stay out of git. It needs no
secrets and changes nothing.

Cloudflare carries the **web app only**. The API is a long-running NestJS server
with Prisma, WebSockets and file handling, so it needs its own host, and the web
app cannot do anything real until `NEXT_PUBLIC_API_URL` points at it.

What only the owner can add, in order:

1. **An API host** (any Node 22 server or container) with PostgreSQL. Start it
   with `node dist/main` after `pnpm --filter @cofounderbay/api build`.
2. **The database**, built by migrations: `prisma migrate deploy`. A database
   made earlier with `db push` is recorded once with `pnpm db:baseline`.
3. **API secrets**, from `apps/api/.env.example`: `DATABASE_URL`,
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` and the SMTP values.
4. **Private file storage for the data room.** Set `AWS_S3_BUCKET`,
   `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (`AWS_S3_ENDPOINT` for an
   S3-compatible store such as Cloudflare R2), and install `@aws-sdk/client-s3`
   on the host. Files go under `private/`: a bucket policy that opens `uploads/`
   to a CDN must not open that prefix. Without these the files sit on the API
   host's disk, in `apps/api/private-uploads`, so that disk must survive a
   redeploy and be backed up.
5. **GitHub**: the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`,
   and the variables `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` (steps 1–3
   of the one-time setup above).
6. **Cloudflare**: Workers Paid (see *Plan size*), and a custom domain with a
   wildcard route for tenants (see *Multi-tenant note*).
7. **The first deploy**: run the workflow by hand with `environment: preview`
   before merging to `main`, which deploys on every push.

After the first deploy, check against the real origin: sign-up and sign-in
(cookies and CSRF cross origins), one file upload and download, and the browser
console for CSP refusals. `scripts/isolated-backend-docker.cjs` proves the API
and its migrations on a throwaway database, not this cross-origin path.

## Deploying by hand

```bash
cd apps/web

pnpm run cf:build      # build the worker bundle
pnpm run cf:preview    # build, then run it locally on workerd (the real runtime)

npx wrangler login     # or export CLOUDFLARE_API_TOKEN=...
pnpm run cf:deploy     # build and ship
```

The first deploy prints the `*.workers.dev` URL.

## Verified locally

The bundle builds and boots on workerd. Against `wrangler dev`:

| Check | Result |
|---|---|
| `/` | 200 |
| `/pricing` | 200 |
| `/robots.txt`, `/sitemap.xml` | 200, correct contents |
| `/dashboard` unauthenticated | 307 → `/login?redirect=%2Fdashboard` — the auth middleware runs on the edge |
| Security headers | CSP, Permissions-Policy, COOP, CORP, HSTS and `Referrer-Policy: strict-origin-when-cross-origin` all present on the response |
| Metadata | OpenGraph and Twitter cards rendered; viewport carries no zoom lock |
| Fonts | Inter and Space Grotesk served from our own origin with fallback metrics |

## Multi-tenant note

`middleware.ts` derives the tenant slug from the request hostname
(`athens.cofounderbay.com` → `athens`). For that to work the Worker must receive
the real `Host` header, so attach a wildcard route (`*.cofounderbay.com/*`)
rather than relying on `*.workers.dev`, where every request arrives on the same
hostname and no tenant is ever resolved.
