'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ensureSupportedNode } = require('../../../scripts/ensure-supported-node.cjs');
const { ensureStrictLocalPort } = require('../../../scripts/strict-local-port.cjs');

const WEB_PORT = 3000;
const WEB_HOST = '127.0.0.1';
const WEB_ORIGIN_HOST = 'localhost';
const API_ORIGIN = 'http://localhost:3001';

ensureSupportedNode('web-dev');

const webDir = path.resolve(__dirname, '..');
const nextDir = path.join(webDir, '.next');
const runtimeMetaPath = path.join(nextDir, 'dev-runtime.json');
const nextPackageJsonPath = require.resolve('next/package.json', { paths: [webDir] });
const nextVersion = require(nextPackageJsonPath).version;
const forceClean = process.argv.includes('--clean');

function stripStrictDevArgs(args) {
  const stripped = [];
  const ignored = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--clean') {
      continue;
    }

    if (arg === '-p' || arg === '--port' || arg === '-H' || arg === '--hostname') {
      ignored.push(arg, args[index + 1] ?? '');
      index += 1;
      continue;
    }

    if (arg.startsWith('--port=') || arg.startsWith('--hostname=')) {
      ignored.push(arg);
      continue;
    }

    stripped.push(arg);
  }

  if (ignored.length > 0) {
    console.log(`Ignoring custom host/port args for strict local dev: ${ignored.filter(Boolean).join(' ')}`);
  }

  return stripped;
}

const forwardedArgs = stripStrictDevArgs(process.argv.slice(2));

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

function hasMissingManifestFiles(manifestPath, fileKeys) {
  const manifest = readJson(manifestPath);
  if (!manifest) {
    return false;
  }

  for (const key of fileKeys) {
    const entries = manifest[key];
    if (!Array.isArray(entries)) {
      continue;
    }

    for (const relativeFile of entries) {
      const absoluteFile = path.join(webDir, '.next', relativeFile);
      if (!fs.existsSync(absoluteFile)) {
        return true;
      }
    }
  }

  return false;
}

function hasCorruptNextOutput() {
  if (!fs.existsSync(nextDir)) {
    return false;
  }

  const buildManifestPath = path.join(nextDir, 'build-manifest.json');
  if (hasMissingManifestFiles(buildManifestPath, ['rootMainFiles', 'devFiles', 'lowPriorityFiles'])) {
    return true;
  }

  const appBuildManifest = readJson(path.join(nextDir, 'app-build-manifest.json'));
  if (!appBuildManifest) {
    return false;
  }

  const appDir = path.join(webDir, 'src', 'app');
  const hasAppDirectory = fs.existsSync(appDir);
  const appPages = appBuildManifest.pages;
  return hasAppDirectory && appPages && typeof appPages === 'object' && Object.keys(appPages).length === 0;
}

const shouldClean =
  forceClean ||
  runtimeChanged() ||
  hasCorruptNextOutput();

if (shouldClean) {
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

async function main() {
  await ensureStrictLocalPort({
    port: WEB_PORT,
    host: '127.0.0.1',
    label: 'Web dev server',
    origin: `http://${WEB_ORIGIN_HOST}:${WEB_PORT}`,
  });

  console.log(`Starting web dev server on http://${WEB_ORIGIN_HOST}:${WEB_PORT}`);

  const nextBin = require.resolve('next/dist/bin/next', { paths: [webDir] });
  const child = spawn(
    process.execPath,
    [nextBin, 'dev', '-H', WEB_HOST, '-p', String(WEB_PORT), ...forwardedArgs],
    {
      cwd: webDir,
      env: {
        ...process.env,
        PORT: String(WEB_PORT),
        HOSTNAME: WEB_HOST,
        NEXT_PUBLIC_API_URL: API_ORIGIN,
        NEXT_PUBLIC_WS_URL: API_ORIGIN,
      },
      stdio: 'inherit',
    },
  );

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
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
