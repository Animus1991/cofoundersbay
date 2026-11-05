#!/usr/bin/env node
/**
 * Brings a database made with `prisma db push` under migrations (docs §59.4.1, §111).
 *
 * Such a database already has every table and no record of migrations, so
 * `prisma migrate deploy` would try to create tables that exist. This
 * records each migration as applied instead, but only after checking that
 * the database matches schema.prisma exactly: a database that is behind is
 * reported and left alone, because marking it migrated would hide the
 * tables it lacks. A migration already recorded is left as it is.
 *
 *   DATABASE_URL=… pnpm --filter @cofounderbay/api db:baseline
 *   DATABASE_URL=… pnpm --filter @cofounderbay/api db:baseline -- --dry-run
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(apiDir, 'prisma', 'migrations');
const schema = join(apiDir, 'prisma', 'schema.prisma');
const dryRun = process.argv.includes('--dry-run');

// Prisma's own entry, run by this Node: no shell, so nothing in an argument
// is re-read by one, and the database address stays in the environment.
const prismaCli = createRequire(join(apiDir, 'package.json')).resolve('prisma/build/index.js');

function prisma(args) {
  return spawnSync(process.execPath, [prismaCli, ...args], { cwd: apiDir, encoding: 'utf8', env: process.env });
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) fail('DATABASE_URL is not set.');

const migrations = readdirSync(migrationsDir)
  .filter((name) => statSync(join(migrationsDir, name)).isDirectory())
  .sort();
if (!migrations.length) fail(`No migrations in ${migrationsDir}.`);

// 1. The database must match the schema, table for table, column for column.
const diff = prisma(['migrate', 'diff', '--from-schema-datasource', schema, '--to-schema-datamodel', schema, '--exit-code']);
if (diff.status === 2) {
  // The first lines of what differs; the full list comes from `prisma migrate diff`.
  const summary = `${diff.stdout ?? ''}${diff.stderr ?? ''}`.trim().split(/\r?\n/);
  console.log(summary.slice(0, 40).join('\n'));
  if (summary.length > 40) console.log(`… and ${summary.length - 40} more lines`);
  fail('The database differs from schema.prisma (above). Bring it level first (in development: `prisma db push`), then run this again.');
}
if (diff.status !== 0) {
  console.error(diff.stderr || diff.stdout);
  fail('Could not compare the database with the schema.');
}
console.log('✔ The database matches schema.prisma.');

// 2. Record every migration as applied.
for (const name of migrations) {
  if (dryRun) {
    console.log(`(dry run) would record ${name} as applied`);
    continue;
  }
  const resolved = prisma(['migrate', 'resolve', '--applied', name, '--schema', schema]);
  const said = `${resolved.stdout ?? ''}${resolved.stderr ?? ''}`;
  if (resolved.status !== 0 && !/already recorded as applied/i.test(said)) {
    console.error(said);
    fail(`Could not record ${name}.`);
  }
  console.log(`✔ ${name} recorded as applied`);
}

if (!dryRun) {
  const status = prisma(['migrate', 'status', '--schema', schema]);
  process.stdout.write(status.stdout ?? '');
  if (status.status !== 0) fail('`prisma migrate status` does not report the database up to date.');
}
console.log('\nFrom now on, `prisma migrate deploy` keeps this database up to date.');
