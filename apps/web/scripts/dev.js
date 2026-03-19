'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ensureSupportedNode } = require('../../../scripts/ensure-supported-node.cjs');

ensureSupportedNode('web-dev');

const webDir = path.resolve(__dirname, '..');
const nextDir = path.join(webDir, '.next');
const runtimeMetaPath = path.join(nextDir, 'dev-runtime.json');
const nextPackageJsonPath = require.resolve('next/package.json', { paths: [webDir] });
const nextVersion = require(nextPackageJsonPath).version;
const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== '--clean');
const forceClean = process.argv.includes('--clean');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function runtimeChanged() {
  const existing = readJson(runtimeMetaPath);
  if (!existing) {
    return fs.existsSync(nextDir);
  }

  return (
    existing.node !== process.version ||
    existing.next !== nextVersion ||
    existing.platform !== process.platform
  );
}

if (forceClean || runtimeChanged()) {
  console.log('Cleaning stale .next output before starting Next.js dev...');
  fs.rmSync(nextDir, { recursive: true, force: true });
}

fs.mkdirSync(nextDir, { recursive: true });
fs.writeFileSync(
  runtimeMetaPath,
  JSON.stringify(
    {
      node: process.version,
      next: nextVersion,
      platform: process.platform,
    },
    null,
    2,
  ),
);

const nextBin = require.resolve('next/dist/bin/next', { paths: [webDir] });
const child = spawn(process.execPath, [nextBin, 'dev', ...forwardedArgs], {
  cwd: webDir,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(`Failed to start Next.js dev server: ${error.message}`);
  process.exit(1);
});
