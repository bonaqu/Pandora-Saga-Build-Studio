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