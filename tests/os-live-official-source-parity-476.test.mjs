import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 reconcileOfficialGamedata,fetchOfficialGamedata,auditOfficialOsSnapshot,
 OFFICIAL_GAMEDATA_SETS,OFFICIAL_SOURCE_HOSTS
} from '../scripts/audit-official-os-source.mjs';

test('strict OS fields and units; local formatting and translations never override them',()=>{
 const api={1:{id:1,W:90,desc:'Меч.ПРВ +1.',effects:[{func:'EP_ATTACK_CONST',a:9}]}};
 const local=structuredClone(api);
 local[1].desc='Меч.<br><br>ПРВ +1.';
 const old=JSON.stringify(local),live=JSON.stringify(api);
 const row=reconcileOfficialGamedata('items',api,local);
 assert.equal(row.ok,true);
 assert.equal(row.localExtras.formattedDescriptions,1);
 assert.equal(JSON.stringify(api),live);
 assert.equal(JSON.stringify(local),old);
 const drift=structuredClone(local);
 drift[1].W=91;
 const diff=reconcileOfficialGamedata('items',api,drift);
 assert.equal(diff.ok,false);
 assert.deepEqual(diff.differences.map(x=>x.path),['1.W']);
 const effect=structuredClone(local);
 effect[1].effects[0].a=10;
 assert.equal(reconcileOfficialGamedata('items',api,effect).ok,false);
 const extra=structuredClone(local);
 extra[1].desc='Меч.<br>Неофициальная атака +15.';
 assert.equal(reconcileOfficialGamedata('items',api,extra).ok,false);
});

test('souls, instances and source-file fingerprints have explicit narrowly-scoped exceptions',()=>{
 const soul={101004:{id:101004,desc:'Атака +15.',effects:[{func:'EP_ATTACK_CONST',a:15}]}};
 assert.equal(reconcileOfficialGamedata('souls',soul,{
  101004:{...soul[101004],desc:'Атака +15.<br>'}
 }).ok,true);
 const inst=[{id:1,name:'Instance',level:50}];
 const local=[{...inst[0],blurbRu:'Русский перевод'}];
 assert.equal(reconcileOfficialGamedata('instances',inst,local).ok,true);
 local[0].level=51;
 assert.equal(reconcileOfficialGamedata('instances',inst,local).ok,false);
 const meta={schemaVersion:1,sha:{'skill/skill.csv':'1234567890abcdef'},counts:{skills:571}};
 const ours={schemaVersion:1,counts:{skills:571},curated:{ru:true}};
 const checked=reconcileOfficialGamedata('meta',meta,ours);
 assert.equal(checked.ok,true);
 assert.equal(checked.localExtras.upstreamFileFingerprints,1);
 assert.equal(checked.localExtras.localCuratedMetadata,true);
 assert.equal(reconcileOfficialGamedata('meta',{
  ...meta,counts:{skills:572}
 },ours).ok,false);
 assert.throws(()=>reconcileOfficialGamedata('meta',{counts:{skills:571}},ours),
  /missing file fingerprints/);
});

test('current checked-in meta curated:true is valid and source drift remains strict',()=>{
 const local=JSON.parse(readFileSync(new URL('../data/os/meta.json',import.meta.url),'utf8'));
 assert.equal(local.curated,true,'production catalog uses a boolean provenance flag');
 const official=structuredClone(local);
 delete official.curated;
 official.sha={'skill/skill.csv':'5470e489b52a24aa'};
 const report=reconcileOfficialGamedata('meta',official,local);
 assert.equal(report.ok,true);
 assert.equal(report.localExtras.localCuratedMetadata,true);
 assert.equal(report.localExtras.upstreamFileFingerprints,1);
 const changed=structuredClone(local);
 changed.counts.skills++;
 const drift=reconcileOfficialGamedata('meta',official,changed);
 assert.equal(drift.ok,false);
 assert.deepEqual(drift.differences.map(x=>x.path),['counts.skills']);
 for(const wrong of [false,null,0,'true',[]]){
  const broken=structuredClone(local);
  broken.curated=wrong;
  assert.throws(()=>reconcileOfficialGamedata('meta',official,broken),
   /Invalid local curated metadata/);
 }
});

test('official game files: allowlisted HTTPS GET, no redirects and bounded immutable report',async()=>{
 const source={1:{id:1,name:'Test'}};
 const calls=[];
 const reply={ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify(source)};
 const fetched=await fetchOfficialGamedata('skills',{
  fetchImpl:async(url,params)=>{calls.push({url,params});return reply}
 });
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,OFFICIAL_SOURCE_HOSTS[0]+'/gamedata/skills.json');
 assert.equal(calls[0].params.method,'GET');
 assert.equal(calls[0].params.redirect,'manual');
 assert.deepEqual(fetched.data,source);
 assert.match(fetched.sha256,/^[a-f0-9]{64}$/);
 assert.throws(()=>reconcileOfficialGamedata('unknown',{},{}),/Unknown official dataset/);
 await assert.rejects(fetchOfficialGamedata('https://evil.invalid/something'),
  /Unknown official dataset/);
 assert.equal(OFFICIAL_GAMEDATA_SETS.length,17);
});

test('17 datasets classify an unreachable upstream separately from a confirmed data drift',async()=>{
 const wanted=['skills','classes','items'];
 const sources={skills:{1:{id:1}},classes:{W:{id:'W'}},items:{2:{id:2,W:15}}};
 const current={skills:{1:{id:1}},classes:{W:{id:'W'}},items:{2:{id:2,W:16}}};
 const report=await auditOfficialOsSnapshot({
  names:wanted,
  readLocal:async name=>current[name],
  fetchSource:async name=>({url:'https://pandorasaga-os.com/gamedata/'+name+'.json',
   sha256:'a'.repeat(64),data:sources[name]}),
  concurrency:2
 });
 assert.deepEqual(report.summary,{requested:3,matched:2,different:1,unavailable:0});
 assert.deepEqual(report.datasets.map(x=>x.name),wanted);
 assert.equal(report.datasets[2].differences[0].path,'2.W');
 const failed=await auditOfficialOsSnapshot({
  names:['skills'],readLocal:async()=>({}),
  fetchSource:async()=>{const e=new Error('both hosts timed out');e.reasons=[{}];throw e}
 });
 assert.deepEqual(failed.summary,{requested:1,matched:0,different:0,unavailable:1});
 assert.match(report.certainty,/NOT automatically/);
});
