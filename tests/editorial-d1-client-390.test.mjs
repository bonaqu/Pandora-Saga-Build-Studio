import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=buildEditorialDefaultsManifest();
const digest=rows=>createHash('sha256')
 .update(JSON.stringify({schema:1,release:manifest.release,records:rows}),'utf8')
 .digest('hex');
const records=()=>manifest.records.map(row=>({...row}));
function fixture(patches=[]){
 const rows=records();
 for(const [recordKey,field,value] of patches){
  const index=rows.findIndex(row=>row.recordKey===recordKey&&row.field===field);
  assert.ok(index>=0,'Missing source default: '+recordKey+'/'+field);
  rows[index].value=value;
 }
 const checksum=digest(rows);
 return {schema:1,release:manifest.release,records:rows,
  sha256:checksum,snapshot:manifest.release+'-'+checksum.slice(0,16)};
}
function context(){
 const root={};
 const scope={window:root,crypto:webcrypto,TextEncoder,Uint8Array,URL};
 for(const path of [
  'pandora-studio-editorial-defaults-client.js',
  'pandora-studio-hero-book.js',
  'pandora-studio-ui-locale.js',
  'pandora-studio-honor-guide.js',
  'pandora-studio-wiki-labels.js'
 ])runInNewContext(read(path),scope,{filename:path,timeout:5000});
 return root;
}
const expectPlain=obj=>JSON.parse(JSON.stringify(obj));

test('#390 staged D1 client is inert until explicit verified version activation',async()=>{
 const root=context();
 const stage=root.PandoraEditorialDefaults;
 const ui=root.PandoraUILocale;
 assert.deepEqual(expectPlain(stage.status()),{active:false,snapshot:null});
 assert.equal(stage.value('guideedit.wiki.labels','honor_victories_ru'),null);
 assert.equal(ui.text('wiki','ru'),ui.baseText('wiki','ru'));
 const payload=fixture();
 assert.equal(await stage.installVerified(payload,payload.snapshot,webcrypto.subtle),true);
 assert.deepEqual(expectPlain(stage.status()),{active:true,snapshot:payload.snapshot});
 assert.equal(stage.value('guideedit.wiki.labels','honor_victories_ru'),'Победы в PvP');
 stage.reset();
 assert.deepEqual(expectPlain(stage.status()),{active:false,snapshot:null});
});

test('#390 verified equipment summary defaults are below existing owner CAS',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const key='guideedit.book.equipment.field.soul-compatible';
 const hint='guideedit.book.equipment.hint.souls';
 const patched=fixture([
  [key,'ru','Совместимые слоты · staging'],
  [key,'en','Compatible slots · staging'],
  [hint,'en','Manage Soul sockets · staging']
 ]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').ru,'Совместимые слоты · staging');
 assert.equal(guide.field({},'equipment.hint.souls',
  'Вставить, заменить или снять душу.','Insert, replace or remove a Soul.').en,
  'Manage Soul sockets · staging');
 const override={[key]:JSON.stringify({ru:'Редактура владельца'})};
 assert.equal(guide.field(override,'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').ru,'Редактура владельца');
 assert.equal(guide.field(override,'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').en,'Compatible slots · staging');
 stage.reset();
 assert.equal(guide.field({},'equipment.field.soul-compatible',
  'Подходящие слоты','Compatible slots').ru,'Подходящие слоты');
});

test('#390 verified Soul-unavailable defaults stay below CAS without changing actual socket rules',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const id='guideedit.book.equipment.soul-unavailable-zero.weapon';
 const fallback='Управление душами этого оружия недоступно: 0 слотов для душ.';
 const en='Soul management for this weapon is unavailable: 0 Soul slots.';
 const patched=fixture([[id,'ru','Недоступно для этого оружия · staging']]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.soul-unavailable-zero.weapon',fallback,en).ru,
  'Недоступно для этого оружия · staging');
 const override={[id]:JSON.stringify({ru:'Редактура владельца'})};
 assert.equal(guide.field(override,'equipment.soul-unavailable-zero.weapon',fallback,en).ru,
  'Редактура владельца');
 stage.reset();
 assert.equal(guide.field({},'equipment.soul-unavailable-zero.weapon',fallback,en).ru,
  fallback);
});

test('#390 pinned context menu and Origin captions never outrank existing CAS edits',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,guide=root.PandoraHonorGuide;
 const contextKey='guideedit.book.equipment.context.remove';
 const originKey='guideedit.book.origin.tab-race';
 const patched=fixture([
  [contextKey,'ru','Снять предмет · staging'],
  [originKey,'en','Hero race · staging']
 ]);
 assert.equal(await stage.installVerified(patched,patched.snapshot,webcrypto.subtle),true);
 assert.equal(guide.field({},'equipment.context.remove','Снять вещь','Unequip item').ru,
  'Снять предмет · staging');
 assert.equal(guide.field({},'origin.tab-race','Раса','Race').en,
  'Hero race · staging');
 const override={[originKey]:JSON.stringify({en:'Race · owner'})};
 assert.equal(guide.field(override,'origin.tab-race','Раса','Race').en,'Race · owner');
 stage.reset();
 assert.equal(guide.field({},'origin.tab-race','Раса','Race').en,'Race');
});

test('#390 staging text uses only exact semantic identities and CAS outranks defaults',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults;
 const ui=root.PandoraUILocale,guide=root.PandoraHonorGuide,wiki=root.PandoraWikiLabels;
 const key=ui.bookFieldKey('Выбранные усиления'),id=ui.fieldKey(key);
 const uiRecord='guideedit.book.'+id;
 const changed=fixture([
  [uiRecord,'ru','Выбранные усиления · staging'],
  [uiRecord,'en','Configured enhancements · staging'],
  ['guideedit.wiki.labels','honor_victories_ru','Победы PvP · staging'],
  ['guideedit.wiki.labels','honor_victories_en','PvP Victories · staging'],
  ['guideedit.honor.overview','overviewRu','Описание чести · staging'],
  ['guideedit.honor.rank.0','benefitEn','Rank reward · staging'],
  ['guideedit.book.attack.mountedToggle','hintRu','Настоящая подсказка · staging'],
  ['guideedit.book.wiki.item-field.pen','hintRu','Пробитие · staging'],
  ['guideedit.book.equipment.tab.choose','en','Choose gear · staging']
 ]);
 assert.equal(await stage.installVerified(changed,changed.snapshot,webcrypto.subtle),true);
 assert.equal(ui.text(key,'ru'),'Выбранные усиления · staging');
 assert.equal(ui.text(key,'en'),'Configured enhancements · staging');
 assert.equal(ui.baseText(key,'ru'),'Выбранные усиления',
  'Versioned source fallback remains stable for SQL generation');
 assert.equal(wiki.value({},'honor','victories','ru'),'Победы PvP · staging');
 assert.equal(wiki.value({},'honor','victories','en'),'PvP Victories · staging');
 assert.equal(guide.article({}).overview.overviewRu,'Описание чести · staging');
 assert.equal(guide.article({}).ranks[0].benefitEn,'Rank reward · staging');
 assert.equal(guide.field({},'attack.mountedToggle','Верхом','Mounted').hintRu,
  'Настоящая подсказка · staging');
 assert.equal(guide.field({},'wiki.item-field.pen','Пробитие','Penetration',
  'Original item description','Original item hint').hintRu,'Пробитие · staging');
 assert.equal(guide.field({},'equipment.tab.choose','Выбрать другую вещь',
  'Choose another item').en,'Choose gear · staging');

 ui.setOverrides({[uiRecord]:JSON.stringify({ru:'Редактура владельца'})});
 assert.equal(ui.text(key,'ru'),'Редактура владельца');
 assert.equal(ui.text(key,'en'),'Configured enhancements · staging',
  'An RU-only override must not erase the staged EN fallback');
 assert.equal(wiki.value({'guideedit.wiki.labels':JSON.stringify({
  honor_victories_ru:'Победы владельца'
 })},'honor','victories','ru'),'Победы владельца');
 assert.equal(guide.article({'guideedit.honor.overview':JSON.stringify({
  overviewRu:'Честь владельца'
 })}).overview.overviewRu,'Честь владельца');
 assert.equal(guide.field({'guideedit.book.attack.mountedToggle':
  JSON.stringify({hintRu:'Подсказка владельца'})},
 'attack.mountedToggle','Верхом','Mounted').hintRu,'Подсказка владельца');
 assert.equal(guide.article({'guideedit.honor.rank.0':JSON.stringify({
  benefitEn:'Owner rank benefit'
 })}).ranks[0].benefitEn,'Owner rank benefit');

 stage.reset();
 ui.setOverrides({});
 assert.equal(ui.text(key,'ru'),'Выбранные усиления');
 assert.equal(wiki.value({},'honor','victories','ru'),'Победы в PvP');
 assert.equal(guide.article({}).overview.overviewRu,guide.intro.overviewRu);
});

test('#390 staged frontend rejects corrupt, stale, unapproved or gameplay keys',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults;
 const first=fixture();
 const wrong=fixture([['guideedit.wiki.labels','honor_victories_en','Edited translation']]);
 assert.equal(await stage.installVerified(first,first.snapshot,webcrypto.subtle),true);
 for(const invalid of [
  {...wrong,snapshot:first.snapshot},
  {...wrong,sha256:first.sha256,snapshot:first.snapshot},
  {...first,records:first.records.slice(1)},
  {...first,records:[first.records[0],...first.records.slice(0,-1)]},
  {...first,records:first.records.map((r,i)=>i===1?
   {...r,recordKey:'guideedit.book.game.damage.17'}:r)},
  {...first,records:first.records.map((r,i)=>i===1?
   {...r,field:'amount'}:r)}
 ]){
  assert.equal(await stage.installVerified(invalid,first.snapshot,webcrypto.subtle),
   false,'Malformed staging data must never be activated');
  assert.equal(stage.status().snapshot,first.snapshot,
   'Invalid input does not replace the last verified data');
 }
 assert.equal(await stage.installVerified(first,'1.2.3-deadbeefdeadbeef',
  webcrypto.subtle),false);
 assert.equal(stage.status().snapshot,first.snapshot);
});

test('#390 stale async verification cannot re-activate defaults after reset',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults;
 const payload=fixture();
 let proceed;
 const subtle={digest:()=>new Promise(resolve=>{proceed=resolve})};
 const pending=stage.installVerified(payload,payload.snapshot,subtle);
 // Let the pending digest take its turn in the event loop.
 await Promise.resolve();
 assert.equal(typeof proceed,'function');
 stage.reset();
 const checksum=await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(
  JSON.stringify({schema:1,release:payload.release,records:payload.records})));
 proceed(checksum);
 assert.equal(await pending,false);
 assert.equal(stage.status().active,false);
});

test('#390 explicit staging fetch pins exact digest and never sends credentials',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,payload=fixture();
 const requests=[];
 const fetcher=async(url,options)=>{
  requests.push({url,options});
  return {ok:true,json:async()=>payload};
 };
 assert.equal(await stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher,subtle:webcrypto.subtle}),true);
 assert.equal(stage.status().snapshot,payload.snapshot);
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,
  'https://staging.example/api/editorial-defaults?snapshot='+payload.snapshot);
 assert.deepEqual(expectPlain(requests[0].options),{
  method:'GET',credentials:'omit',cache:'no-store',redirect:'error'
 });
 for(const endpoint of [
  'http://staging.example/api/editorial-defaults',
  'https://username:secret@staging.example/api/editorial-defaults',
  'https://staging.example/api/editorial-defaults?latest=1',
  'https://staging.example/api/overrides',
  'https://staging.example/api/editorial-defaults#token',
  '//staging.example/api/editorial-defaults'
 ]){
  assert.equal(await stage.loadPinned(payload.snapshot,{
   endpoint,fetcher,subtle:webcrypto.subtle}),false,endpoint);
 }
 assert.equal(requests.length,1,
  'No network requests to unpinned, insecure or credential-bearing URLs');
 assert.equal(await stage.loadPinned('latest',{endpoint:
  'https://staging.example/api/editorial-defaults',fetcher}),false);
 assert.equal(requests.length,1);
});

test('#390 delayed staging responses cannot overtake reset or a newer version',async()=>{
 const root=context(),stage=root.PandoraEditorialDefaults,payload=fixture();
 let resolveOld;
 const fetcher=async()=>new Promise(resolve=>{resolveOld=resolve});
 const slow=stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher,subtle:webcrypto.subtle});
 const faster=stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher:async()=>({ok:true,json:async()=>payload}),
  subtle:webcrypto.subtle});
 assert.equal(await faster,true);
 resolveOld({ok:true,json:async()=>payload});
 assert.equal(await slow,false,'Older staged request cannot replace newer verified data');
 assert.equal(stage.status().snapshot,payload.snapshot);
 const unavailable=await stage.loadPinned(payload.snapshot,{
  endpoint:'https://staging.example/api/editorial-defaults',
  fetcher:async()=>({ok:false,status:503}),
  subtle:webcrypto.subtle});
 assert.equal(unavailable,false);
 assert.equal(stage.status().snapshot,payload.snapshot,
  'A failed fetch never discards the previously verified snapshot');
});

test('#390 no implicit network fetch, Worker mutation or editor pencil is added',()=>{
 const stage=read('pandora-studio-editorial-defaults-client.js');
 const html=read('index.html'),worker=read('worker/index.js');
 const locale=read('pandora-studio-ui-locale.js');
 const honor=read('pandora-studio-honor-guide.js');
 const wiki=read('pandora-studio-wiki-labels.js');
 assert.match(html,/pandora-studio-editorial-defaults-client\.js/);
 assert.match(locale,/PandoraEditorialDefaults\?\.value/);
 assert.match(honor,/function stagedFallback\(/);
 assert.match(wiki,/PandoraEditorialDefaults\?\.value/);
 assert.doesNotMatch(stage,/fetch\(|XMLHttpRequest|localStorage|document\.cookie/);
 assert.match(stage,/credentials:'omit',cache:'no-store',redirect:'error'/);
 assert.match(worker,/env\.EDITORIAL_DEFAULTS_PREVIEW!=='enabled'/);
 assert.match(worker,/if\(path==='\/api\/overrides'&&method==='GET'\)/);
 assert.match(worker,/if\(path==='\/api\/admin\/override'&&method==='POST'\)/);
});
