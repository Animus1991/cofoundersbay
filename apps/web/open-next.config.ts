import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import incrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';

/**
 * OpenNext adapter config for Cloudflare Workers.
 *
 * The Next.js app is fully server-capable (middleware does tenant resolution
 * and auth on every request), so it is deployed as a Worker rather than as a
 * static export.
 *
 * `incrementalCache` is wired to Workers KV so ISR/data-cache entries survive
 * between isolates. Bind a KV namespace called NEXT_INC_CACHE_KV in
 * wrangler.jsonc (see the `kv_namespaces` block) before enabling it in
 * production; with no binding present OpenNext falls back to no caching, which
 * still serves correctly, just without the cache.
 */
export default defineCloudflareConfig({
  incrementalCache,
});
