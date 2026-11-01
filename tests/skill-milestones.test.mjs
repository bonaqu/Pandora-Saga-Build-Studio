import{test}from'node:test';
import assert from'node:assert/strict';
import vm from'node:vm';
import fs from'node:fs';
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../skill-milestones.js',import.meta.url),'utf8'),ctx);
const f=ctx.window.PandoraSkillMilestones.forBranch;
test('multiple skills at one branch threshold group together',()=>{
 const r=f([{id:1,reqs:[{branch:'slash',amount:8}]},{id:2,reqs:[{branch:'slash',amount:8}]}],'slash',90);
 assert.equal(r.milestones.length,1);assert.equal(r.milestones[0].skills.length,2);
});
test('over-cap requirements remain identified, not shown as available',()=>{
 const r=f([{id:3,reqs:[{branch:'brush',amount:41}]}],'brush',15);
 assert.equal(r.milestones.length,0);assert.equal(r.above.length,1);
});
test('foreign branch prerequisites do not create false links',()=>{
 const r=f([{id:4,reqs:[{branch:'defense',amount:20}]}],'slash',90);
 assert.equal(r.milestones.length,0);
});
test('malformed thresholds do not create false zero/one/blank unlock markers',()=>{
 const inputs=[null,{branch:'slash',amount:null},{branch:'slash',amount:''},
  {branch:'slash',amount:0},{branch:'slash',amount:'0'},
  {branch:'slash',amount:false},{branch:'slash',amount:true},
  {branch:'slash',amount:-2},{branch:'slash',amount:2.5},
  {branch:'slash',amount:[8]},{branch:'slash',amount:{value:8}},
  {branch:'',amount:8}];
 const invalid=inputs.filter(Boolean).map((req,i)=>({id:i+1,reqs:[req]}));
 const r=f([...invalid,{id:44,reqs:[null]}],'slash',90);
 assert.equal(r.milestones.length,0);
 assert.equal(r.above.length,0);
});

test('valid numeric-string threshold remains supported, malformed cap cannot grant unlock',()=>{
 const rows=[{id:12,reqs:[{branch:'slash',amount:'8'}]},
  {id:13,reqs:[{branch:'slash',amount:41}]}];
 const normal=f(rows,'slash',15);
 assert.equal(normal.milestones.length,1);
 assert.equal(normal.milestones[0].threshold,8);
 assert.equal(normal.above.length,1);
 const invalidCap=f(rows,'slash','not-a-class-cap');
 assert.equal(invalidCap.milestones.length,0);
 assert.deepEqual(Array.from(invalidCap.above.map(x=>x.threshold)),[8,41]);
});

test('null records and missing skill IDs cannot leak into the unlock list',()=>{
 const r=f([null,{reqs:[{branch:'slash',amount:8}]},
  {id:99,reqs:[{branch:'slash',amount:8}]}],'slash',90);
 assert.equal(r.milestones.length,1);
 assert.equal(r.milestones[0].skills.length,1);
 assert.equal(r.milestones[0].skills[0].id,99);
});
