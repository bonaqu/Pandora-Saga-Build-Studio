import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const ctx={window:{}};
for(const name of ['pandora-os-catalog-import.js','pandora-os-catalog-review.js'])
 vm.runInNewContext(read(name),ctx);
const importer=ctx.window.PandoraCatalogImport;
const review=ctx.window.PandoraOSCatalogReview;
const workbench=read('pandora-os-catalog-workbench.js');
const app=read('pandora-studio-app.js');
const human=read('pandora-os-catalog-human-review.js');
const css=read('pandora-os-catalog-workbench.css');
const browser=read('tests/browser-admin-entry.mjs');

test('full review applies every selected archive-dataset change and validates the result',()=>{
 const previous=Object.fromEntries(importer.files.map(name=>
  [name,JSON.parse(read('data/os/'+name+'.json'))]));
 const current=structuredClone(previous);
 const itemKey=Object.keys(current.items)[0];
 const oldDescription=String(current.items[itemKey].desc||'');
 current.items[itemKey].desc=oldDescription+' · проверка выбора';
 const oldCap=current.tables.levelCap;
 current.tables.levelCap=oldCap===50?49:50;
 const found=importer.files.flatMap(name=>review.changes(name,previous[name],current[name]));
 assert.ok(found.some(x=>x.dataset==='items'));
 assert.ok(found.some(x=>x.dataset==='tables'));
 const selected=new Set(found.map(x=>x.id));
 const merged=review.compose(previous,current,selected,importer.files);
 const audit=review.auditSelection(previous,current,merged,selected,importer.files);
 assert.equal(audit.approved,found.length);
 assert.equal(audit.retained,0);
 assert.equal(merged.tables.levelCap,current.tables.levelCap);
 assert.equal(merged.items[itemKey].desc,current.items[itemKey].desc);
 const approved=JSON.parse(read('data/localization/legacy-approved.v1.json'));
 const prepared=importer.normalize(merged,approved);
 assert.ok(prepared.counts.items>0);
 assert.ok(prepared.counts.tables>0);
 assert.equal(prepared.datasets.includes('legacyLocale'),true);
 // Never apply a partial selection accidentally, even when tables are atomic.
 const onlyItem=new Set(found.filter(x=>x.dataset==='items').map(x=>x.id));
 const partial=review.compose(previous,current,onlyItem,importer.files);
 review.auditSelection(previous,current,partial,onlyItem,importer.files);
 assert.equal(partial.tables.levelCap,oldCap);
});

test('select all explains risks and requires a fresh acknowledgement per selection',()=>{
 assert.match(workbench,/class:'os-sync-decision-preview'/);
 assert.match(workbench,/class:'os-sync-risk-approval'/);
 assert.match(workbench,/const selectedFingerprint=\(\)=>JSON\.stringify/);
 assert.match(workbench,/const risky=Boolean\(deleted\|\|settings\|\|unsure\|\|links\|\|formulas\|\|mode==='archive'\)/);
 assert.match(workbench,/riskApprovalFingerprint!==fingerprint/);
 assert.match(workbench,/publish\.disabled=!ready\|\|!acknowledged/);
 assert.match(workbench,/Предел уровня:/);
 assert.match(workbench,/for\(const item of changes\)chosen\.add\(item\.id\)/);
 assert.match(css,/\.os-sync-decision-preview\{/);
 assert.match(css,/\.os-sync-risk-approval:focus-within/);
 assert.match(browser,/High-risk Select all must require explicit review acknowledgment/);
 assert.match(browser,/Rejecting final confirmation cannot write a catalog snapshot/);
});

test('publication retains source CAS, blocks close while writing and checks player-visible revision',()=>{
 assert.match(workbench,/expectedActive:activeSnapshot/);
 assert.match(workbench,/const closeButton=view\.closest\('\.modal'\)\?\.querySelector\('button\.close'\)/);
 assert.match(workbench,/if\(closeButton\)closeButton\.disabled=true/);
 assert.match(workbench,/canClose:\(\)=>!publishing/);
 assert.match(app,/function modal\(title,content\)\{/);
 assert.match(app,/if\(!canClose\(\)\)return/);
 assert.match(workbench,/async function verifyPublishedForPlayers\(snapshot\)/);
 assert.match(workbench,/response\.headers\.get\('x-ps-catalog-snapshot'\)/);
 assert.match(workbench,/active!==snapshot/);
 assert.match(workbench,/await verifyPublishedForPlayers\(result\.active\)/);
 assert.match(workbench,/await verifyPublishedForPlayers\(observed\.active\)/);
 assert.match(workbench,/обновление данных у игроков пока не подтверждено/);
});
test('players are not shown the name of the third-party source',()=>{
 const html=read('index.html');
 const publicModules=[
  'pandora-studio-ui-locale.js','pandora-studio-hero-book.js',
  'pandora-studio-equipment-ui.js','pandora-studio-item-presentation.js',
  'pandora-studio-account-ui.js','pandora-studio-build-comparison.js'
 ];
 assert.doesNotMatch(html,/pandorasaga-os\.com|Pandora Saga OS/i);
 for(const name of publicModules)
  assert.doesNotMatch(read(name),/pandorasaga-os\.com|Pandora Saga OS/i,name);
 assert.doesNotMatch(workbench,/сайта OS|модель сайта OS|модели сайта OS|pandorasaga-os\.com/i);
 // Live URLs needed for source ingestion and icons remain internal code data.
 assert.match(app,/const OS='https:\/\/pandorasaga-os\.com'/);
 assert.doesNotMatch(human,/расчёт сайта OS|модели OS|сайта OS/);
});
