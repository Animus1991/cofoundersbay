'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function probe(code, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cfb-isolated-'));
  fs.chmodSync(root, 0o700);
  try {
    return spawnSync(process.execPath, ['--require', path.join(__dirname, 'isolated-network.cjs'), '-e', code], {
      env: { NODE_ENV: 'test', CFB_ISOLATED_TEST: '1', CFB_TEST_SOCKET: root, ...overrides },
      encoding: 'utf8', timeout: 5000,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
test('guard refuses a non-test launch', () => {
  const result = probe('', { NODE_ENV: 'production' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires the isolated test runner/);
});
test('outbound TCP is denied before a connection is made', () => {
  const result = probe(`
    const assert = require('node:assert/strict');
    const net = require('node:net');
    assert.throws(() => net.connect({host:'192.0.2.1',port:443}), /outbound TCP is disabled/);
    assert.throws(() => net.connect({host:'127.0.0.1',port:5432}), /outbound TCP is disabled/);
  `);
  assert.equal(result.status, 0, result.stderr);
});
test('fetch cannot contact external providers', () => {
  const result = probe(`
    require('node:assert/strict').rejects(fetch('https://example.invalid'), /outbound fetch is disabled/);
  `);
  assert.equal(result.status, 0, result.stderr);
});
test('a connection to the private socket remains possible', () => {
  const result = probe(`
    const net = require('node:net');
    const socket = require('node:path').join(process.env.CFB_TEST_SOCKET,'test.sock');
    const server = net.createServer(s => s.end());
    server.listen(socket, () => {
      const client = net.connect(socket);
      client.on('error', () => process.exit(1));
      client.on('end', () => server.close());
    });
  `);
  assert.equal(result.status, 0, result.stderr);
});
