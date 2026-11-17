import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillExecutionGraph,EXECUTION_REFERENCE_FAMILIES}
 from '../scripts/audit-os-skill-execution-graph.mjs';

const current=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const vector=(ep,target,dir='TARGET')=>({
 ep,dir,fv1:[0,0,0,target],fv2:[0,0,0,0]
});
const skill=(id,funcs=[],extra={})=>({
 id,name:'Fixture '+id,classes:{},learnable:false,funcs,...extra
});

test('all 571 current OS source records produce a deterministic, read-only chain census',()=>{
 const before=JSON.stringify(current);
 const a=auditOsSkillExecutionGraph(current),b=auditOsSkillExecutionGraph(current);
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(current),before);
 assert.equal(a.summary.skillCount,571);
 assert.equal(a.summary.referenceEdges,112);
 assert.equal(a.summary.zeroPlaceholders,2);
 assert.equal(a.summary.missingTargets,0);
 assert.equal(a.summary.invalidTargets,0);
 assert.equal(a.summary.cycleCount,0);
 assert.equal(a.summary.classlessTargets,86);
 assert.equal(a.summary.classAssignedLearnableRoots,234);
 assert.equal(a.summary.reachableFromClassAssignedRoots,299);
 assert.equal(a.summary.distinctTargets,111);
 assert.equal(a.edges.length,a.summary.referenceEdges);
 assert.ok(a.chains.some(row=>row.rootId===240005001&&
  row.paths.some(path=>JSON.stringify(path)==='[240005001,240005002,240005003]')));
 assert.equal(new Set(EXECUTION_REFERENCE_FAMILIES).size,7);
 assert.match(a.certainty,/NOT proof/);
});

test('distinct parent references and paths preserve source evidence, never calculate damage',()=>{
 const input={
  1:skill(1,[vector('EP_SKILL_EXEC',2),vector('EP_SKILL_EXEC_COUNT',2),
   vector('EP_FUTURE_DAMAGE',999)],{learnable:true,classes:{WARRIOR:1}}),
  2:skill(2,[vector('EP_ONHIT_SKILL_EXEC',3)]),
  3:skill(3),
  4:skill(4,[vector('EP_SKILL_EXEC',2)],{learnable:true,classes:{MAGE:1}})
 };
 const output=auditOsSkillExecutionGraph(input);
 assert.equal(output.summary.referenceEdges,4);
 assert.equal(output.summary.missingTargets,0,'unrecognized EP is not a declared source execution link');
 assert.equal(output.summary.classlessTargets,2);
 assert.equal(output.summary.multiParentTargets,1);
 assert.deepEqual(output.multiParentTargets,[{id:2,parentIds:[1,4]}]);
 assert.equal(output.summary.chainRoots,2);
 assert.ok(output.chains.find(row=>row.rootId===1).paths.some(path=>
  path.join(',')==='1,2,3'));
 assert.deepEqual(output.roots,[1,4]);
 assert.ok(output.edges.every(e=>e.fv1.length===4&&e.fv2.length===4));
 assert.equal(JSON.stringify(input[1].funcs[0].fv1),'[0,0,0,2]');
});

test('historic zero placeholders, unknown links and malformed positive references stay distinct',()=>{
 const input={
  1:skill(1,[
   vector('EP_SKILL_EXEC',0),
   vector('EP_SKILL_EXEC',2),
   vector('EP_SKILL_EXEC',999),
   vector('EP_SKILL_EXEC',2.5)
  ],{learnable:true,classes:{WARRIOR:1}}),
  2:skill(2)
 };
 const output=auditOsSkillExecutionGraph(input);
 assert.equal(output.summary.referenceEdges,1);
 assert.equal(output.summary.zeroPlaceholders,1);
 assert.equal(output.summary.missingTargets,1);
 assert.equal(output.summary.invalidTargets,1);
 assert.equal(output.missingTargets[0].to,999);
 assert.equal(output.invalidTargets[0].to,2.5);
 assert.equal(output.zeroTargets[0].to,0);
 assert.equal(output.summary.cycleCount,0);
});

test('self-loops and two-hop source cycles are observable instead of endless traversal',()=>{
 const input={
  1:skill(1,[vector('EP_SKILL_EXEC',2)],{learnable:true,classes:{WARRIOR:1}}),
  2:skill(2,[vector('EP_SKILL_EXEC',1)]),
  3:skill(3,[vector('EP_SKILL_EXEC',3)])
 };
 const output=auditOsSkillExecutionGraph(input);
 assert.equal(output.summary.cycleCount,2);
 assert.ok(output.cycles.some(path=>path.join(',')==='1,2,1'));
 assert.ok(output.cycles.some(path=>path.join(',')==='3,3'));
 assert.ok(output.chains[0].paths.some(path=>path.join(',')==='1,2,1'));
});

test('valid-but-source-only references cannot turn unknown duration or percent into measured effects',()=>{
 const input={
  1:skill(1,[{ep:'EP_SKILL_EXEC_COUNT',dir:'TARGET',
   fv1:[0,0,0,2],fv2:[0,0,0,4]}],{learnable:true,classes:{BARD:1}}),
  2:skill(2,[{ep:'EP_ELEMENT_DAMAGE',dir:'TARGET',
   fv1:[680,0,350,155],fv2:[0,0,0,0]}])
 };
 const report=auditOsSkillExecutionGraph(input);
 assert.equal(report.summary.referenceEdges,1);
 assert.equal(report.edges[0].fv2[3],4);
 assert.equal(report.edges[0].ep,'EP_SKILL_EXEC_COUNT');
 assert.equal(report.edges[0].targetLearnable,false);
 assert.ok(report.certainty.includes('chance'));
 assert.equal('finalDamage' in report,false);
});

test('invalid skill identity or effect vectors fail closed without mutating the caller',()=>{
 const input={1:skill(1)};
 const before=JSON.stringify(input);
 assert.throws(()=>auditOsSkillExecutionGraph({1:{...input[1],id:2}}),
  /Malformed source skill/);
 assert.throws(()=>auditOsSkillExecutionGraph({1:skill(1,[
  {ep:'EP_SKILL_EXEC',fv1:[0,0,2],fv2:[0,0,0,0]}])}),
  /Malformed source effect/);
 assert.throws(()=>auditOsSkillExecutionGraph([]),/Expected current OS skill map/);
 assert.equal(JSON.stringify(input),before);
});
