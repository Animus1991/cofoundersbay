import { fileURLToPath } from 'node:url';

export default {
  root: fileURLToPath(new URL('../apps/web/', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('../apps/web/src/', import.meta.url)) },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    pool: 'forks',
    execArgv: process.allowedNodeEnvironmentFlags.has('--experimental-webstorage') ? ['--no-experimental-webstorage'] : [],
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
    restoreMocks: true,
    testTimeout: 60_000,
  },
};
