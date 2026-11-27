import test from 'node:test';
import assert from 'node:assert/strict';
import {prune, targets} from '../scripts/prune-audited-branches.mjs';

const REPO = 'bonaqu/Pandora-Saga-Build-Studio';
const SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);
const NAME = 'work/audited-old-branch';
const base = 'https://api.github.com/repos/' + REPO;
const options = {repo: REPO, ref: 'refs/heads/bonaqu_projects', token: 'test-token', reviewed: {[NAME]: SHA}};
const reply = (status, data) => ({status, json: async () => data});
function mock({branchSHA = SHA, existingTag, active = false, tagCreateStatus = 201} = {}) {
  const calls = [];
  let deleted = false;
  const fetcher = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    calls.push({url, method, body: opts.body});
    if (url.endsWith('/pulls?state=open&per_page=100')) {
      return reply(200, active ? [{head: {ref: NAME, repo: {full_name: REPO}}}] : []);
    }
    if (url.includes('/git/refs/heads/')) {
      if (method === 'DELETE') {
        deleted = true;
        return reply(204);
      }
      return deleted ? reply(404) : reply(200, {object: {sha: branchSHA}});
    }
    if (url.includes('/git/refs/tags/')) {
      return existingTag ? reply(200, {object: {sha: existingTag}}) : reply(404);
    }
    if (url.endsWith('/git/refs') && method === 'POST') {
      return reply(tagCreateStatus, {object: {sha: SHA}});
    }
    throw Error('Unexpected mocked URL: ' + method + ' ' + url);
  };
  return {fetcher, calls};
}

test('retirement snapshot includes all 29 reviewed old heads, never production', () => {
  assert.equal(Object.keys(targets).length, 29);
  assert.equal(Object.hasOwn(targets, 'bonaqu_projects'), false);
  assert.ok(Object.values(targets).every(sha => /^[0-9a-f]{40}$/.test(sha)));
});

test('archives exact commit before deleting and verifies deletion', async () => {
  const {fetcher, calls} = mock();
  const result = await prune({...options, fetcher});
  assert.deepEqual(result.deleted, [NAME]);
  assert.equal(result.archived[0].sha, SHA);
  const post = calls.findIndex(x => x.method === 'POST');
  const del = calls.findIndex(x => x.method === 'DELETE');
  assert.ok(post >= 0 && del > post, 'tag must be created before deleting branch');
  assert.ok(calls[post].body.includes('branch-archive/2026-11-27/work/audited-old-branch'));
});

test('does not delete a SHA-changed branch', async () => {
  const {fetcher, calls} = mock({branchSHA: OTHER_SHA});
  const result = await prune({...options, fetcher});
  assert.equal(result.moved.length, 1);
  assert.equal(calls.some(x => x.method === 'DELETE'), false);
  assert.equal(calls.some(x => x.method === 'POST'), false);
});

test('does not delete the source of an open PR', async () => {
  const {fetcher, calls} = mock({active: true});
  const result = await prune({...options, fetcher});
  assert.equal(result.skipped[0].reason, 'Open PR');
  assert.equal(calls.some(x => x.method === 'DELETE'), false);
});

test('does not delete if archive tag exists with a different SHA', async () => {
  const {fetcher, calls} = mock({existingTag: OTHER_SHA});
  const result = await prune({...options, fetcher});
  assert.equal(result.failed.length, 1);
  assert.equal(calls.some(x => x.method === 'DELETE'), false);
});

test('does not delete when archive tag cannot be created', async () => {
  const {fetcher, calls} = mock({tagCreateStatus: 403});
  const result = await prune({...options, fetcher});
  assert.equal(result.failed.length, 1);
  assert.equal(calls.some(x => x.method === 'DELETE'), false);
});

test('refuses writes outside protected default and without a token', async () => {
  const {fetcher} = mock();
  await assert.rejects(() => prune({...options, repo: 'other/repo', fetcher}), /protected/);
  await assert.rejects(() => prune({...options, token: null, fetcher}), /GITHUB_TOKEN/);
});
