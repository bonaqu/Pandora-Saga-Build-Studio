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
  tables:{zoneDrops:[]},chests:{boxes:[{i:1,rolls:[[]]}]},
  skills:{1:{id:1,name:'Racial Passive',skillType:'PASSIVE',branch:'race'}},
  racialPassives:{HUMAN:{raceId:1,key:'HUMAN',skills:[1]}},
  souls:{1:{id:1,name:'Soul',icon:'I_000001_00'}}
 };
}
function mockFetch(remote,local,{broken=null,snapshots=null,fail=null}={}){
 const paths=[],snapshotFor=key=>snapshots?.[key]||'snapshot-a';
 const fetcher=async(url)=>{
  paths.push(url);
  const isRemote=url.includes('/api/catalog/'),key=url.split('/').pop().replace('.json','');
  if(isRemote&&fail===key)return{ok:false,status:503};
  const value=structuredClone((isRemote?remote:local)[key]);
  if(isRemote&&key===broken)delete value?.id;
  return {ok:true,status:200,headers:{get:name=>name==='x-ps-catalog-snapshot'?
   (isRemote?snapshotFor(key):null):null},json:async()=>value};
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
