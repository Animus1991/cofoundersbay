import type { NextConfig } from 'next';
import { networkInterfaces } from 'os';

function getLanIps(): string[] {
  const nets = networkInterfaces();
  return Object.values(nets)
    .flatMap((x) => x ?? [])
    .filter((n) => n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}

const allowedDevOrigins = Array.from(
  new Set([
    'localhost',
    '127.0.0.1',
    ...getLanIps(),
  ]),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cofounderbay/shared'],
  allowedDevOrigins,
};

export default nextConfig;
