# Disposable real-backend checks

## Verified checkpoint — 2026-11-06

`scripts/isolated-backend-docker.cjs` passed **102 named checks** against the
compiled Nest API. It is the runner for Windows and for machines without local
PostgreSQL tools, and it adds what the socket runner below does not have:

- The database is a throwaway `postgres:16-alpine` container on a random port,
  built **only** by `prisma migrate deploy`. A `migrate diff --exit-code` then
  proves the migrated database equals `schema.prisma`.
- It runs the identity checks below, then `isolated-backend-product-checks.cjs`.
- Those cover notification Save, admin reports, answer ratings, fundraising,
  the data room, proposals on a listing, portfolios and server-side rich text
  cleaning. They read the row and the file on disk, not only the response.

From the repository root, with Docker running:

```sh
pnpm --filter @cofounderbay/shared build
pnpm --filter @cofounderbay/api exec prisma generate
pnpm --filter @cofounderbay/api exec nest build
node scripts/isolated-backend-docker.cjs
```

A run takes about four minutes, because the client paces itself under the
per-IP throttle. The report lists every check by name. The container runs on
the host's network stack, so the outbound guard of the socket runner does not
apply here. Storage checks cover the local disk; the S3 path is not exercised.

## Verified checkpoint — 2026-10-25

The new harness passed **28 checks** using the actual compiled Nest application,
real HTTP authentication/CSRF middleware and a fresh PostgreSQL 16 cluster.
There are no mocked JWT guards, Prisma delegates or shortlist controllers in
this run. This supersedes the previous checkpoint's absence of live-backend
evidence **only for the flows listed here**.

Verified:

- Fresh empty database reached exclusively through its private Unix socket.
- Anonymous and malformed-JWT requests rejected with 401.
- Two real public registrations, persisted users and hashed passwords.
- Cookie-authenticated access to the current user.
- Missing CSRF header rejected with 403 and no persisted write.
- Shortlist create, edit and delete, with direct database assertions.
- Another account cannot edit the owner's shortlist item; its note is unchanged.
- A fresh login/session reads the saved note.
- Incorrect password rejected.
- Real refresh, refusal to replay the rotated token, logout and refusal to reuse
  the revoked refresh token.
- Sessions for all six account roles. Founder/mentor originate from real
  registration; investor/org/admin/super_admin are explicit database fixtures
  with Argon2 passwords and go through real login/JWT validation.

Earlier setup attempts correctly stopped: one test initially assumed an
unwrapped `/auth/me` response, and privileged fixture creation initially omitted
the required user slug. Both were harness issues, not application defects.
The final fresh-cluster run passed. No application authentication check was
weakened to make it pass.

## Isolation

`scripts/isolated-backend.cjs` creates a unique `/tmp/cfb-isolated-*` directory
with mode 0700 and a new PostgreSQL cluster. PostgreSQL has **no TCP listener**;
host authentication is rejected. Trust authentication is limited to the private
Unix socket of this disposable cluster.

The API receives an allowlisted child environment, not the workspace environment.
Its JWT signing secret is generated for that process. `HOME` points into the
temporary directory. The combination `NODE_ENV=test` and `CFB_ISOLATED_TEST=1`
prevents Nest ConfigModule from importing any workspace dotenv files.
Normal launches retain their existing configuration behavior.

The runner explicitly sets `EMAIL_VERIFICATION_REQUIRED=false`; it does not
exercise deployments where verified email is required. Scheduled scout runs
are disabled. No email or external identity provider is contacted.

Prisma `db push --skip-generate` uses a copy of the application's schema and an
explicit datasource pointing at that new cluster. No existing database is read,
modified or migrated. The schema is disposable; this is not a new migration
history and not a replacement application database.

The API binds to a free loopback port. `isolated-network.cjs` rejects outbound
Node TCP and fetch calls, allowing only sockets inside the private directory.
This guard is defense in depth, **not an OS/container network sandbox** and not
a claim that arbitrary native code is network-isolated. Prisma's native client
uses the explicit private database datasource.

API logs may contain transient credentials or user data, so they stay in the
private temporary directory and are deleted, not printed or committed.
Reports contain only named checks and pass/fail outcomes.
The runner stops both processes and removes the directory on normal completion,
failure, SIGINT and SIGTERM. SIGKILL/container loss cannot run JavaScript cleanup.

Four transport-guard tests also passed: refusal outside test mode, outbound TCP
denial (including other localhost ports), fetch denial, and private-socket access.

## Reproduce

Prerequisites: Node 22, pnpm 9.14.2, installed project dependencies, PostgreSQL
tools (`initdb`, `pg_ctl`, `createdb`) on PATH and a generated Prisma client.
From `cofoundersbay/`:

```sh
npx --yes pnpm@9.14.2 --filter @cofounderbay/shared build
npx --yes pnpm@9.14.2 --filter @cofounderbay/api exec prisma generate
npx --yes pnpm@9.14.2 --filter @cofounderbay/api exec tsc -p tsconfig.build.json --incremental false
node --test scripts/isolated-network.test.cjs
node scripts/isolated-backend.cjs
```

Do not run `dev:api`, `db:seed` or a schema push against an inherited
`DATABASE_URL` as a substitute for this harness.

The test backend is deliberately short-lived and not publicly routed.
The existing application preview remains available and continues using demo
data; it is not silently pointed at the disposable database.

## Still unverified

- Browser form submission, reload and UI updates with the real backend.
- Full role/permission matrix, persona and tenant/resource boundaries.
- Every create/edit/delete action beyond the shortlist and the flows of the
  2026-11-06 checkpoint.
- Expired access JWTs, OAuth, 2FA, email verification and password-reset delivery.
- Concurrent writes, server restart/disk durability and load/performance.
- Redis workers, search indexing, email, payment providers, storage and real LLMs.
- Full-platform visual, accessibility and usability review.

Passing this bounded integration test does not establish production readiness,
WCAG conformance or exhaustive functional coverage.
