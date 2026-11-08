import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const source=readFileSync(new URL('../pandora-studio-encyclopedia-catalog.js',import.meta.url),'utf8');
const host={};
Function('window',source)(host);
const loader=host.PandoraWikiCatalog;

function catalog(identity='local'){
 const ids=Object.fromEntries(['items','monsters','maps','instances','drops',
  'trades','skills','souls','racialPassives'].map(key=>[key,1]));
 return {
  meta:{schemaVersion:1,counts:ids},
  items:{1:{id:1,name:identity,icon:'I_000001_00'}},
  monsters:{1:{id:1,name:'Monster',level:1}},
  maps:{1:{id:1,name:'Map',mobs:[1]}},
  instances:[{id:1,name:'Dungeon',mobs:[1]}],
  drops:{1:{d:[]}},trades:{trades:[{id:1,i:1,npc:[1]}],
   npcs:{1:{name:'Merchant'}},mapNames:{}},
  tables:{zoneDrops:[]},chests:{boxes:[{i:1,rolls:[[]]}],npc:[]},
  skills:{1:{id:1,name:'Racial Passive',skillType:'PASSIVE',branch:'race'}},
  racialPassives:{HUMAN:{raceId:1,key:'HUMAN',skills:[1]}},
  souls:{1:{id:1,name:'Soul',icon:'I_000001_00'}}
 };
}
function mockFetch(remote,local,{broken=null,snapshots=null,fail=null,provenance='d1'}={}){
 const paths=[],snapshotFor=key=>snapshots?.[key]||'snapshot-a';
 const fetcher=async(url)=>{
  paths.push(url);
  const isRemote=url.includes('/api/catalog/'),key=url.split('/').pop().replace('.json','');
  if(isRemote&&fail===key)return{ok:false,status:503};
  const value=structuredClone((isRemote?remote:local)[key]);
  if(isRemote&&key===broken)delete value?.id;
  return {ok:true,status:200,headers:{get:name=>name==='x-ps-catalog-snapshot'?
   (isRemote?snapshotFor(key):null):
   name==='x-ps-catalog'&&isRemote?provenance:null},json:async()=>value};
 };
 return {fetcher,paths};
}
test('racial passive registry and skills must come from the same snapshot',async()=>{
 const remote=catalog('remote'),local=catalog('archive');
 const mock=mockFetch(remote,local);
 const loaded=await loader.load({api:'https://worker.example',fetcher:mock.fetcher,strict:true});
 assert.deepEqual(loaded.data.racialPassives,remote.racialPassives);
 assert.ok(mock.paths.some(path=>path.endsWith('/racialPassives.json')));
 const invalid=catalog('bad');invalid.racialPassives.HUMAN.skills=[999];
 assert.throws(()=>loader.validate(invalid),/связи расовых пассивок/);
 const wrongKind=catalog('wrong');wrongKind.skills[1].skillType='ENEMY';
 assert.throws(()=>loader.validate(wrongKind),/связи расовых пассивок/);
 const broken=mockFetch(invalid,local);
 await assert.rejects(loader.load({api:'https://worker.example',
  fetcher:broken.fetcher,strict:true}),/связи расовых пассивок/);
});
test('published race count, unique ownership and the registry key are validated',()=>{
 const source=catalog('complete');
 assert.doesNotThrow(()=>loader.validate(source));
 const count=catalog('partial');
 count.meta.counts.racialPassives=2;
 assert.throws(()=>loader.validate(count),/Неполный каталог расовых пассивок/);
 const noCount=catalog('missing count');
 delete noCount.meta.counts.racialPassives;
 assert.throws(()=>loader.validate(noCount),/Неполный каталог расовых пассивок/);
 const duplicated=catalog('duplicated');
 duplicated.meta.counts.racialPassives=2;
 duplicated.racialPassives.ELF={raceId:2,key:'ELF',skills:[1]};
 assert.throws(()=>loader.validate(duplicated),/связи расовых пассивок/,
  'The same skill may not belong to two races');
 const repeated=catalog('repeated skill');
 repeated.racialPassives.HUMAN.skills=[1,1];
 assert.throws(()=>loader.validate(repeated),/связи расовых пассивок/,
  'Duplicate IDs within a race must not inflate its roster');
 const mismatched=catalog('bad key');
 mismatched.racialPassives.HUMAN.key='ELF';
 assert.throws(()=>loader.validate(mismatched),/связи расовых пассивок/);
 const duplicateRace=catalog('duplicate race ID');
 duplicateRace.meta.counts.racialPassives=2;
 duplicateRace.racialPassives.ELF={raceId:1,key:'ELF',skills:[2]};
 duplicateRace.skills[2]={id:2,name:'Second passive',skillType:'PASSIVE',branch:'race'};
 assert.throws(()=>loader.validate(duplicateRace),/связи расовых пассивок/);
});
test('D1 snapshots are atomic and old object-shaped instances become iterable',async()=>{
 const current=catalog('online'),local=catalog('local');
 current.instances={'1':current.instances[0]};
 const mock=mockFetch(current,local);
 const res=await loader.load({api:'https://worker.example',fetcher:mock.fetcher});
 assert.equal(res.source,'d1');
 assert.equal(res.snapshot,'snapshot-a');
 assert.equal(res.data.items[1].name,'online');
 assert.ok(Array.isArray(res.data.instances));
 assert.equal(res.data.instances[0].name,'Dungeon');
 assert.equal(mock.paths.length,loader.keys.length);
});
test('a D1 reply without a snapshot identifier cannot silently mix releases',async()=>{
 const remote=catalog('remote'),local=catalog('bundled'),mock=mockFetch(remote,local);
 const fallback=await loader.load({api:'https://worker.example',fetcher:async(url,opts)=>{
  const response=await mock.fetcher(url,opts);
  if(url.includes('/api/catalog/'))response.headers={get:()=>null};
  return response;
 }});
 assert.equal(fallback.source,'local');
 assert.equal(fallback.data.items[1].name,'bundled');
});
test('broken D1 cross-links cause an atomic fallback instead of dead encyclopedia pages',async()=>{
 const remote=catalog('remote'),safe=catalog('safe');
 remote.maps[1].mobs=[999];
 assert.throws(()=>loader.validate(remote),/связи игрового каталога/);
 const mock=mockFetch(remote,safe);
 const res=await loader.load({api:'https://worker.example',fetcher:mock.fetcher});
 assert.equal(res.source,'local');
 assert.equal(res.data.items[1].name,'safe');
 assert.deepEqual(res.data.maps[1].mobs,[1]);
});
test('one unavailable D1 dataset switches the ENTIRE catalog to local files',async()=>{
 const mock=mockFetch(catalog('online'),catalog('local'),{fail:'souls'});
 const res=await loader.load({api:'https://worker.example',fetcher:mock.fetcher});
 assert.equal(res.source,'local');
 assert.equal(res.data.items[1].name,'local');
 assert.equal(res.data.souls[1].name,'Soul');
 assert.equal(mock.paths.filter(x=>x.startsWith('./data/os/')).length,loader.keys.length);
});
test('cross-snapshot D1 requests never mix different published releases',async()=>{
 const mock=mockFetch(catalog('new'),catalog('safe'),{
  snapshots:{souls:'snapshot-b'}
 });
 const res=await loader.load({api:'https://worker.example',fetcher:mock.fetcher});
 assert.equal(res.source,'local');
 assert.equal(res.data.items[1].name,'safe');
});
test('D1 dataset with an incomplete count falls back without partial records',async()=>{
 const current=catalog('online'); current.items={};
 const mock=mockFetch(current,catalog('safe'));
 const res=await loader.load({api:'https://worker.example',fetcher:mock.fetcher});
 assert.equal(res.source,'local');
 assert.equal(res.data.items[1].name,'safe');
});
test('the bundled real OS snapshots satisfy the same schema and catalog counts',()=>{
 const data={};
 for(const key of loader.keys)data[key]=JSON.parse(readFileSync(
  new URL('../data/os/'+key+'.json',import.meta.url),'utf8'));
 const checked=loader.validate(data);
 assert.equal(Object.keys(checked.items).length,checked.meta.counts.items);
 assert.equal(checked.instances.length,checked.meta.counts.instances);
 assert.equal(Object.keys(checked.racialPassives).length,
  checked.meta.counts.racialPassives);
 assert.equal(new Set(Object.values(checked.racialPassives)
  .flatMap(race=>race.skills)).size,18);
});
test('Cloudflare public instances endpoint returns an array and snapshot header',async()=>{
 const req=new Request('https://worker.example/api/catalog/instances.json',{
  headers:{Origin:'https://bonaqu.github.io'}
 });
 const env={DB:{prepare(sql){
  if(sql.includes('FROM catalog_current'))return{first:async()=>({
   snapshot:'published-a',published_at:1,expected_counts:'{}'
  })};
  if(sql.includes('FROM catalog_entries'))return{bind:()=>({all:async()=>({
   results:[{record_key:'3',payload:JSON.stringify({id:3,name:'Dungeon'})}]
  })})};
  throw Error('Unexpected SQL '+sql);
 }}};
 const response=await worker.fetch(req,env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('x-ps-catalog-snapshot'),'published-a');
 assert.match(response.headers.get('access-control-expose-headers'),/X-PS-Catalog-Snapshot/);
 const data=await response.json();
 assert.ok(Array.isArray(data));
 assert.equal(data[0].id,3);
});

test('validated local encyclopedia preview avoids a slow D1 request',async()=>{
 const current=catalog('D1'),archived=catalog('archived');
 const mock=mockFetch(current,archived);
 const response=await loader.load({api:'https://worker.example',
  fetcher:mock.fetcher,preferLocal:true});
 assert.equal(response.source,'local');
 assert.equal(response.data.items[1].name,'archived');
 assert.equal(mock.paths.filter(url=>url.includes('/api/catalog/')).length,0);
 assert.equal(mock.paths.length,loader.keys.length);
});

test('strict production Wiki refuses a broken D1 snapshot instead of silently loading an archive',async()=>{
 const mock=mockFetch(catalog('current'),catalog('archived'),{fail:'souls'});
 await assert.rejects(
  loader.load({api:'https://worker.example',fetcher:mock.fetcher,strict:true}),
  /souls HTTP 503/);
 assert.equal(mock.paths.filter(url=>url.startsWith('./data/os/')).length,0);
});

test('obsolete source hashes cannot rewrite D1 gameplay stats using a stale archive',async()=>{
 const remote=catalog('remote'),archive=catalog('archive');
 const oldD1={ 'monster/monster.csv':'e1fd89f70113314a',
  'monster/monster_dropitem.csv':'685de58dcd1e1758',
  'monster/spdrop_item.csv':'1ab5e9493f456a2f'};
 const oldArchive={'monster/monster.csv':'b99edf06cb49f754',
  'monster/monster_dropitem.csv':'db74bd36aa98c301',
  'monster/spdrop_item.csv':'e2b35f9dad68f0f3'};
 remote.meta.sha=oldD1;archive.meta.sha=oldArchive;
 remote.meta.counts.monsters=2;archive.meta.counts.monsters=2;
 remote.monsters['43650']={id:43650,name:'Boss',life:3000000,resists:{physical:20}};
 archive.monsters['43650']={id:43650,name:'Boss',life:5000000,resists:{physical:10}};
 const mock=mockFetch(remote,archive);
 const loaded=await loader.load({api:'https://worker.example',fetcher:mock.fetcher,strict:true});
 assert.equal(loaded.source,'d1');
 assert.equal(loaded.data.monsters['43650'].life,3000000);
 assert.equal(loaded.data.monsters['43650'].resists.physical,20);
 assert.equal(loaded.overlay,undefined);
 assert.equal(mock.paths.filter(x=>x.startsWith('./data/os/')).length,0,
  'A valid D1 snapshot must not trigger hidden monster/loot archive GETs');
});
test('the read-only Russian dungeon translation bridge remains source-matched',async()=>{
 const remote=catalog('remote'),archive=catalog('archive');
 remote.instances[0].blurb='Current English game description';
 archive.instances[0].blurb='Current English game description';
 archive.instances[0].blurbRu='Подтверждённый русский перевод';
 const first=mockFetch(remote,archive);
 const corrected=await loader.load({api:'https://worker.example',fetcher:first.fetcher});
 assert.equal(corrected.data.instances[0].blurbRu,archive.instances[0].blurbRu);
 assert.equal(corrected.data.instances[0].blurb,remote.instances[0].blurb);
 archive.instances[0].blurb='Different historic game text';
 const second=mockFetch(remote,archive);
 const unchanged=await loader.load({api:'https://worker.example',fetcher:second.fetcher});
 assert.equal(unchanged.data.instances[0].blurbRu,undefined,
  'Never borrow a translation for a different original description');
});


test('encyclopedia rejects a forged D1 provenance despite matching snapshot IDs',async()=>{
 const remote=catalog('forged'),safe=catalog('safe');
 const fake=mockFetch(remote,safe,{provenance:'archive'});
 const loaded=await loader.load({api:'https://worker.example',fetcher:fake.fetcher});
 assert.equal(loaded.source,'local');
 assert.equal(loaded.data.items['1'].name,'safe');
 const strict=mockFetch(remote,safe,{provenance:'archive'});
 await assert.rejects(loader.load({api:'https://worker.example',
  fetcher:strict.fetcher,strict:true}),/не подтвердил источник D1/);
 assert.equal(strict.paths.filter(path=>path.startsWith('./data/os/')).length,0);
});

test('NPC chest links, exchange keys and gold-only rewards are validated like regular chests',async()=>{
 const catalogGood=catalog('good');
 catalogGood.items[2]={id:2,name:'NPC Chest'};
 catalogGood.meta.counts.items=2;
 catalogGood.chests.npc=[{i:2,key:1,rolls:[[
  {i:1,n:1,p:80},{gold:[100,200],p:20}
 ]]}];
 catalogGood.chests.masterKey=1;
 assert.doesNotThrow(()=>loader.validate(catalogGood),
  'Gold reward has no item ref; source item/key links are valid');

 const missingNpcShape=structuredClone(catalogGood);
 delete missingNpcShape.chests.npc;
 assert.throws(()=>loader.validate(missingNpcShape),/Неверный формат сундуков/);

 const brokenKey=structuredClone(catalogGood);
 brokenKey.chests.npc[0].key=999;
 assert.throws(()=>loader.validate(brokenKey),/ключ сундука/);

 const brokenReward=structuredClone(catalogGood);
 brokenReward.chests.npc[0].rolls[0][0].i=999;
 assert.throws(()=>loader.validate(brokenReward),/награда сундука/);

 const brokenMaster=structuredClone(catalogGood);
 brokenMaster.chests.masterKey=999;
 assert.throws(()=>loader.validate(brokenMaster),/универсальный ключ/);

 const remote=mockFetch(brokenReward,catalogGood);
 await assert.rejects(loader.load({api:'https://worker.example',
  fetcher:remote.fetcher,strict:true}),/награда сундука/,
  'A broken D1 NPC chest must not be silently accepted as healthy');
 const fallback=mockFetch(brokenReward,catalogGood);
 const result=await loader.load({api:'https://worker.example',fetcher:fallback.fetcher});
 assert.equal(result.source,'local');
 assert.equal(result.data.chests.npc[0].rolls[0][0].i,1);
});

test('D1 rejects inverted and malformed gold intervals before displaying NPC chest',async()=>{
 const good=catalog('verified gold');
 good.items[2]={id:2,name:'NPC Chest'};good.meta.counts.items=2;
 good.chests.npc=[{i:2,key:1,rolls:[[{gold:[60000,100000],p:3}]]}];
 assert.doesNotThrow(()=>loader.validate(good));
 for(const interval of [[100000,60000],[-1,1000],['60000',100000],
  [10000],[1,2,3],[1.5,2],null]){
  const broken=structuredClone(good);broken.chests.npc[0].rolls[0][0].gold=interval;
  assert.throws(()=>loader.validate(broken),/диапазон золота сундука/,
   'Reject invalid source gold values: '+JSON.stringify(interval));
 }
 const both=structuredClone(good);both.chests.npc[0].rolls[0][0].i=1;
 assert.throws(()=>loader.validate(both),/тип награды сундука/);
 const empty=structuredClone(good);empty.chests.npc[0].rolls[0][0]={p:3};
 assert.throws(()=>loader.validate(empty),/тип награды сундука/);
 const broken=structuredClone(good);broken.chests.npc[0].rolls[0][0].gold=[99,1];
 const remote=mockFetch(broken,good);
 await assert.rejects(loader.load({api:'https://worker.example',
  fetcher:remote.fetcher,strict:true}),/диапазон золота сундука/);
 const fallback=mockFetch(broken,good);
 const restored=await loader.load({api:'https://worker.example',fetcher:fallback.fetcher});
 assert.equal(restored.source,'local');
 assert.deepEqual(restored.data.chests.npc[0].rolls[0][0].gold,[60000,100000]);
});

test('D1 rejects duplicate IDs across normal and NPC chest lists before Wiki index overwrites cards',()=>{
 const data=catalog('distinct');
 data.chests.npc=[{i:1,key:1,rolls:[[]]}];
 assert.throws(()=>loader.validate(data),/повторный сундук/);
 data.chests.npc[0].i=2;
 data.items[2]={id:2,name:'NPC Chest'};data.meta.counts.items=2;
 assert.doesNotThrow(()=>loader.validate(data));
 const doubleNpc=structuredClone(data);
 doubleNpc.chests.npc.push({...doubleNpc.chests.npc[0]});
 assert.throws(()=>loader.validate(doubleNpc),/повторный сундук/);
 const brokenGroups=structuredClone(data);
 brokenGroups.chests.npc[0].rolls=[null];
 assert.throws(()=>loader.validate(brokenGroups),/группа наград сундука/);
});
