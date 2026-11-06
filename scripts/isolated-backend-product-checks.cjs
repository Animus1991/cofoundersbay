'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeClient } = require('./isolated-backend-checks.cjs');

/**
 * What docs §111 added, against the real HTTP stack and a real database:
 * ownership, refusals, what is stored, and what must not leak. Each check
 * reads the row or the file, not only the response.
 */
async function runProductChecks({ base, db, results, password, privateDir, uploadsDir }) {
  const check = (name, condition) => {
    assert.ok(condition, name);
    results.push({ check: name, passed: true });
  };
  // Sixty requests a minute is the API's limit for one address.
  const client = () => makeClient(base, 1100);
  const anonymous = client();
  const alice = client();
  const bob = client();
  const carol = client();
  const a = await alice.request('POST', '/auth/register', { email: 'alice@product.example', password, role: 'founder' });
  const b = await bob.request('POST', '/auth/register', { email: 'bob@product.example', password, role: 'founder' });
  const c = await carol.request('POST', '/auth/register', { email: 'carol@product.example', password, role: 'founder' });
  assert.deepEqual([a.status, b.status, c.status], [201, 201, 201], `product_accounts ${JSON.stringify(a.raw).slice(0, 160)}`);
  check('product_accounts', true);
  const aid = a.data.user.id;
  const bid = b.data.user.id;
  for (const [id, displayName] of [[aid, 'Alice'], [bid, 'Bob']]) {
    await db.profile.create({ data: { userId: id, displayName } });
  }

  // ── Saving a notification ───────────────────────────────────────────────
  const kept = await db.notification.create({ data: { userId: aid, type: 'system', title: 'Keep me' } });
  await db.notification.create({ data: { userId: aid, type: 'system', title: 'Clear me' } });
  // A write without a session stops at the CSRF check, before any route.
  check('save_refused_without_a_session', [401, 403].includes((await anonymous.request('PATCH', `/notifications/${kept.id}/saved`, { saved: true })).status));
  check('save_needs_csrf', (await alice.request('PATCH', `/notifications/${kept.id}/saved`, { saved: true }, false)).status === 403);
  check('save_is_a_boolean', (await alice.request('PATCH', `/notifications/${kept.id}/saved`, { saved: 'yes' })).status === 400);
  check('save_refuses_another_members', (await bob.request('PATCH', `/notifications/${kept.id}/saved`, { saved: true })).status === 404);
  const saved = await alice.request('PATCH', `/notifications/${kept.id}/saved`, { saved: true });
  check('save_stored', saved.status === 200 && (await db.notification.findUnique({ where: { id: kept.id } })).savedAt !== null);
  const savedList = await alice.request('GET', '/notifications?saved=true');
  check('saved_view_lists_it', savedList.status === 200 && savedList.data.notifications.length === 1 && savedList.data.notifications[0].id === kept.id);
  await alice.request('DELETE', '/notifications');
  check('delete_all_keeps_saved', await db.notification.count({ where: { userId: aid } }) === 1);

  // ── The reports queue ───────────────────────────────────────────────────
  await db.report.create({ data: { type: 'spam', reason: 'Sends the same link to everyone', reporterId: aid, reportedId: bid } });
  check('reports_refuse_a_founder', (await alice.request('GET', '/admin/reports')).status === 403);
  const admin = client();
  const adminRow = await db.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
  if (adminRow) {
    // The fixture's password stayed in the identity checks; this run sets its own.
    const argon2 = require('node:module').createRequire(path.join(__dirname, '..', 'apps/api/package.json'))('argon2');
    await db.user.update({ where: { id: adminRow.id }, data: { passwordHash: await argon2.hash(password) } });
    const logged = await admin.request('POST', '/auth/login', { email: 'admin@isolated.example', password });
    check('reports_admin_session', logged.status === 201);
    const reports = await admin.request('GET', '/admin/reports?type=spam&limit=5&offset=0');
    check('reports_filter_and_total', reports.status === 200 && reports.data.total === 1 && reports.data.reports[0].reported.name === 'Bob');
    check('reports_none_of_another_type', (await admin.request('GET', '/admin/reports?type=fake')).data.total === 0);
    check('reports_unknown_status_is_400', (await admin.request('GET', '/admin/reports?status=archived')).status === 400);
  }

  // ── 👍 / 👎 ─────────────────────────────────────────────────────────────
  check('rate_refused_without_a_session', [401, 403].includes((await anonymous.request('PUT', '/ai/answers/msg-1/feedback', { helpful: true })).status));
  check('rate_stored', (await alice.request('PUT', '/ai/answers/msg-1/feedback', { helpful: false, reason: 'unclear', source: 'builtin' })).status === 200);
  check('rate_changes_not_doubles', (await alice.request('PUT', '/ai/answers/msg-1/feedback', { helpful: false, reason: 'wrong', source: 'builtin' })).status === 200 && await db.assistantAnswerFeedback.count() === 1);
  check('rate_reason_from_the_list', (await alice.request('PUT', '/ai/answers/msg-1/feedback', { helpful: false, reason: 'it was rude' })).status === 400);
  check('rate_id_carries_no_text', (await alice.request('PUT', `/ai/answers/${encodeURIComponent('what I asked about salaries')}/feedback`, { helpful: true })).status === 400);
  await bob.request('PUT', '/ai/answers/msg-1/feedback', { helpful: true });
  const report = await anonymous.request('GET', '/public/transparency');
  check('transparency_counts_it', report.status === 200 && report.data.assistantFeedback.notHelpful === 1 && report.data.assistantFeedback.helpful === 1 && report.data.assistantFeedback.byReason.wrong === 1);
  check('rate_clears', (await bob.request('DELETE', '/ai/answers/msg-1/feedback')).status === 200 && await db.assistantAnswerFeedback.count() === 1);

  // ── Fundraising ─────────────────────────────────────────────────────────
  check('fundraising_needs_a_session', (await anonymous.request('GET', '/fundraising')).status === 401);
  const blank = await alice.request('GET', '/fundraising');
  check('fundraising_starts_empty', blank.status === 200 && blank.data.round === null && blank.data.leads.length === 0);
  const withLead = await alice.request('POST', '/fundraising/leads', { investorName: 'Ada Angel', status: 'contacted', checkSizeText: '€25K–€150K' });
  check('first_contact_opens_a_round', withLead.status === 201 && withLead.data.round.name === 'My round' && withLead.data.leads.length === 1);
  const leadId = withLead.data.leads[0].id;
  const roundId = withLead.data.round.id;
  const edited = await alice.request('PATCH', `/fundraising/rounds/${roundId}`, { name: 'Seed', targetAmount: 750000, closingDate: '2027-03-01' });
  check('round_edit', edited.status === 200 && edited.data.round.name === 'Seed' && edited.data.round.targetAmount === 750000);
  const committed = await alice.request('PATCH', `/fundraising/leads/${leadId}`, { status: 'committed', committedAmount: 250000 });
  check('raised_is_what_committed_adds_up_to', committed.data.round.raisedAmount === 250000 && committed.data.round.investors === 1);
  check('lead_moves_set_last_contact', committed.data.leads[0].lastContactAt !== null);
  check('another_members_round_is_404', (await bob.request('PATCH', `/fundraising/rounds/${roundId}`, { name: 'Mine now' })).status === 404);
  check('another_members_lead_is_404', (await bob.request('PATCH', `/fundraising/leads/${leadId}`, { notes: 'x' })).status === 404);
  check('another_members_state_is_empty', (await bob.request('GET', '/fundraising')).data.round === null);
  check('round_refuses_a_negative_target', (await alice.request('PATCH', `/fundraising/rounds/${roundId}`, { targetAmount: -1 })).status === 400);

  // ── The data room ───────────────────────────────────────────────────────
  const pdf = Buffer.from('%PDF-1.7\nsecret numbers\n%%EOF\n');
  const upload = await alice.upload('/fundraising/documents', 'deck.pdf', 'application/pdf', pdf, { category: 'pitch' });
  check('upload_stored', upload.status === 201 && upload.data.documents.length === 1 && upload.data.documents[0].hasFile === true);
  const docId = upload.data.documents[0].id;
  const row = await db.dataRoomDocument.findUnique({ where: { id: docId } });
  check('key_never_reaches_the_client', !JSON.stringify(upload.data).includes(row.fileUrl));
  check('file_is_in_private_storage', fs.existsSync(path.join(privateDir, row.fileUrl)));
  check('file_is_not_under_public_uploads', !fs.existsSync(path.join(uploadsDir, row.fileUrl)));
  const origin = base.replace(/\/api$/, '');
  check('no_public_route_to_it', (await fetch(`${origin}/uploads/${row.fileUrl}`, { signal: AbortSignal.timeout(10000) })).status === 404);
  check('script_upload_refused', (await alice.upload('/fundraising/documents', 'x.html', 'text/html', Buffer.from('<script>alert(1)</script>'), {})).status === 400);
  const owned = await alice.raw(`/fundraising/documents/${docId}/file`);
  check('owner_downloads_the_bytes', owned.status === 200 && Buffer.from(await owned.arrayBuffer()).equals(pdf));
  check('download_is_an_attachment', (owned.headers.get('content-disposition') ?? '').startsWith('attachment'));
  check('download_is_sandboxed', (owned.headers.get('content-security-policy') ?? '').includes('sandbox'));
  check('stranger_cannot_download', (await bob.raw(`/fundraising/documents/${docId}/file`)).status === 404);
  check('visitor_cannot_download', (await anonymous.raw(`/fundraising/documents/${docId}/file`)).status === 401);
  check('owner_is_not_logged', await db.dataRoomAccessLog.count() === 0);
  await db.dataRoomDocument.update({ where: { id: docId }, data: { sharedWithLeads: true } });
  check('shared_is_not_public', (await bob.raw(`/fundraising/documents/${docId}/file`)).status === 404);
  await db.investorPipelineLead.update({ where: { id: leadId }, data: { platformUserId: bid } });
  check('linked_investor_downloads', (await bob.raw(`/fundraising/documents/${docId}/file`)).status === 200);
  check('their_opening_is_logged', await db.dataRoomAccessLog.count({ where: { accessorId: bid, documentId: docId } }) === 1 && (await db.dataRoomDocument.findUnique({ where: { id: docId } })).viewCount === 1);
  check('stranger_cannot_delete', (await bob.request('DELETE', `/fundraising/documents/${docId}`)).status === 404);
  check('delete_removes_the_row', (await alice.request('DELETE', `/fundraising/documents/${docId}`)).status === 200 && await db.dataRoomDocument.count() === 0);
  check('delete_removes_the_file', !fs.existsSync(path.join(privateDir, row.fileUrl)));

  // ── Proposals ───────────────────────────────────────────────────────────
  const posted = await alice.request('POST', '/opportunities', { title: 'CTO wanted', type: 'cofounder' });
  check('listing_posted', posted.status === 201);
  const listingId = posted.data.opportunity.id;
  const scope = 'I would build the first version with you.';
  check('proposal_on_own_listing_refused', (await alice.request('POST', `/opportunities/${listingId}/proposals`, { scope })).status === 400);
  check('proposal_needs_substance', (await bob.request('POST', `/opportunities/${listingId}/proposals`, { scope: 'hi' })).status === 400);
  const sent = await bob.request('POST', `/opportunities/${listingId}/proposals`, { scope, timeframe: '3 months' });
  check('proposal_sent', sent.status === 201 && sent.data.proposal.status === 'pending');
  const proposalId = sent.data.proposal.id;
  check('proposal_once_per_listing', (await bob.request('POST', `/opportunities/${listingId}/proposals`, { scope })).status === 409);
  check('owner_is_told', await db.notification.count({ where: { userId: aid, link: '/opportunities?tab=proposals' } }) === 1);
  const incoming = await alice.request('GET', '/opportunities/proposals/incoming');
  check('owner_sees_it', incoming.status === 200 && incoming.data.proposals.length === 1 && incoming.data.proposals[0].from.displayName === 'Bob');
  check('stranger_sees_nothing', (await carol.request('GET', '/opportunities/proposals/incoming')).data.proposals.length === 0);
  check('sender_cannot_accept', (await bob.request('PATCH', `/opportunities/proposals/${proposalId}`, { status: 'accepted' })).status === 403);
  check('stranger_cannot_answer', (await carol.request('PATCH', `/opportunities/proposals/${proposalId}`, { status: 'accepted' })).status === 404);
  check('owner_accepts', (await alice.request('PATCH', `/opportunities/proposals/${proposalId}`, { status: 'accepted' })).status === 200);
  check('an_answer_stands', (await alice.request('PATCH', `/opportunities/proposals/${proposalId}`, { status: 'declined' })).status === 409);
  check('sender_is_told', await db.notification.count({ where: { userId: bid, link: '/opportunities?tab=applications' } }) === 1);
  await db.userBlock.create({ data: { blockerId: aid, blockedId: c.data.user.id } });
  check('a_block_stops_a_proposal', (await carol.request('POST', `/opportunities/${listingId}/proposals`, { scope })).status === 403);
  const list = await anonymous.request('GET', '/opportunities');
  check('listing_names_its_author', list.status === 200 && list.data.opportunities.some((o) => o.createdBy.id === aid));

  // ── The portfolio ───────────────────────────────────────────────────────
  const added = await alice.request('POST', '/me/portfolio', { title: 'Harbor', url: 'https://harbor.example', type: 'project' });
  check('portfolio_item_added', added.status === 201 && added.data.items.length === 1);
  const itemId = added.data.items[0].id;
  check('portfolio_refuses_script_links', (await alice.request('POST', '/me/portfolio', { title: 'x', url: 'javascript:alert(1)' })).status === 400);
  check('another_member_cannot_change_it', (await bob.request('PATCH', `/me/portfolio/${itemId}`, { title: 'Mine' })).status === 404);
  check('another_member_cannot_remove_it', (await bob.request('DELETE', `/me/portfolio/${itemId}`)).status === 404);
  check('visitors_read_a_public_portfolio', (await anonymous.request('GET', `/profiles/${aid}/portfolio`)).data.items?.length === 1);
  await db.profile.update({ where: { userId: aid }, data: { visibilityRules: { profile: 'members' } } });
  check('members_only_hides_it_from_visitors', (await anonymous.request('GET', `/profiles/${aid}/portfolio`)).status === 404);
  check('members_still_read_it', (await bob.request('GET', `/profiles/${aid}/portfolio`)).data.items?.length === 1);

  // ── Rich text on its way in ─────────────────────────────────────────────
  const board = await alice.request('POST', '/research/boards', { title: 'Market notes' });
  check('board_created', board.status === 201);
  const boardId = board.data.board?.id ?? board.data.id;
  const node = await alice.request('POST', `/research/boards/${boardId}/nodes`, { type: 'note', content: '<p style="color:#b91c1c">ok</p><script>alert(1)</script><img src="x" onerror="alert(1)">' });
  check('note_created', node.status === 201);
  const stored = await db.researchNode.findFirst({ where: { boardId } });
  check('note_stored_without_scripts', stored.content.includes('<p style="color:#b91c1c">ok</p>') && !/script|onerror/i.test(stored.content));
}

module.exports = { runProductChecks };
