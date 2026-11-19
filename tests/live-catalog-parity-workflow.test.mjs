import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('live readiness runs parity only after the published release and Worker checks',()=>{
 const workflow=read('.github/workflows/live-readonly.yml');
 const wait=workflow.indexOf('run: node scripts/wait-live-release.mjs');
 const health=workflow.indexOf('run: npm run connection:check:full');
 const parity=workflow.indexOf('run: npm run catalog:parity:live');
 assert.ok(wait>=0&&health>wait&&parity>health,
  'Read-only parity must check only after expected publication and health');
 assert.doesNotMatch(workflow,/^\s*workflow_run:/m);
 assert.doesNotMatch(workflow,/^\s*schedule:/m);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/contents: read/);
 assert.doesNotMatch(workflow,/catalog:review|catalog:import|wrangler d1|--write|--strict-ru/);
});
test('parity command runs a read-only script, not a production D1 mutation',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.scripts['catalog:parity:live'],'node scripts/audit-live-catalog-parity.mjs');
 const source=read('scripts/audit-live-catalog-parity.mjs');
 assert.match(source,/method|fetcher/);
 assert.doesNotMatch(source,/Authorization:|Bearer |method:\s*['"]POST|method:\s*['"]PUT/);
 assert.match(source,/x-ps-catalog-snapshot/);
});

test('Pages dynamic deployments are monitored via the source branch push only',()=>{
 const workflow=read('.github/workflows/live-readonly.yml');
 const wait=read('scripts/wait-live-release.mjs');
 assert.match(workflow,/push:\s*\n\s*branches: \[bonaqu_projects\]/);
 assert.match(workflow,/group: live-readonly-bonaqu_projects/);
 assert.match(workflow,/cancel-in-progress: true/);
 assert.doesNotMatch(workflow,/^\s*workflow_run:/m);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(wait,/const max=60;/);
 assert.match(wait,/if\(current===expected\)/);
 assert.doesNotMatch(workflow,/wrangler d1|Authorization|catalog:review|--write/);
});

test('failed live release captures only read-only production D1 schema diagnostics',()=>{
 const workflow=read('.github/workflows/live-readonly.yml');
 const script=read('worker/scripts/check-readonly-d1-incident.mjs');
 assert.match(workflow,/Diagnose failed production D1 catalog and account schema/);
 assert.match(workflow,/if: failure\(\)/);
 assert.match(workflow,/continue-on-error: true/);
 assert.match(workflow,/secrets\.CLOUDFLARE_API_TOKEN/);
 assert.match(workflow,/PS_D1_DATABASE_ID:/);
 assert.match(workflow,/node scripts\/check-readonly-d1-incident\.mjs/);
 assert.match(script,/SELECT name FROM sqlite_master/);
 assert.match(script,/SELECT COUNT\(\*\) AS rows FROM catalog_current/);
 assert.match(script,/PRAGMA table_info\(user_accounts\)/);
 assert.match(script,/PRAGMA table_info\(user_sessions\)/);
 assert.match(script,/--remote/);
 assert.match(script,/free_daily_row_read_quota_exhausted/);
 assert.match(script,/free_daily_row_write_quota_exhausted/);
 // Execute the exact pure classifier without importing/executing the
 // credential-scoped Wrangler script or making any network requests.
 const start=script.indexOf('function category(raw){');
 const end=script.indexOf('\nconst checks=',start);
 assert.ok(start>=0&&end>start);
 const classify=runInNewContext(script.slice(start,end)+'\ncategory');
 assert.equal(classify("Your account has exceeded D1's free tier daily row read limit."),
  'free_daily_row_read_quota_exhausted');
 assert.equal(classify("Your account has exceeded D1's free tier daily row write limit."),
  'free_daily_row_write_quota_exhausted');
 assert.equal(classify("D1 DB is overloaded. Requests queued for too long."),
  'database_overloaded');
 assert.equal(classify('no such table: catalog_current'),'missing_table');
 assert.match(script,/\['basic_select','SELECT 1 AS reachable'\]/);
 assert.match(script,/\['insights','ps-build-studio-db'/);
 assert.match(script,/--sort-by=reads/);
 assert.match(script,/queryClass:queryClass\(item.query\)/);
 assert.doesNotMatch(script,/console\.(?:log|warn|error)\([^\n]*item\.query/);
 assert.match(script,/TARGET_ACCOUNT/);
 assert.match(script,/TARGET_DB/);
 assert.doesNotMatch(script,/\b(?:INSERT INTO|UPDATE\s+\w+|DELETE FROM|DROP TABLE|ALTER TABLE|REPLACE INTO)\b/i);
 assert.doesNotMatch(script,/console\.(?:log|warn)\([^\n]*result\.(?:stdout|stderr)/);
});
