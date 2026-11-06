#!/usr/bin/env node
/**
 * What can be checked about the Cloudflare deploy without an account or a build
 * (docs/CLOUDFLARE_DEPLOYMENT.md). It reads the repository, needs no secrets and
 * changes nothing; the last lines list what only the owner can add.
 *
 *   node scripts/check-cloudflare-readiness.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(repo, path), 'utf8');
const failures = [];
const check = (name, ok, fix) => {
  console.log(`${ok ? '✔' : '✖'} ${name}`);
  if (!ok) failures.push(`${name}: ${fix}`);
};

const wrangler = read('apps/web/wrangler.jsonc');
const openNext = read('apps/web/open-next.config.ts');
const workflow = read('.github/workflows/deploy-cloudflare.yml');
const pkg = JSON.parse(read('apps/web/package.json'));
const nextConfig = ['next.config.js', 'next.config.mjs', 'next.config.ts'].map((f) => `apps/web/${f}`).find((f) => existsSync(join(repo, f)));

check('wrangler points at the OpenNext worker', wrangler.includes('.open-next/worker.js'), 'set "main" to .open-next/worker.js');
check('nodejs_compat is on', wrangler.includes('nodejs_compat'), 'add it to compatibility_flags');
check('assets are bound', /"binding":\s*"ASSETS"/.test(wrangler), 'bind .open-next/assets as ASSETS');

// The failure of the first real deploy: a KV import with no KV binding, or the reverse.
const usesKv = /kv-incremental-cache/.test(openNext.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
const hasKv = /^\s*"kv_namespaces"/m.test(wrangler);
check('KV cache import and binding agree', usesKv === hasKv, 'change both or neither (see open-next.config.ts)');

check('build and deploy scripts exist', ['cf:build', 'cf:deploy', 'cf:preview'].every((s) => pkg.scripts?.[s]), 'add them to apps/web/package.json');
check('the adapter and wrangler are declared', Boolean(pkg.dependencies?.['@opennextjs/cloudflare'] ?? pkg.devDependencies?.['@opennextjs/cloudflare']) && Boolean(pkg.devDependencies?.wrangler ?? pkg.dependencies?.wrangler), 'add @opennextjs/cloudflare and wrangler');
check('the workflow builds shared before the web', workflow.indexOf('@cofounderbay/shared run build') !== -1 && workflow.indexOf('@cofounderbay/shared run build') < workflow.indexOf('cf:build'), 'build @cofounderbay/shared first');
check('the workflow passes the public variables', ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_API_URL'].every((v) => workflow.includes(`vars.${v}`)), 'pass them to the build step');
check('the workflow names missing secrets', workflow.includes('Missing repository secrets'), 'keep the credentials check');
check('the Node version is pinned', existsSync(join(repo, '.nvmrc')), 'add .nvmrc');
check('the API origin reaches the CSP', Boolean(nextConfig) && read(nextConfig).includes('connect-src'), 'name the API origin in connect-src');
check('migrations exist for a fresh database', existsSync(join(repo, 'apps/api/prisma/migrations/20261105120000_baseline_full_schema/migration.sql')), 'the API host runs prisma migrate deploy');
check('uploaded files are not tracked by git', read('.gitignore').includes('apps/api/private-uploads/'), 'ignore apps/api/uploads and private-uploads');

console.log(`
Only the owner can add these (docs/CLOUDFLARE_DEPLOYMENT.md, "Readiness"):
  GitHub secrets    CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
  GitHub variables  NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_URL
  Cloudflare        Workers Paid plan, and a custom domain for tenant routing
  API host          Node server, PostgreSQL, secrets, private file storage`);

if (failures.length) {
  console.error(`\n${failures.length} to fix:\n  ${failures.join('\n  ')}`);
  process.exitCode = 1;
}
