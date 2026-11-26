import test from 'node:test';
import assert from 'node:assert/strict';
import {
 OFFICIAL_FILES,OFFICIAL_GAME_URL,compareOfficialSource,
 inspectOfficialSources,sourceParityMarkdown
} from '../scripts/audit-os-official-source-parity.mjs';

const resp=(payload,{status=200,type='application/json'}={})=>({
 status,ok:status===200,
 headers:{get:name=>name==='content-type'?type:null},
 text:async()=>JSON.stringify(payload)
});

test('17 official fixed game-data endpoints match Worker allowlist, with no arbitrary URLs',()=>{
 assert.deepEqual(OFFICIAL_FILES,[
  'meta','classes','skills','items','souls','monsters','drops','maps',
  'instances','racialPassives','itemForth','unison','trades',
  'tables','expertise','chests','strings.en'
 ]);
 assert.equal(OFFICIAL_GAME_URL,'https://pandorasaga-os.com/gamedata/');
 assert.throws(()=>compareOfficialSource({},{},"../../../account"),/Not an allowlisted/);
});

test('semantic source diff ignores JSON object-key order but retains original values',()=>{
 const local={
  1:{id:1,name:'Красный меч',desc:'Эффект <b>один</b>',damage:10,
   funcs:[{ep:'EP_ONHIT',fv1:[0,0,0,17]}]},
  2:{id:2,desc:'старый',soulslot:2}
 };
 const official={
  2:{soulslot:2,desc:'новый',id:2},
  1:{funcs:[{fv1:[0,0,0,17],ep:'EP_ONHIT'}],
   damage:10,desc:'Эффект один',name:'Красный меч',id:1}
 };
 const r=compareOfficialSource(local,official,'items');
 assert.equal(r.changedCount,2);
 assert.equal(r.descriptionOnly,2);
 assert.equal(r.descriptionFormatting,1);
 assert.equal(r.otherData,0);
 assert.deepEqual(r.fieldCounts,{desc:2});
 assert.equal(r.examples.changed[0].kind,'description-only');
 assert.equal(compareOfficialSource({1:{a:1,b:2}},{1:{b:2,a:1}},'skills').equal,true);
 assert.equal(r.localSha256.length,64);
 assert.notEqual(r.localSha256,r.officialSha256);
});

test('missing/additional source IDs and mechanical changes must be distinguished',()=>{
 const a={1:{id:1,damage:5,desc:'same'},2:{id:2,damage:10}};
 const b={1:{id:1,damage:6,desc:'same'},3:{id:3,damage:10}};
 const r=compareOfficialSource(a,b,'items');
 assert.equal(r.missingCount,1);
 assert.equal(r.addedCount,1);
 assert.equal(r.otherData,1);
 assert.equal(r.descriptionOnly,0);
 assert.deepEqual(r.examples.changed.map(x=>x.fields),[['damage']]);
 assert.equal(r.equal,false);
});

test('official instances are indexed by stable source ID, not array order',()=>{
 const local=[{id:7,name:'A'},{id:8,name:'B'}];
 const changed=[{id:8,name:'B'},{id:7,name:'A'}];
 const r=compareOfficialSource(local,changed,'instances');
 assert.equal(r.equal,true);
 assert.throws(()=>compareOfficialSource(local,[{id:7},{id:7}],'instances'),
  /Duplicate instance IDs/);
});

test('bounded read-only inspection never sends credentials, writes, or arbitrary query URLs',async()=>{
 const names=['skills','items','souls'];
 const fixture={skills:{1:{id:1,v:7}},
  items:{2:{id:2,desc:'old'}},souls:{3:{id:3,desc:'one'}}};
 const remote={...fixture,items:{2:{id:2,desc:'new'}}};
 const seen=[];
 const report=await inspectOfficialSources({names,timeoutMs:1000,concurrency:2,
  readLocal:path=>JSON.stringify(fixture[path]),
  fetcher:async(url,opts)=>{
   seen.push([url,opts]);
   assert.equal(opts.method,'GET');
   assert.equal(opts.redirect,'manual');
   assert.deepEqual(opts.headers,{Accept:'application/json'});
   assert.ok(!opts.headers.Authorization&&!opts.body);
   return resp(remote[url.split('/').pop().replace('.json','')]);
  }
 });
 assert.equal(report.summary.available,3);
 assert.equal(report.summary.identical,2);
 assert.equal(report.summary.changed,1);
 assert.equal(report.summary.descriptionOnly,1);
 assert.ok(seen.every(([url])=>url.startsWith(OFFICIAL_GAME_URL)&&!url.includes('?')));
 assert.match(sourceParityMarkdown(report),/TEXT DRIFT/);
 assert.match(report.sourceMeaning,/not proof of server-side/);
 await assert.rejects(inspectOfficialSources({names:['../admin']}),
  /Invalid bounded/);
});

test('HTTP and malformed server JSON are reported as unavailable, not false parity',async()=>{
 const report=await inspectOfficialSources({
  names:['skills','items'],readLocal:()=>JSON.stringify({1:{id:1}}),
  fetcher:async url=>url.endsWith('skills.json')?resp(null,{status:503}):
   {...resp(null),text:async()=>'{not-json'}
 });
 assert.equal(report.summary.unavailable,2);
 assert.ok(report.datasets.every(x=>!x.available));
 assert.match(sourceParityMarkdown(report),/UNAVAILABLE/);
});
