import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/editorial-staging-d1-protected-phases.yml',
 import.meta.url),'utf8');
const docs=readFileSync(new URL('../docs/issue-390-browser-only-d1-rehearsal.md',
 import.meta.url),'utf8');

test('#390 protected staging workflow runs exclusively by user-initiated PR label',()=>{
 assert.match(workflow,/pull_request:\s*\n\s+types: \[labeled\]/);
 assert.doesNotMatch(workflow,/^\s+(?:push|workflow_dispatch|schedule|pull_request_target):/m);
 assert.match(workflow,/pull_request.number == 809/);
 assert.match(workflow,/base.ref == 'bonaqu_projects'/);
 assert.match(workflow,/head.ref == 'work\/947-issue390-editorial-parity'/);
 assert.match(workflow,/environment: editorial-staging-390/);
 for(const label of [
  'ps390-backup-before','ps390-import','ps390-verify',
  'ps390-backup-after','ps390-rollback'
 ])assert.match(workflow,new RegExp(label));
 assert.match(workflow,/persist-credentials: false/);
 assert.match(workflow,/test "\$\(git rev-parse HEAD\)" = "\$PS_EDITORIAL_EXPECTED_SHA"/);
 assert.match(workflow,/check-editorial-staging-approval\.mjs ci/);
 assert.match(workflow,/check-editorial-staging-approval\.mjs import/);
 assert.match(workflow,/check-editorial-staging-approval\.mjs rollback/);
 assert.ok(workflow.indexOf('check-editorial-staging-approval.mjs import')<
  workflow.indexOf('run-editorial-staging-d1-premerge.mjs import'));
 assert.ok(workflow.indexOf('check-editorial-staging-approval.mjs rollback')<
  workflow.indexOf('run-editorial-staging-d1-premerge.mjs rollback'));
 assert.match(workflow,/PS_EDITORIAL_STAGING_ID: 56757608-3492-4fae-b698-27c76918cdc1/);
 assert.match(workflow,/PS390_RETAINED_BACKUP_SHA256: \$\{\{ vars\.PS390_RETAINED_BACKUP_SHA256 \}\}/);
 assert.match(workflow,/PS_EDITORIAL_CONFIRMATION:/);
});

test('#390 public GitHub Actions artifact list MUST NEVER contain unencrypted SQL',()=>{
 assert.match(workflow,/uses: actions\/upload-artifact@v4/);
 assert.match(workflow,/ps390-ciphertext\/\*\.enc/);
 assert.match(workflow,/ps390-ciphertext\/receipt\.json/);
 const uploadBlock=workflow.slice(workflow.indexOf('uses: actions/upload-artifact@v4'),
  workflow.indexOf('- name: Require matching artifact'));
 assert.doesNotMatch(uploadBlock,/\.sql|ps390-independent-staging-backup/);
 assert.match(workflow,/retention-days: 30/);
 assert.match(workflow,/if: always\(\)/);
 assert.match(workflow,/PS390_BACKUP_ENCRYPTION_KEY: \$\{\{ secrets\.PS390_BACKUP_ENCRYPTION_KEY \}\}/);
 assert.match(workflow,/PS390_CF_TOKEN/);
 assert.doesNotMatch(workflow,/secrets\.CLOUDFLARE_API_TOKEN/);
 assert.match(docs,/PS390_RETAINED_BACKUP_SHA256/);
 assert.match(docs,/Required reviewers/);
 assert.match(docs,/вне GitHub/);
});
