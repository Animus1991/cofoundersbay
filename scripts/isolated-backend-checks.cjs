'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

async function runChecks({ base, db, requireApi, results }) {
  const argon2 = requireApi('argon2');
  const password = crypto.randomBytes(24).toString('base64') + 'aA1!';
  function client() {
    const cookies = new Map();
    return {
      cookies,
      async request(method, route, body, csrf = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (cookies.size) headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
        if (csrf && cookies.has('cfb_csrf')) headers['x-csrf-token'] = cookies.get('cfb_csrf');
        const response = await fetch(base + route, {
          method, headers, body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        });
        for (const cookie of response.headers.getSetCookie()) {
          const pair = cookie.split(';')[0];
          const eq = pair.indexOf('=');
          cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
        }
        const json = await response.json();
        return { status: response.status, data: json.data ?? json, raw: json };
      },
    };
  }
  const check = (name, condition) => {
    assert.ok(condition, name);
    results.push({ check: name, passed: true });
  };
  const alice = client(), bob = client(), anonymous = client();
  check('anonymous_me_401', (await anonymous.request('GET', '/auth/me')).status === 401);
  const a = await alice.request('POST', '/auth/register', { email: 'founder@isolated.example', password, role: 'founder' });
  const b = await bob.request('POST', '/auth/register', { email: 'mentor@isolated.example', password, role: 'mentor' });
  check('two_real_registrations', a.status === 201 && b.status === 201);
  const aid = a.data.user.id, bid = b.data.user.id;
  check('registration_rows_persist', await db.user.count() === 2);
  const storedHash = (await db.user.findUnique({ where: { id: aid } })).passwordHash;
  check('password_hashed', typeof storedHash === 'string' && storedHash !== password && await argon2.verify(storedHash, password));
  check('cookie_session_me', (await alice.request('GET', '/auth/me')).data.user?.id === aid);
  const invalid = client();
  invalid.cookies.set('cfb_access', 'invalid.signature.value');
  check('invalid_jwt_rejected', (await invalid.request('GET', '/auth/me')).status === 401);
  check('csrf_rejects_missing_header', (await alice.request('POST', '/shortlist', { userId: bid }, false)).status === 403);
  check('csrf_denial_no_write', await db.savedProfile.count() === 0);
  check('shortlist_create', (await alice.request('POST', '/shortlist', { userId: bid, note: 'first note' })).status === 201);
  check('shortlist_row_persists', (await db.savedProfile.findFirst({ where: { savedById: aid, userId: bid } }))?.note === 'first note');
  check('shortlist_edit', (await alice.request('PATCH', `/shortlist/${bid}/note`, { note: 'updated note' })).status === 200);
  check('edited_note_persists', (await db.savedProfile.findFirst({ where: { savedById: aid, userId: bid } }))?.note === 'updated note');
  check('other_user_cannot_edit_owned_row', (await bob.request('PATCH', `/shortlist/${bid}/note`, { note: 'unauthorized edit' })).status === 400);
  check('ownership_denial_preserves_note', (await db.savedProfile.findFirst({ where: { savedById: aid, userId: bid } }))?.note === 'updated note');
  const fresh = client();
  check('fresh_session_real_login', (await fresh.request('POST', '/auth/login', { email: 'founder@isolated.example', password })).status === 201);
  const list = await fresh.request('GET', '/shortlist');
  check('new_session_reads_saved_note', list.status === 200 && list.data.items?.some(item => item.userId === bid && item.note === 'updated note'));
  check('shortlist_delete', (await fresh.request('DELETE', `/shortlist/${bid}`)).status === 200);
  check('deleted_row_absent', await db.savedProfile.count() === 0);
  check('wrong_password_rejected', (await client().request('POST', '/auth/login', { email: 'founder@isolated.example', password: 'Wrong-password-123!' })).status === 401);
  const oldRefresh = fresh.cookies.get('cfb_refresh');
  const refreshed = await fresh.request('POST', '/auth/refresh', {});
  check('real_refresh', refreshed.status === 201);
  check('rotated_refresh_cannot_be_replayed', (await client().request('POST', '/auth/refresh', { refreshToken: oldRefresh })).status === 401);
  const refreshToken = refreshed.data.refreshToken;
  check('logout', (await fresh.request('POST', '/auth/logout', {})).status === 201);
  check('refresh_revoked_after_logout', (await client().request('POST', '/auth/refresh', { refreshToken })).status === 401);

  // Privileged users are test fixtures, not created via public registration.
  // All sessions still go through the real login/password/JWT path.
  for (const role of ['investor', 'org', 'admin', 'super_admin']) {
    await db.user.create({ data: { email: `${role}@isolated.example`, slug: `isolated-${role}`, passwordHash: await argon2.hash(password), role } });
    const account = client();
    const login = await account.request('POST', '/auth/login', { email: `${role}@isolated.example`, password });
    const me = await account.request('GET', '/auth/me');
    check(`real_session_${role}`, login.status === 201 && me.status === 200 && me.data.user?.role === role);
  }
}
module.exports = { runChecks };
