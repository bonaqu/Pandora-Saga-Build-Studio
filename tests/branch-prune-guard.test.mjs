import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {targets, prune} from '../scripts/prune-audited-branches.mjs';

const REPO = 'bonaqu/Pandora-Saga-Build-Studio';
const expectedNames = Object.keys(targets);
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('stale branch cleanup has an exact-SHA register and keeps only production', () => {
  assert.equal(expectedNames.length, 29);
  assert.ok(!expectedNames.includes('bonaqu_projects'));
  for (const [name, sha] of Object.entries(targets)) {
    assert.match(sha, /^[0-9a-f]{40}$/);
    assert.ok(name.includes('/'));
  }
  const policy = read('docs/BRANCH_RETENTION_POLICY.md');
  assert.match(policy, /29/);
  assert.match(policy, /archive/);
  const yml = read('.github/workflows/prune-audited-branches.yml');
  assert.match(yml, /contents: write/);
  assert.match(yml, /refs\/heads\/bonaqu_projects/);
  assert.match(yml, /workflow_dispatch:/);
  assert.match(yml, /inputs\.confirm == 'DELETE_AUDITED_BRANCHES'/);
  assert.match(yml, /^  push:/m);
  assert.match(yml, /branches: \[bonaqu_projects\]/);
  assert.doesNotMatch(yml, /^\s*pull_request:/m);
  assert.doesNotMatch(yml, /^\s*schedule:/m);
  assert.doesNotMatch(yml, /CLOUDFLARE|wrangler|D1_DATABASE|--force/);
});

test('cleanup refuses GitHub writes unless running on exact protected repo and ref', async () => {
  for (const bad of [
    {repo: 'other/repo', ref: 'refs/heads/bonaqu_projects'},
    {repo: REPO, ref: 'refs/heads/dev'}
  ]) {
    await assert.rejects(() => prune({...bad, token: 'fake-token',
      fetcher: () => { throw Error('Must never request GitHub API'); }}),
      /protected production branch/);
  }
  await assert.rejects(() => prune({repo: REPO,
    ref: 'refs/heads/bonaqu_projects', token: ''}), /GITHUB_TOKEN/);
});

test('changed or missing branches stay safe; exact old commits are tagged before DELETE', async () => {
  const calls = [];
  const first = expectedNames[0], second = expectedNames[1], third = expectedNames[2];
  const deleted = new Set();
  const fake = async (url, options = {}) => {
    const method = options.method || 'GET';
    const name = url.includes('/git/refs/heads/')
      ? decodeURIComponent(url.split('/git/refs/heads/')[1]) : null;
    calls.push({url, name, method});
    if (url.endsWith('/pulls?state=open&per_page=100'))
      return {status: 200, json: async () => []};
    if (url.includes('/git/refs/tags/'))
      return {status: 404};
    if (url.endsWith('/git/refs') && method === 'POST')
      return {status: 201};
    if (name) {
      if (name === second || deleted.has(name)) return {status: 404};
      if (name === third)
        return {status: 200, json: async () => ({object: {sha: 'f'.repeat(40)}})};
      if (method === 'DELETE') {
        deleted.add(name);
        return {status: 204};
      }
      return {status: 200, json: async () => ({object: {sha: targets[name]}})};
    }
    throw Error('Unexpected mocked request: ' + method + ' ' + url);
  };
  const result = await prune({fetcher: fake, token: 'fake-token',
    repo: REPO, ref: 'refs/heads/bonaqu_projects'});
  assert.ok(result.deleted.includes(first));
  assert.ok(result.gone.includes(second));
  assert.ok(result.moved.some(row => row.name === third));
  assert.equal(calls.filter(call => call.method === 'DELETE').length, expectedNames.length - 2);
  assert.equal(result.archived.length, expectedNames.length - 2);
  assert.equal(result.failed.length, 0);
  assert.ok(calls.findIndex(call => call.method === 'POST') <
    calls.findIndex(call => call.method === 'DELETE'));
});
