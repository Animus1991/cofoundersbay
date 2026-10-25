'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const requireWeb = createRequire(path.join(__dirname, '../apps/web/package.json'));
const { isCsrfOriginAllowed } = requireWeb('next/dist/server/app-render/csrf-protection');
const config = fs.readFileSync(path.join(__dirname, '../apps/web/next.config.ts'), 'utf8');
const declaration = config.match(/const allowedDevOrigins = \[([^\]]+)\]/);
assert.ok(declaration, 'Development origin allowlist must be present');
const origins = [...declaration[1].matchAll(/'([^']+)'/g)].map(match => match[1]);

test('preview origins support direct and nested Replit hosts', () => {
  for (const host of ['workspace.replit.dev', 'workspace.picard.replit.dev', 'localhost', '127.0.0.1']) {
    assert.equal(isCsrfOriginAllowed(host, origins), true, host);
  }
});
test('unrelated domains remain blocked', () => {
  for (const host of ['example.com', 'replit.dev.example.com', 'fake-replit.dev']) {
    assert.equal(isCsrfOriginAllowed(host, origins), false, host);
  }
});
