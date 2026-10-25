'use strict';

// Loaded only by isolated-backend.cjs, never by a normal application launch.
// This is a Node transport guard, not an OS/container security boundary.
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
if (process.env.NODE_ENV !== 'test' || process.env.CFB_ISOLATED_TEST !== '1') {
  throw new Error('The isolated transport guard requires the isolated test runner.');
}
const socketDir = process.env.CFB_TEST_SOCKET;
if (!socketDir || !socketDir.startsWith('/tmp/cfb-isolated-') ||
    (fs.statSync(socketDir).mode & 0o077) !== 0) {
  throw new Error('A private test socket directory is required.');
}
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const socketPath = typeof first === 'object' ? first?.path : typeof first === 'string' ? first : undefined;
  if (socketPath && path.dirname(socketPath) === socketDir) {
    return originalConnect.apply(this, args);
  }
  throw new Error('CFB isolated test: outbound TCP is disabled.');
};
// fetch/undici has its own connector; deny it explicitly as well.
globalThis.fetch = async () => { throw new Error('CFB isolated test: outbound fetch is disabled.'); };
