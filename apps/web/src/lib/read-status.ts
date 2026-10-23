/**
 * What a failed read means to the page that made it.
 *
 * "Not found" needs the server to say so (404, or 403 for something the
 * reader may not see). The API throws `ApiError`; the preview demo throws
 * `DemoRefusal`, which carries the same `status` but is another class, so the
 * status is read off the error rather than tested with `instanceof`. Anything
 * else - the API down, a timeout, a 500 - is a read that failed and can be
 * tried again (AGENTS, docs §91-§92).
 */
export function statusOf(err: unknown): number | undefined {
  const status = (err as { status?: unknown } | null | undefined)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** The server said there is nothing here for this reader. */
export function isNotFound(err: unknown): boolean {
  const status = statusOf(err);
  return status === 404 || status === 403 || status === 410;
}
