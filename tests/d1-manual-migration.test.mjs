import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('production D1 account migration can run only after owner confirms specific existing database',()=>{
 const workflow=read('.github/workflows/manual-d1-accounts-0005.yml');
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\n  push:/);
 assert.match(workflow,/APPLY-0005-TO-ps-build-studio-db/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/bonaqu_projects'/);
 assert.match(workflow,/CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
 assert.match(workflow,/PS_D1_DATABASE_ID: 0f8fbcd8-be06-414c-844b-a2091fdf6784/);
 assert.match(workflow,/d1 time-travel info ps-build-studio-db/);
 assert.match(workflow,/d1 execute ps-build-studio-db --remote --yes/);
 assert.match(workflow,/--file migrations\/0005_user_accounts\.sql/);
 assert.doesNotMatch(workflow,/wrangler.*d1 migrations apply.*--remote/);
});
test('0005 cannot modify the existing administrator or saved-build tables',()=>{
 const sql=read('worker/migrations/0005_user_accounts.sql');
 const statements=sql.replace(/--[^\n]*/g,'').split(';').map(x=>x.trim()).filter(Boolean);
 assert.equal(statements.length,4);
 assert.ok(statements.every(x=>/^CREATE (?:TABLE|INDEX) IF NOT EXISTS /i.test(x)));
 assert.ok(!/^\s*(?:DROP|DELETE|UPDATE|ALTER)\b/im.test(statements.join('\n')),
  'Foreign-key ON DELETE CASCADE is allowed inside additive table definitions');
 const validator=read('worker/scripts/assert-d1-tables.mjs');
 assert.match(validator,/Production D1 does not contain required table/);
});
