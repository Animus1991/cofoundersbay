'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ensureSupportedNode } = require('../../../scripts/ensure-supported-node.cjs');

ensureSupportedNode(process.argv.includes('--debug') ? 'api-debug' : 'api-dev');

const apiDir = path.resolve(__dirname, '..');
const distDir = path.join(apiDir, 'dist');
const runtimeMetaPath = path.join(distDir, 'dev-runtime.json');
const tsBuildInfoPath = path.join(apiDir, 'tsconfig.build.tsbuildinfo');
const nestPackageJsonPath = require.resolve('@nestjs/core/package.json', { paths: [apiDir] });
const nestVersion = require(nestPackageJsonPath).version;
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
    return fs.existsSync(distDir) || fs.existsSync(tsBuildInfoPath);
  }

  return (
    existing.node !== process.version ||
    existing.nest !== nestVersion ||
    existing.platform !== process.platform
  );
}

if (forceClean || runtimeChanged()) {
  console.log('Cleaning stale API build output before starting Nest watch...');
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.rmSync(tsBuildInfoPath, { force: true });
}

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(
  runtimeMetaPath,
  JSON.stringify(
    {
      node: process.version,
      nest: nestVersion,
      platform: process.platform,
    },
    null,
    2,
  ),
);

const nestBin = require.resolve('@nestjs/cli/bin/nest.js', { paths: [apiDir] });
const args = [nestBin, 'start'];

if (forwardedArgs.includes('--debug')) {
  args.push('--debug');
}

args.push('--watch');

const child = spawn(process.execPath, args, {
  cwd: apiDir,
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
  console.error(`Failed to start Nest watch server: ${error.message}`);
  process.exit(1);
});
