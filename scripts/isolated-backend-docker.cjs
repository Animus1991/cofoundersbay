'use strict';

/**
 * The isolated backend run for machines without local PostgreSQL tools.
 *
 * A throwaway postgres container on a random port and password, built only by
 * `prisma migrate deploy`, so this also proves the migrations make a working
 * database (docs §59.4.1, §111), and the compiled Nest app against it. Nothing
 * inherited: no dotenv, no provider keys, no other database. The container and
 * the private upload folder are removed at the end, pass or fail.
 *
 *   pnpm --filter @cofounderbay/api build
 *   node scripts/isolated-backend-docker.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { runChecks } = require('./isolated-backend-checks.cjs');
const { runProductChecks } = require('./isolated-backend-product-checks.cjs');

const repo = path.resolve(__dirname, '..');
const api = path.join(repo, 'apps/api');
const requireApi = createRequire(path.join(api, 'package.json'));
const main = path.join(api, 'dist/main.js');
if (!fs.existsSync(main)) throw new Error('Build the API first: pnpm --filter @cofounderbay/api build');

const name = `cfb-acceptance-${crypto.randomBytes(4).toString('hex')}`;
const password = crypto.randomBytes(18).toString('hex');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cfb-isolated-'));
const results = [];
let server;
let db;
let containerStarted = false;
let cleaning;

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

const docker = (args) => execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }).toString();

async function cleanup() {
  if (cleaning) return cleaning;
  cleaning = (async () => {
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill();
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 5000);
        server.once('exit', () => { clearTimeout(timer); resolve(); });
      });
    }
    if (db) await db.$disconnect().catch(() => undefined);
    if (containerStarted) { try { docker(['rm', '-f', name]); } catch { /* already gone */ } }
    fs.rmSync(root, { recursive: true, force: true });
  })();
  return cleaning;
}
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => cleanup().finally(() => process.exit(130)));

async function mainTest() {
  const dbPort = await freePort();
  docker(['run', '-d', '--rm', '--name', name, '-e', `POSTGRES_PASSWORD=${password}`, '-e', 'POSTGRES_DB=cfb_test', '-p', `127.0.0.1:${dbPort}:5432`, 'postgres:16-alpine']);
  containerStarted = true;
  for (let attempt = 0; ; attempt += 1) {
    // Over TCP: the image's first-run server listens on its socket only, then restarts.
    try { docker(['exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'cfb_test']); break; } catch {
      if (attempt > 60) throw new Error('The throwaway database did not start.');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const env = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    TEMP: root,
    TMP: root,
    HOME: root,
    NODE_ENV: 'test',
    CFB_ISOLATED_TEST: '1',
    DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${dbPort}/cfb_test`,
    JWT_ACCESS_SECRET: crypto.randomBytes(48).toString('hex'),
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '7d',
    SCOUT_RUNS: 'off',
    EMAIL_VERIFICATION_REQUIRED: 'false',
  };
  const prisma = requireApi.resolve('prisma/build/index.js');
  const schema = path.join(api, 'prisma/schema.prisma');
  execFileSync(process.execPath, [prisma, 'migrate', 'deploy', '--schema', schema], { env, cwd: api, stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 });
  results.push({ check: 'migrations_build_an_empty_database', passed: true });
  execFileSync(process.execPath, [prisma, 'migrate', 'diff', '--from-schema-datasource', schema, '--to-schema-datamodel', schema, '--exit-code'], { env, cwd: api, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  results.push({ check: 'migrated_database_matches_the_schema', passed: true });

  const { PrismaClient } = requireApi('@prisma/client');
  db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  if (await db.user.count() !== 0) throw new Error('The throwaway database was not empty.');

  env.PORT = String(await freePort());
  env.API_PORT = env.PORT;
  env.CORS_ORIGIN = `http://127.0.0.1:${env.PORT}`;
  const log = fs.openSync(path.join(root, 'api.log'), 'w', 0o600);
  server = spawn(process.execPath, [main], { env, cwd: root, stdio: ['ignore', log, log] });
  fs.closeSync(log);

  const base = `http://127.0.0.1:${env.PORT}/api`;
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      const tail = fs.readFileSync(path.join(root, 'api.log'), 'utf8').split('\n').slice(-12).join('\n');
      throw new Error(`The API exited before becoming ready:\n${tail}`);
    }
    try {
      const r = await fetch(`${base}/auth/me`, { signal: AbortSignal.timeout(1000) });
      if (r.status === 401) { ready = true; break; }
    } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('The API did not become ready within the deadline.');

  await runChecks({ base, db, requireApi, results });
  // The real rate limits stay on: sign-up allows three a minute and the API sixty
  // requests, so the checks wait out the window and then walk at a member's pace.
  await new Promise((resolve) => setTimeout(resolve, 61000));
  await runProductChecks({ base, db, results, password: `${crypto.randomBytes(16).toString('base64')}aA1!`, privateDir: path.join(api, 'private-uploads'), uploadsDir: path.join(api, 'uploads') });
}

mainTest().then(() => {
  console.log(JSON.stringify({ passed: true, count: results.length, checks: results.map((r) => r.check), scope: 'Throwaway PostgreSQL built by migrations, real Nest HTTP, JWT and CSRF; not a browser test.' }, null, 1));
}).catch((error) => {
  console.error(JSON.stringify({ passed: false, count: results.length, last: results.at(-1)?.check ?? null, error: String(error.message).split('\n').slice(0, 14).join(' | ') }, null, 1));
  process.exitCode = 1;
}).finally(cleanup);
