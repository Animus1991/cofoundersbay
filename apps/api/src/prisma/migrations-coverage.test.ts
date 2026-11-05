import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every model has a table that a migration creates (docs §59.4.1, §111).
 *
 * Until the baseline, the migrations created 65 of 212 tables, so
 * `prisma migrate deploy` on an empty database built most of the product
 * without its tables. A model added with `db push` and no migration fails
 * here; `prisma migrate dev --name <change>` writes the missing one.
 */
const prismaDir = join(__dirname, '..', '..', 'prisma');

function modelTables(schema: string): string[] {
  const tables: string[] = [];
  for (const match of schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const mapped = match[2].match(/@@map\("([^"]+)"\)/);
    tables.push(mapped ? mapped[1] : match[1]);
  }
  return tables;
}

function createdTables(): Set<string> {
  const created = new Set<string>();
  for (const name of readdirSync(join(prismaDir, 'migrations'))) {
    const dir = join(prismaDir, 'migrations', name);
    if (!statSync(dir).isDirectory()) continue;
    const sql = readFileSync(join(dir, 'migration.sql'), 'utf8');
    for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"([^"]+)"/g)) created.add(m[1]);
  }
  return created;
}

describe('migrations cover the schema', () => {
  it('create a table for every model', () => {
    const schema = readFileSync(join(prismaDir, 'schema.prisma'), 'utf8');
    const tables = modelTables(schema);
    expect(tables.length).toBeGreaterThan(200);
    const created = createdTables();
    expect(tables.filter((t) => !created.has(t))).toEqual([]);
  });
});
