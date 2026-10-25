import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inventory = resolve(repo, 'docs/audit/dynamic-index.json');
const routeAudit = resolve(repo, 'scripts/uiux-resumable-audit.mjs');

test('the route audit applies only the documented logo exemption, not a contrast-rule bypass', () => {
  const source = readFileSync(routeAudit, 'utf8');
  assert.match(source, /\.exclude\(['"]\[data-logotype\]['"]\)/);
  assert.match(source, /Do not disable color-contrast/);
  assert.doesNotMatch(source, /['"]color-contrast['"]\s*:\s*\{\s*enabled:\s*false/);
  assert.match(source, /theme === 'light' \? 'studio'/,
    'The light preference is rendered using the studio theme token');
});

test('dynamic audit covers every source route without inventing unverified fixtures', () => {
  const result = spawnSync(process.execPath, ['scripts/uiux-dynamic-audit.mjs', '--summary-only'], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(readFileSync(inventory, 'utf8'));
  assert.equal(report.inventory.length, 21);
  assert.equal(report.inventory.filter(item => item.fixtureStatus === 'source_confirmed_sample_only').length, 14);
  assert.equal(report.inventory.filter(item => item.fixtureStatus === 'blocked_no_valid_detail_fixture').length, 7);
  assert.equal(report.rows.length, 224);
  const addedTemplates = ['/c/[token]', '/commitments/[id]', '/join/[token]', '/u/[token]'];
  const addedCells = report.rows.filter(row => addedTemplates.includes(row.template));
  assert.equal(addedCells.length, 64);
  assert.ok(addedCells.every(row => row.status === 'not_tested'),
    'The 64 new cells must be explicitly untested until browser observations exist');

  const byTemplate = new Map(report.inventory.map(item => [item.template, item]));
  for (const [template, fixture] of [
    ['/c/[token]', 'harbor-commercial-demo'],
    ['/commitments/[id]', 'need-athens-intros'],
    ['/join/[token]', 'demo-invite-katerina'],
    ['/u/[token]', 'demo-alex-sept'],
  ]) {
    assert.equal(byTemplate.get(template)?.known, fixture, `Source-confirmed fixture for ${template}`);
  }
  for (const item of report.inventory.filter(entry => entry.fixtureStatus === 'blocked_no_valid_detail_fixture')) {
    assert.ok(item.blocked, `Blocked route ${item.template} must explain what evidence is missing`);
  }
  assert.match(report.scope, /no real authorization/i);
  assert.match(report.caveat, /HTTP 200 is not proof/i);
});
