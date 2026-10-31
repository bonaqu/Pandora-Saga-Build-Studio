import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const begin=app.indexOf('function isVerifiedSharedBuild(');
const end=app.indexOf('async function createShared(',begin);
assert.ok(begin>=0&&end>begin,'share verification must exist');
const verify=Function(app.slice(begin,end)+'\nreturn isVerifiedSharedBuild;')();

const sample={race:2,job:13,level:55,
 points:{slash:90,defend:25},equipment:[{id:1234}],souls:{0:[{id:101001}]},
 masteryAuto:false,mastery:{slash:48},name:'55 build'};

test('readback matches the exact published build, including future equipment and mastery',()=>{
 const wire=JSON.parse(JSON.stringify(sample));
 assert.equal(verify({schema:1,type:'build',data:wire},sample),true);
});

test('a different level, soul, weapon or trained mastery must fail share verification',()=>{
 for(const other of [
  {...sample,level:45},
  {...sample,equipment:[{id:9999}]},
  {...sample,souls:{0:[{id:101002}]}},
  {...sample,mastery:{slash:47}}
 ]){
  assert.equal(verify({schema:1,type:'build',data:other},sample),false);
 }
});

test('malformed, obsolete, or unavailable share readback never advertises a valid URL',()=>{
 assert.equal(verify(null,sample),false);
 assert.equal(verify({schema:2,type:'build',data:sample},sample),false);
 assert.equal(verify({schema:1,type:'library',data:sample},sample),false);
 assert.equal(verify({schema:1,type:'build',data:null},sample),false);
 assert.equal(verify({schema:1,type:'build',data:[]},sample),false);
 const cyclic={};cyclic.self=cyclic;
 assert.equal(verify({schema:1,type:'build',data:cyclic},sample),false);
});
