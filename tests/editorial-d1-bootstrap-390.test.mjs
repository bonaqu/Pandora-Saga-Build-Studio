import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
import worker from '../worker/index.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const manifest=buildEditorialDefaultsManifest();
const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/editorial-defaults';

function client(){
 const window={};
 runInNewContext(read('pandora-studio-editorial-defaults-client.js'),
  {window,crypto:webcrypto,TextEncoder,Uint8Array,URL},{
   filename:'pandora-studio-editorial-defaults-client.js',timeout:5000});
 for(const path of ['pandora-studio-hero-book.js','pandora-studio-ui-locale.js',
  'pandora-studio-honor-guide.js','pandora-studio-wiki-labels.js'])
  runInNewContext(read(path),{window},{filename:path,timeout:5000});
 return window;
}
function stagingDB(){
 const queries=[];
 const marker={snapshot:manifest.snapshot,source_release:manifest.release,
  sha256:manifest.digest,expected_rows:manifest.records.length};
 const rows=manifest.records.map(r=>({record_key:r.recordKey,field:r.field,value:r.value}));
 const db={prepare(sql){
  queries.push(sql);
  if(sql.includes('sqlite_master'))return {all:async()=>({results:[
   {name:'editorial_default_rows'},{name:'editorial_default_snapshots'}
  ]})};
  if(sql.includes('FROM editorial_default_snapshots'))
   return {bind:snapshot=>({first:async()=>snapshot===manifest.snapshot?marker:null})};
  if(sql.includes('FROM editorial_default_rows'))
   return {bind:snapshot=>({all:async()=>({results:snapshot===manifest.snapshot?rows:[]})})};
  throw Error('Unexpected SQL query');
 }};
 return {db,queries};
}
function throughWorker(env){
 return (url,options)=>worker.fetch(new Request(url,options),env,{});
}

test('#390 production startup pins exact current manifest before CAS and final render',()=>{
 const app=read('pandora-studio-app.js');
 const match=/const EDITORIAL_DEFAULTS_PIN='([^']+)'/.exec(app);
 assert.ok(match,'Required reviewed exact snapshot pin must exist');
 assert.equal(match[1],manifest.snapshot,'A release change must review and re-pin defaults');
 const startup=app.slice(app.indexOf('async function startStudio('));
 assert.match(startup,/const editorialReady=archive\|\|typeof window\.PandoraEditorialDefaults\?\.loadPinned!=='function'/);
 assert.match(startup,/PandoraEditorialDefaults\.loadPinned\(EDITORIAL_DEFAULTS_PIN,/);
 assert.match(startup,/endpoint:API\+'\/api\/editorial-defaults'/);
 assert.match(startup,/signal:AbortSignal\.timeout\(6000\)/);
 assert.ok(startup.indexOf('const editorialReady=')<startup.indexOf('await loadCatalog('),
  'Optional fetch must overlap game catalog loading');
 assert.ok(startup.indexOf('await editorialReady;')<
  startup.indexOf('await loadOverrides({strict:true,commit:false});'),
  'Only fully verified defaults may become source fallback before owner CAS');
 assert.ok(startup.indexOf('await editorialReady;')<
  startup.indexOf('applyGameLocale({persistReconciled:false});'),
  'Initial render must use the installed snapshot, not late popup edits');
});

test('#390 real Worker response → pinned browser SHA verification → owner CAS precedence',async()=>{
 const {db,queries}=stagingDB();
 const page=client(),reader=page.PandoraEditorialDefaults;
 const loaded=await reader.loadPinned(manifest.snapshot,{
  endpoint,fetcher:throughWorker({DB:db,EDITORIAL_DEFAULTS_PREVIEW:'enabled'}),
  subtle:webcrypto.subtle
 });
 assert.equal(loaded,true,'All source rows must be accepted by the real Worker reader');
 assert.equal(reader.status().active,true);
 assert.equal(reader.status().snapshot,manifest.snapshot);
 assert.deepEqual(queries.length,3);
 assert.ok(queries.every(q=>/^\s*SELECT\b/i.test(q)),'D1 read-only');
 assert.equal(reader.value('guideedit.book.equipment.tab.choose','ru'),
  manifest.records.find(r=>r.recordKey==='guideedit.book.equipment.tab.choose'&&r.field==='ru').value);
 const ui=page.PandoraUILocale,key='wiki',recordKey='guideedit.book.'+ui.fieldKey(key);
 assert.equal(ui.text(key,'en'),ui.baseText(key,'en'));
 ui.setOverrides({[recordKey]:JSON.stringify({en:'My owner caption'})});
 assert.equal(ui.text(key,'en'),'My owner caption');
 reader.reset();
 assert.equal(ui.text(key,'en'),'My owner caption','Reset must not delete CAS');
 ui.setOverrides({});
 assert.equal(ui.text(key,'en'),ui.baseText(key,'en'),'Code fallback after reset');
});

test('#390 production Worker disabled → no D1 queries and original RU/EN fallback',async()=>{
 const page=client(),reader=page.PandoraEditorialDefaults;
 let reads=0;
 const db={prepare(){reads++;throw Error('No D1 reads allowed')}};
 const loaded=await reader.loadPinned(manifest.snapshot,{
  endpoint,fetcher:throughWorker({DB:db,EDITORIAL_DEFAULTS_PREVIEW:'disabled'}),
  subtle:webcrypto.subtle
 });
 assert.equal(loaded,false);
 assert.equal(reads,0,'A disabled Worker must never query D1');
 assert.equal(reader.status().active,false);
 assert.equal(page.PandoraUILocale.text('wiki','ru'),
  page.PandoraUILocale.baseText('wiki','ru'));
 assert.equal(page.PandoraWikiLabels.value({},'honor','victories','en'),
  'PvP Victories');
});

test('#390 exact snapshot mismatch never changes the existing verified client',async()=>{
 const page=client(),reader=page.PandoraEditorialDefaults;
 const {db}=stagingDB();
 assert.equal(await reader.loadPinned(manifest.snapshot,{
  endpoint,fetcher:throughWorker({DB:db,EDITORIAL_DEFAULTS_PREVIEW:'enabled'}),
  subtle:webcrypto.subtle
 }),true);
 const altered=manifest.snapshot.replace(/.$/,'f');
 assert.notEqual(altered,manifest.snapshot);
 assert.equal(await reader.loadPinned(altered,{
  endpoint,fetcher:throughWorker({DB:db,EDITORIAL_DEFAULTS_PREVIEW:'enabled'}),
  subtle:webcrypto.subtle
 }),false);
 assert.equal(reader.status().snapshot,manifest.snapshot);
});
