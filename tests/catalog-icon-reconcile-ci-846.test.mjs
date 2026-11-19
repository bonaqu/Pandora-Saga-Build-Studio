import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {permittedFiles,eligibleMirrorPR} from '../scripts/catalog-icon-reconcile-ci.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const repo='bonaqu/Pandora-Saga-Build-Studio';
const sha='1234567890abcdef1234567890abcdef12345678';
const mirrorFiles=[{filename:'assets/os-icon-manifest.json',status:'modified'},
 {filename:'assets/items/icons/I_018017_00.webp',status:'added'},
 {filename:'assets/items/icons/I_051036_00.webp',status:'added'},
 {filename:'assets/wiki/honor-victories.jpg',status:'added'}];
const pr={state:'open',draft:false,changed_files:mirrorFiles.length,
 head:{ref:'catalog/original-icons-'+sha.slice(0,12),sha,repo:{full_name:repo}},
 base:{ref:'bonaqu_projects',sha,repo:{full_name:repo}}};
const checks=['Studio quality checks','Chromium browser smoke'].map(name=>({
 name,head_sha:sha,event:'workflow_dispatch',status:'completed',conclusion:'success'}));
test('only canonical source WebP paths and icon manifest are eligible for automated publishing',()=>{
 assert.equal(permittedFiles(mirrorFiles.map(x=>x.filename)),true);
 for(const path of ['data/os/items.json','index.html',
  'assets/items/icons/../hack.webp','assets/items/icons/flag.png',
  'assets/icon-manifest.json','.github/workflows/quality.yml',
  'assets/souls/icons/☠.webp','assets/items/icons/I_1.webp/extra'])
  assert.equal(permittedFiles([...mirrorFiles.map(x=>x.filename),path]),false,path);
 assert.equal(permittedFiles([]),false);
 assert.equal(permittedFiles(['assets/os-icon-manifest.json','assets/os-icon-manifest.json']),false);
});
test('auto-merge requires trusted PR, original base and two exact SHA workflow dispatches',()=>{
 assert.equal(eligibleMirrorPR({pr,files:mirrorFiles,sourceSha:sha,
  currentBase:sha,checks}),true);
 assert.equal(eligibleMirrorPR({pr,files:mirrorFiles,sourceSha:sha,
  currentBase:'another-commit',checks}),false);
 assert.equal(eligibleMirrorPR({pr:{...pr,head:{...pr.head,sha:'modified'}},
  files:mirrorFiles,sourceSha:sha,currentBase:sha,checks}),false);
 assert.equal(eligibleMirrorPR({pr:{...pr,draft:true},files:mirrorFiles,
  sourceSha:sha,currentBase:sha,checks}),false);
 assert.equal(eligibleMirrorPR({pr,files:mirrorFiles,
  sourceSha:sha,currentBase:sha,checks:checks.slice(0,1)}),false);
 assert.equal(eligibleMirrorPR({pr,files:mirrorFiles,
  sourceSha:sha,currentBase:sha,checks:checks.map(x=>({...x,event:'pull_request'}))}),false);
 assert.equal(eligibleMirrorPR({pr:{...pr,changed_files:5},
  files:mirrorFiles,sourceSha:sha,currentBase:sha,checks}),false);
});
test('recover work only after live parity, with no cron and no need to mutate D1',()=>{
 const yml=read('.github/workflows/catalog-icon-reconcile.yml');
 assert.match(yml,/workflow_run:/);
 assert.match(yml,/workflow_run:[\s\S]*?branches:\s*\n\s*- bonaqu_projects/);
 assert.doesNotMatch(yml,/^\s*- Live Pages and Worker readiness/m,
  'Routine UI releases must not start a separate icon recovery runner');
 assert.match(yml,/workflow_dispatch:/);
 assert.match(yml,/mode:/);
 assert.match(yml,/inputs\.mode == 'new'/);
 assert.match(yml,/inputs\.mode != 'new'/);
 const readiness=read('.github/workflows/live-readonly.yml');
 const parity=readiness.indexOf('run: npm run catalog:parity:live');
 const inspect=readiness.indexOf('run: node scripts/should-recover-original-icons.mjs');
 const trigger=readiness.indexOf('gh workflow run catalog-icon-reconcile.yml');
 assert.ok(parity>=0&&inspect>parity&&trigger>inspect,
  'Only fully verified catalog publication may dispatch the asset mirror');
 assert.match(readiness,/steps\.icons\.outputs\.needed == 'true'/);
 assert.match(readiness,/steps\.icons\.outcome == 'failure'/);
 assert.match(readiness,/actions: write/);
 assert.match(readiness,/-f mode=new/);
 assert.match(yml,/node scripts\/mirror-os-icons\.mjs --limit=90/);
 assert.match(yml,/node scripts\/mirror-os-icons\.mjs --retry-404/);
 assert.match(yml,/Manually recheck historical HTTP 404 originals/);
 assert.match(yml,/Verified catalog fallback auto-merge/);
 const ci=read('scripts/catalog-icon-reconcile-ci.mjs');
 assert.match(ci,/for\(let page=1;page<=6;page\+\+\)/);
 assert.match(ci,/files\?per_page=100&page=/);
 assert.match(yml,/npm run assets:audit/);
 assert.doesNotMatch(yml,/schedule:|cron:|wrangler d1/);
 assert.match(yml,/mirror-honor-victories/);
 const mirror=read('scripts/mirror-os-icons.mjs');
 assert.match(mirror,/const contentChanged=!prior\|\|meaningful\(prior\)!==meaningful\(manifest\)/);
 assert.match(mirror,/failures.get\(id\)==='HTTP 404'/);
 assert.match(mirror,/Number\(known404.has\(key\(a\)\)\)/);
 assert.match(mirror,/some\(x=>x!=='HTTP 404'\)/);
 const app=read('pandora-studio-app.js');
 assert.match(app,/fetch\('\.\/assets\/os-icon-manifest\.json',\{cache:'no-store'\}\)/);
});
