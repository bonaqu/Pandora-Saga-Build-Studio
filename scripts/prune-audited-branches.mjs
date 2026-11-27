// Owner-approved branch retirement, 2026-11-27. Exact SHA audit only.
// Each distinct old branch head is pinned as a Git tag BEFORE deleting its branch ref.
// Never delete an open PR, a changed SHA, or the protected production branch.
const AUDITED = Object.freeze({
  "catalog/snapshot-ps-b9fcc323cce04cc0ba83e7760f5bd151": "c3c4aae97dd3a1b66dd0775368a17bae92297289",
  "catalog/snapshot-ps-qa-fast-path-815": "2aa37673971dc10f3dc65c1ad94f0fe2901597db",
  "codex/account-public-errors-877-final": "30f7a7127a2c1175c55f4e37f281b12dfa552546",
  "feat/615-atomic-status-833-stack": "03bd6328336e57625b58afa0bdbe3506216f81be",
  "feat/615-model-references-831": "03fa448417303684f9eb9d3b38a2c5483bd6f927",
  "feat/615-source-contract-registry-832-stack": "b871a72f8562942659df6161ab252d1255d20318",
  "fix/615-ammo-support-source-parity-844": "b20637283b47375b55b3d5af90de75aed55c223f",
  "fix/615-legacy-link-metadata-842": "2aaeb48da0fc898d9685c3e7770e807014769e9d",
  "fix/615-replay-complete-loss-audit-843": "3da85adf72bd907347fe1126292cdc79809a0164",
  "fix/615-specialized-situational-source-parity-845": "27e55575cc05785c66fc298d9e548670d73958a1",
  "fix/615-tactical-metadata-841": "e4fc5053fbd646c2650c4bee9f9433f4f758e818",
  "fix/615-wiki-gear-artwork-846": "9e144fa3b1d5460b70e1b4a83c92cf82df9a28bc",
  "review/archive-promotion-regression-20261115": "defd5ffaad8b9418bc0f2ee1921871efe864d5f6",
  "work/476-despair-painless-source-buff-copy-0971": "895f8865fc365608e7f562760abf0609b7491a3d",
  "work/476-live-os-inspiration-freewind-0965": "a9059ebc10116e6148383226e712a9c41c8fe920",
  "work/476-official-api-live-parity-20261126": "3af5b6d38785d6ee94f42953d832aad7567d8e99",
  "work/476-official-api-on-each-release": "dbc00a3cfaca8b264a46976ba3932b3a03dec606",
  "work/476-six-allied-recipient-current-os-0966": "ccbc5980262e54c8a3712e8470a56d06f2a74387",
  "work/476-six-ally-source-values-0966": "0be4b33733ed4f8796b3e99e3d44d0cffd990696",
  "work/476-sniper-source-fv-0974": "935c94bc7d8143d3e8d1dd339e37574480f5b813",
  "work/476-source-replay-healing-v0960": "f9cbd5d409fb06894d60d562265b113efe12b824",
  "work/815-catalog-archive-advanced-v0955": "c1f04847ac97f260c6c7459d6979411bd3d304f7",
  "work/946-direct-editor-captions": "eb518c66d2722d9aef353d25e8c098ba5779c406",
  "work/946-direct-inline-captions": "b1090f2c292c6739060ccee51ced2b4bed96136b",
  "work/946-direct-inline-editor-no-caption-pencils": "575b141939b407230531516a6b570fbb4e76f12c",
  "work/946-inline-copy-without-caption-pencils": "0f34a9577adce85b00690a79833528173e4661f4",
  "work/946-inline-editor-no-label-pencils": "3d5876165790dc769a7e8bce9568b083fc570621",
  "work/946-owner-inline-no-caption-pencils": "e58e300c58eb9a801b6a15cc578d57929b4317a1",
  "work/960-combat-confidence-source-readiness": "ce161ebb1c512e29f503f18e9f0cbf0e330e55a5"
});
export const targets = AUDITED;
const REPO = 'bonaqu/Pandora-Saga-Build-Studio';
const API = 'https://api.github.com/repos/' + REPO;
const ARCHIVE_PREFIX = 'refs/tags/branch-archive/2026-11-27/';
const urlRef = (kind, name) => API + '/git/refs/' + kind + '/' + name.split('/').map(encodeURIComponent).join('/');

export async function prune({fetcher = fetch, token, repo, ref, reviewed = AUDITED}) {
  if (repo !== REPO || ref !== 'refs/heads/bonaqu_projects') {
    throw Error('Cleanup must run on the protected production branch in the audited repository');
  }
  if (!token) throw Error('GITHUB_TOKEN is required');
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const request = (url, opts = {}) => fetcher(url, {headers, ...opts});
  const result = {deleted: [], gone: [], moved: [], skipped: [], archived: [], failed: []};

  // A full list is essential: a truncated PR list must never authorize deletion.
  const prs = await request(API + '/pulls?state=open&per_page=100');
  if (prs.status !== 200) throw Error('Cannot audit open PRs: HTTP ' + prs.status);
  const open = await prs.json();
  if (!Array.isArray(open) || open.length === 100) {
    throw Error('Open PR list incomplete: refusing branch retirement');
  }
  const inUse = new Set(open.filter(pr => pr?.head?.repo?.full_name === REPO)
    .map(pr => pr.head.ref));
  for (const [name, expected] of Object.entries(reviewed)) {
    if (name === 'bonaqu_projects' || !/^[0-9a-f]{40}$/.test(expected)) {
      result.failed.push({name, reason: 'Invalid or protected branch audit entry'});
      continue;
    }
    if (inUse.has(name)) {
      result.skipped.push({name, reason: 'Open PR'});
      continue;
    }
    const branchUrl = urlRef('heads', name);
    const tagRef = ARCHIVE_PREFIX + name;
    const tagUrl = urlRef('tags', 'branch-archive/2026-11-27/' + name);
    try {
      const current = await request(branchUrl);
      if (current.status === 404) { result.gone.push(name); continue; }
      if (current.status !== 200) throw Error('Branch GET HTTP ' + current.status);
      const actual = (await current.json())?.object?.sha;
      if (actual !== expected) {
        result.moved.push({name, expected, actual});
        continue;
      }

      // Preserve ALL 29 unmerged/divergent branch tips as persistent Git tags.
      const existingTag = await request(tagUrl);
      if (existingTag.status === 200) {
        if ((await existingTag.json())?.object?.sha !== expected) {
          throw Error('Archive tag points at a different SHA');
        }
      } else if (existingTag.status === 404) {
        const created = await request(API + '/git/refs', {
          method: 'POST',
          headers: {...headers, 'Content-Type': 'application/json'},
          body: JSON.stringify({ref: tagRef, sha: expected})
        });
        if (created.status !== 201) {
          // A concurrent run may have created exactly the same tag. Verify it.
          const retry = await request(tagUrl);
          if (retry.status !== 200 ||
              (await retry.json())?.object?.sha !== expected) {
            throw Error('Cannot pin archive tag: HTTP ' + created.status);
          }
        }
      } else {
        throw Error('Archive tag GET HTTP ' + existingTag.status);
      }
      result.archived.push({name, sha: expected, tag: tagRef});

      // Re-read immediately before destructive operation, reject moved refs.
      const fresh = await request(branchUrl);
      if (fresh.status === 404) { result.gone.push(name); continue; }
      if (fresh.status !== 200) throw Error('Pre-delete GET HTTP ' + fresh.status);
      const freshSha = (await fresh.json())?.object?.sha;
      if (freshSha !== expected) {
        result.moved.push({name, expected, actual: freshSha});
        continue;
      }
      const removed = await request(branchUrl, {method: 'DELETE'});
      if (removed.status !== 204) throw Error('Branch DELETE HTTP ' + removed.status);
      const postflight = await request(branchUrl);
      if (postflight.status !== 404) throw Error('Branch deletion not verified: HTTP ' + postflight.status);
      result.deleted.push(name);
    } catch (error) {
      result.failed.push({name, reason: error?.message || String(error)});
    }
  }
  return result;
}
if (process.argv[1]?.endsWith('/prune-audited-branches.mjs')) {
  const result = await prune({
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.failed.length || result.moved.length || result.skipped.length) process.exitCode = 1;
}
