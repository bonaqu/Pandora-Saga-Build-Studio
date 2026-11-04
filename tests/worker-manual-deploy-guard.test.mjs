import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const workflow=read('.github/workflows/deploy-worker-manual.yml');

test('production Worker deployment requires explicit branch and target confirmation',()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/bonaqu_projects'/);
 assert.match(workflow,/DEPLOY-0\.355-TO-ps-build-studio-cloud/);
 assert.match(workflow,/test "\$CONFIRM" = 'DEPLOY-0\.355-TO-ps-build-studio-cloud'/);
 assert.match(workflow,/secrets\.CLOUDFLARE_API_TOKEN/);
 assert.match(workflow,/PS_D1_DATABASE_ID:/);
 assert.match(workflow,/node scripts\/prepare-config\.mjs/);
 assert.match(workflow,/wrangler@4 deploy --dry-run/);
 assert.match(workflow,/wrangler@4 deploy --keep-vars/);
 assert.doesNotMatch(workflow,/wrangler@4 d1 (?:execute|migrations apply)/);
 assert.doesNotMatch(workflow,/\b(?:DELETE FROM|DROP TABLE|TRUNCATE TABLE|INSERT INTO)\b/i);
});

test('manual deployment verifies new Worker marker and existing D1 after publish',()=>{
 const worker=read('worker/index.js');
 assert.match(worker,/codeRelease:'0\.358\.0'/);
 assert.match(worker,/'bilingual-item-text'/);
 assert.match(workflow,/api\/runtime-capabilities/);
 assert.match(workflow,/api\/health/);
 assert.match(workflow,/features\?\.catalog===true/);
 assert.match(workflow,/caps\?\.ownerEditors\?\.includes\("bilingual-item-text"\)/);
 assert.match(workflow,/caps\?\.adminD1WriteCheck==="catalog-and-overrides"/);
 assert.match(workflow,/caps\?\.catalogSourceFailover===true/);
 assert.match(read('scripts/check-live-connections.mjs'),/Live English item editing in D1/);
});
