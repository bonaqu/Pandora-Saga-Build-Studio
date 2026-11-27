import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsClassLevelSkillMatrix} from
 '../scripts/audit-os-class-level-skill-matrix-476.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);

test('current OS Skill Effects: 28 jobs × 55 levels remain read-only and model-safe',()=>{
 const originalSkills=JSON.stringify(skills);
 const originalClasses=JSON.stringify(classes);
 const report=auditOsClassLevelSkillMatrix({
  skills,classes,calculator:host.PandoraOSCalculator
 });
 assert.equal(report.parameters.classes,28);
 assert.equal(report.totals.scenarios,1540);
 assert.equal(report.byClass.length,28);
 assert.equal(report.totals.errors,0,JSON.stringify(report.problems));
 assert.deepEqual(report.problems,[]);
 assert.ok(report.totals.sourceIdsInspected>0);
 assert.ok(report.totals.rows>0);
 assert.ok(report.totals.modeledRows>0);
 assert.ok(report.totals.numericRows>0);
 assert.equal(report.byClass.reduce((sum,row)=>sum+row.rows,0),
  report.totals.rows);
 assert.equal(report.byClass.reduce((sum,row)=>sum+row.modeledRows,0),
  report.totals.modeledRows);
 assert.deepEqual(report.parameters.weapons,
  ['BARE_HAND','1H_SWORD','BOW','CROSSBOW']);
 assert.match(report.certainty,/!= live server formula/);
 assert.equal(JSON.stringify(skills),originalSkills);
 assert.equal(JSON.stringify(classes),originalClasses);
});

test('matrix rejects invalid catalogs and unsupported level ranges',()=>{
 const basic={skills:{1:{id:1,learnable:true,classes:{WIZARD:1}}},
  classes:{WIZARD:{branchCaps:{element:55}}}};
 const preview=()=>({verified:false,offense:[],defense:[],movement:[],utility:[]});
 assert.throws(()=>auditOsClassLevelSkillMatrix({...basic,maxLevel:56,
  calculator:{scalingSkillPreview:preview}}),/levels 1\.\.55/);
 assert.throws(()=>auditOsClassLevelSkillMatrix({...basic,
  classes:{WIZARD:{branchCaps:{element:-1}}},
  calculator:{scalingSkillPreview:preview}}),/Invalid source mastery caps/);
 assert.throws(()=>auditOsClassLevelSkillMatrix({
  ...basic,classes:{},calculator:{scalingSkillPreview:preview}}),/Empty source/);
});

test('matrix fails closed for unverified outputs mislabeled as server verified',()=>{
 const basic={skills:{1:{id:1,learnable:true,classes:{WIZARD:1}}},
  classes:{WIZARD:{branchCaps:{element:55}}}};
 const falseVerified=()=>({verified:true,offense:[],defense:[],
  movement:[],utility:[]});
 const wrong=auditOsClassLevelSkillMatrix({...basic,maxLevel:3,
  calculator:{scalingSkillPreview:falseVerified}});
 assert.equal(wrong.totals.scenarios,3);
 assert.equal(wrong.totals.errors,3);
 assert.match(wrong.problems[0].reason,/verified:true/);
 const unsafe=()=>({verified:false,offense:[{
  id:1,available:true,recipient:false,amount:20,modelOnly:true,
  uncertain:false,coefficientModels:[{confidence:'server-verified',amount:20}]
 }],defense:[],movement:[],utility:[]});
 const forbidden=auditOsClassLevelSkillMatrix({...basic,maxLevel:1,
  calculator:{scalingSkillPreview:unsafe}});
 assert.equal(forbidden.totals.errors,2);
 assert.match(forbidden.problems.map(x=>x.reason).join(' '),
  /Unverified coefficient displayed as certain/);
 assert.match(forbidden.problems.map(x=>x.reason).join(' '),
  /Non-model or invalid coefficient/);
 const sourceOnly=()=>({verified:false,offense:[{
  id:1,available:true,recipient:false,amount:null,
  modelOnly:false,uncertain:true
 }],defense:[],movement:[],utility:[]});
 const accepted=auditOsClassLevelSkillMatrix({...basic,maxLevel:1,
  calculator:{scalingSkillPreview:sourceOnly}});
 assert.equal(accepted.totals.errors,0,
  'A source-only preview is not obligated to invent a coefficient model');
});
