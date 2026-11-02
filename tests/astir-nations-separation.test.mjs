import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ctx={window:{}};
for(const path of ['pandora-studio-astir-locations.js','pandora-studio-encyclopedia-data.js'])
 vm.runInNewContext(read(path),ctx,{filename:path});
const geo=ctx.window.PandoraAstirLocations;
const data=JSON.parse(read('data/os/trades.json'));
const wiki=ctx.window.PandoraWikiData.build({trades:data,maps:JSON.parse(read('data/os/maps.json'))});

test('city and nation IDs are disjoint, and the original trade map IDs remain nations',()=>{
 assert.equal(geo.districtIds.length,4);
 assert.equal(geo.countryIds.length,3);
 assert.equal(new Set([...geo.districtIds,...geo.countryIds]).size,7);
 for(const [id,name] of [
  ['1002001','Союз северных племен Ванриг'],
  ['1003001','Королевство Сэнт-Фальстайн'],
  ['1004001','Лотарская империя']]){
  assert.equal(data.mapNames[id].name,name);
  assert.equal(wiki.records('map')[id].name,name);
  assert.equal(geo.district(id),null);
  assert.ok(geo.country(id));
 }
 for(const district of geo.districtIds){
  assert.ok(wiki.records('map')[district],'Distinct Astir district '+district);
  assert.ok(geo.district(district));
  assert.equal(geo.country(district),null);
 }
 assert.equal(wiki.records('map')['astir-kingdom'].name,'Территория Королевства');
 assert.equal(wiki.records('map')['1003001'].name,'Королевство Сэнт-Фальстайн');
});

test('nation NPCs are not silently moved to same-named districts',()=>{
 for(const [npc,country,district] of [
  ['131','1003001','astir-kingdom'],
  ['232','1004001','astir-empire'],
  ['331','1002001','astir-union'],
  ['133','1003001','astir-kingdom'],
  ['234','1004001','astir-empire'],
  ['333','1002001','astir-union']]){
  assert.ok(data.npcs[npc].maps.includes(Number(country)));
  assert.ok(wiki.residents(country).some(([id])=>id===npc));
  assert.equal(wiki.residents(district).some(([id])=>id===npc),false,
   'Nation NPC '+npc+' was incorrectly moved to Astir');
 }
 assert.ok(wiki.residents('1001004').some(([id])=>id==='53'),
  'Central Plaza keeps its existing true NPCs');
});

test('only screenshot-verified Claris resides in Astir Kingdom district',()=>{
 const expectedId='astir-npc-kingdom-claris';
 assert.deepEqual(Array.from(wiki.residents('astir-union'),([id])=>id),[]);
 assert.deepEqual(Array.from(wiki.residents('astir-empire'),([id])=>id),[]);
 assert.deepEqual(Array.from(wiki.residents('astir-kingdom'),([id])=>id),[expectedId]);
 const npc=wiki.records('npc')[expectedId];
 assert.equal(npc.name,'Кларис');
 assert.equal(npc.service,'Открытие сундуков');
 assert.equal(npc.grid,undefined,'No coordinates were provided for Claris');
 assert.equal(npc.source,'game-screenshot');
 assert.deepEqual(Array.from(npc.maps),['astir-kingdom']);
 assert.equal(npc.virtual,true);
 const synthetic=Object.keys(wiki.records('npc')).filter(id=>id.startsWith('astir-npc-'));
 assert.deepEqual(synthetic,[expectedId]);
 assert.equal(wiki.search('npc','Кларис').some(([id])=>id===expectedId),true);
 assert.equal('route' in geo,false);
 assert.doesNotMatch(read('pandora-studio-app.js'),/Маршрут из Астира/);
});

test('unconfirmed NPC identities are not exposed in current map or chest records',()=>{
 const app=read('pandora-studio-app.js');
 const model=read('pandora-studio-astir-locations.js');
 for(const invalid of ['Культье','Олсон','Барнс','Рэндалл','Кларис','K-11']){
  if(invalid==='Кларис')continue;
  assert.ok(!app.includes(invalid),'Unsupported player-facing name '+invalid);
  assert.ok(!model.includes(invalid),'Unsupported synthetic NPC '+invalid);
 }
 assert.ok(app.includes("'astir-npc-kingdom-claris'"));
 assert.ok(app.includes("'astir-kingdom'"));
 assert.ok(!app.includes("'astir-empire'") || !app.includes("'astir-npc-empire-claris'"));
});
test('old D1 country labels are corrected in the read-only index, not in NPC records',()=>{
 const legacy=structuredClone(data);
 legacy.mapNames['1002001'].name='Территория Союза';
 legacy.mapNames['1003001'].name='Территория Королевства';
 legacy.mapNames['1004001'].name='Территория Империи';
 const n=ctx.window.PandoraWikiData.build({trades:legacy});
 assert.equal(n.records('map')['1003001'].name,'Королевство Сэнт-Фальстайн');
 assert.equal(n.records('map')['1002001'].name,'Союз северных племен Ванриг');
 assert.equal(n.records('map')['1004001'].name,'Лотарская империя');
 assert.equal(legacy.mapNames['1003001'].name,'Территория Королевства');
 assert.ok(n.residents('1003001').some(([id])=>id==='131'));
 assert.ok(n.residents('astir-kingdom').some(([id])=>id==='astir-npc-kingdom-claris'));
 assert.equal(n.residents('astir-kingdom').some(([id])=>id==='131'),false);
});

test('deep links, labels and search remain distinct in RU and EN',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js');
 assert.ok(html.indexOf('pandora-studio-astir-locations.js')<
  html.indexOf('pandora-studio-encyclopedia-data.js'));
 assert.equal(geo.localized('astir-kingdom','ru'),'Территория Королевства · Астир');
 assert.equal(geo.localized('1003001','ru'),'Королевство Сэнт-Фальстайн');
 assert.equal(geo.localized('1003001','en'),'Kingdom of St. Pfelstein');
 assert.ok(wiki.search('map','Территория Королевства').some(([id])=>id==='astir-kingdom'));
 assert.ok(wiki.search('map','Королевство Сэнт-Фальстайн').some(([id])=>id==='1003001'));
 assert.ok(app.includes("'astir-npc-kingdom-claris'"));
 assert.ok(app.includes("'astir-kingdom'"));
 assert.match(app,/wiki-map-npc/);
 assert.match(app,/const group=geo\?\.district\(id\)\?'city':geo\?\.country\(id\)\?'nation':'other'/);
});

test('refresh, back, forward and hashchange all accept stable Astir district map links',()=>{
 const app=read('pandora-studio-app.js');
 const expected=String.raw`([0-9]{1,15}|astir-(?:union|empire|kingdom)|astir-npc-kingdom-claris)`;
 assert.equal(app.split(expected).length-1,3,
  'All three hash readers must support the exact virtual district IDs');
 for(const id of geo.districtIds.filter(id=>id!=='1001004')){
  assert.ok(expected.includes('astir-'));
  assert.ok(wiki.records('map')[id]);
 }
});
