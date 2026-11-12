import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const report=()=>auditOsSkillFormulaCoverage({
 skills,classes,calculator:host.PandoraOSCalculator});
test('deterministic coverage census processes all skill records and effect families',()=>{
 const output=report();
 assert.equal(output.summary.skillRecords,569);
 assert.equal(output.summary.effectRecords,1070);
 assert.equal(output.summary.uniqueEffectTypes,283);
 assert.equal(output.summary.inspectedClasses,28);
 assert.equal(output.rows.length,569);
 assert.equal(new Set(output.rows.map(row=>row.id)).size,569);
 assert.equal(Object.values(output.summary.statuses).reduce((a,b)=>a+b,0),569);
 assert.ok(output.summary.statuses['coefficient-model']>0);
 assert.ok(output.summary.statuses['unmodeled-learnable']>0);
});
test('every record has a meaningful status and source effect identities',()=>{
 const rows=report().rows;
 assert.ok(rows.every(row=>typeof row.status==='string'&&row.status.length>0));
 for(const row of rows){
  assert.ok(Number.isSafeInteger(row.id)&&row.id>0);
  assert.ok(Array.isArray(row.sourceEffects));
  assert.ok(row.sourceEffects.every(name=>name.startsWith('EP_')));
 }
 const find=id=>rows.find(row=>row.id===id);
 assert.equal(find(100058001).coefficientModel,true);
 assert.equal(find(410001001).coefficientModel,true);
 assert.equal(find(110101002).coefficientModel,true);
 assert.equal(find(410011001).coefficientModel,false,
  'A nonzero secondary spell coefficient must remain outside the generic model');
});
test('the coverage tool is read-only and does not claim live server accuracy',()=>{
 const beforeSkills=JSON.stringify(skills),beforeClasses=JSON.stringify(classes);
 const first=report(),second=report();
 assert.deepEqual(first,second);
 assert.equal(JSON.stringify(skills),beforeSkills);
 assert.equal(JSON.stringify(classes),beforeClasses);
 assert.match(first.certainty,/NOT server parity/);
 assert.match(first.methodology,/not legal full character builds/);
});
test('invalid source ID is rejected instead of being silently marked verified',()=>{
 const broken={...skills,'410001001':{...skills['410001001'],id:9}};
 assert.throws(()=>auditOsSkillFormulaCoverage({
  skills:broken,classes,calculator:host.PandoraOSCalculator}),
  /Malformed source skill identity/);
});
