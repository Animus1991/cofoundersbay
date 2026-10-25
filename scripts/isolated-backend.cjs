'use strict';

/**
 * A fresh PostgreSQL cluster + the actual compiled Nest HTTP application.
 * No inherited credentials, dotenv files, production database or provider calls.
 * Requires local PostgreSQL tools and a built API/shared package.
 * Run: node scripts/isolated-backend.cjs
 * The cluster and HTTP process are stopped and removed on completion/failure.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { runChecks } = require('./isolated-backend-checks.cjs');

const repo = path.resolve(__dirname, '..');
const api = path.join(repo, 'apps/api');
const requireApi = createRequire(path.join(api, 'package.json'));
const main = path.join(api, 'dist/main.js');
if (!fs.existsSync(main)) throw new Error('Build the API first; isolated runner will not start the development bootstrap.');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cfb-isolated-'));
fs.chmodSync(root, 0o700);
const socket = path.join(root, 'socket');
fs.mkdirSync(socket, { mode: 0o700 });
const dataDir = path.join(root, 'data');
const results = [];
let server;
let postgresStarted = false;
let db;
let cleaning;
const cleanEnv = {
  PATH: process.env.PATH,
  HOME: root,
  LANG: 'C.UTF-8',
  NODE_ENV: 'test',
  CFB_ISOLATED_TEST: '1',
  CFB_TEST_SOCKET: socket,
  DATABASE_URL: `postgresql://cfb_test@localhost:55439/cfb_test?host=${encodeURIComponent(socket)}`,
  JWT_ACCESS_SECRET: crypto.randomBytes(48).toString('hex'),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  SCOUT_RUNS: 'off',
  EMAIL_VERIFICATION_REQUIRED: 'false',
};
const command = (file, args) => execFileSync(file, args, {
  env: cleanEnv, cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
});
async function cleanup() {
  if (cleaning) return cleaning;
  cleaning = (async () => {
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill('SIGTERM');
      await new Promise(resolve => {
        const timer = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 5000);
        server.once('exit', () => { clearTimeout(timer); resolve(); });
      });
    }
    if (db) await db.$disconnect();
    if (postgresStarted) command('pg_ctl', ['-D', dataDir, '-m', 'immediate', '-w', 'stop']);
    fs.rmSync(root, { recursive: true, force: true });
  })();
  return cleaning;
}
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => cleanup().finally(() => process.exit(130)));
}
async function freePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}
async function mainTest() {
  command('initdb', ['-D', dataDir, '-U', 'cfb_test', '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8']);
  command('pg_ctl', ['-D', dataDir, '-l', path.join(root, 'postgres.log'), '-o', `-h '' -k ${socket} -p 55439 -F`, '-w', 'start']);
  postgresStarted = true;
  command('createdb', ['-h', socket, '-p', '55439', '-U', 'cfb_test', 'cfb_test']);
  const schema = path.join(root, 'schema.prisma');
  fs.copyFileSync(path.join(api, 'prisma/schema.prisma'), schema);
  // This schema push can ONLY see the freshly initialized private socket.
  command(process.execPath, [requireApi.resolve('prisma/build/index.js'), 'db', 'push', '--schema', schema, '--skip-generate']);
  const { PrismaClient } = requireApi('@prisma/client');
  db = new PrismaClient({ datasources: { db: { url: cleanEnv.DATABASE_URL } } });
  const identity = await db.$queryRawUnsafe('SELECT current_database() AS name, inet_server_addr() AS address');
  assert.equal(identity[0].name, 'cfb_test');
  assert.equal(identity[0].address, null); // Unix socket, never the workspace DB.
  assert.equal(await db.user.count(), 0);
  results.push({ check: 'fresh_database_private_unix_socket', passed: true });

  cleanEnv.PORT = String(await freePort());
  cleanEnv.CORS_ORIGIN = `http://127.0.0.1:${cleanEnv.PORT}`;
  // Logs can contain ephemeral session data. Keep them private and delete them;
  // only allowlisted status/boolean results leave this directory.
  const log = fs.openSync(path.join(root, 'api.log'), 'w', 0o600);
  server = spawn(process.execPath, ['--require', path.join(__dirname, 'isolated-network.cjs'), main], {
    env: cleanEnv, cwd: root, stdio: ['ignore', log, log],
  });
  fs.closeSync(log);
  const base = `http://127.0.0.1:${cleanEnv.PORT}/api`;
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error('Isolated API exited before becoming ready.');
    try {
      const r = await fetch(`${base}/auth/me`, { signal: AbortSignal.timeout(1000) });
      if (r.status === 401) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Isolated API did not become ready within the test deadline.');
  await runChecks({ base, db, requireApi, results });
}
mainTest().then(() => {
  console.log(JSON.stringify({ passed: true, checks: results, scope: 'Real local PostgreSQL, real Nest HTTP/JWT/CSRF; not browser or external-provider E2E.' }, null, 2));
}).catch(error => {
  // Never dump HTTP bodies, cookie jars, tokens or child-process error objects.
  console.error(JSON.stringify({ passed: false, checks: results, error: error.message.split('\n')[0] || error.name }));
  process.exitCode = 1;
}).finally(cleanup);
