import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const view=(job,catalog=skills,masteries=null)=>
 C.skillExecutionChains({skillCatalog:catalog,jobKey:job,level:55,
  branchCaps:classes[job].branchCaps,
  branchMasteries:masteries||classes[job].branchCaps,
  branchLabels:meta.branchLabels,englishBranches:en.branches});
const row=(rows,id)=>rows.find(x=>x.id===id);
test('source OS child IDs are not final combat numbers',()=>{
 const a=view('CLERIC');assert.deepEqual(a,view('CLERIC'));
 assert.equal(a.verified,false);
 const purify=row(a.rows,310014001);
 assert.deepEqual(purify.paths,[[310014001,310014002]]);
 assert.equal(purify.requirementsMet,true);
 assert.equal(skills[purify.id].name,'Полное исцеление');
 assert.equal(en.skills[purify.id].n,'Purify');
 const storm=row(view('WARLOCK').rows,410002001);
 assert.deepEqual(storm.paths,[[410002001,500000005]]);
 assert.equal(storm.sourceOnly,true);
});
test('branches and multiple nested stages are preserved',()=>{
 assert.deepEqual(row(view('CALAMITY').rows,440003001).paths,[
  [440003001,440003002],[440003001,440003003]]);
 const dark=row(view('CALAMITY').rows,430058001);
 assert.deepEqual(dark.paths,[
  [430058001,430058002,430058003,500000004],
  [430058001,430058002,430058003,500000003]]);
 assert.equal(dark.linkCount,4);
 assert.deepEqual(row(view('AGENT').rows,240005001).paths,
  [[240005001,240005002,240005003]]);
});
test('profession cap and trained branch values remain separate',()=>{
 assert.equal(row(view('WARRIOR').rows,310014001),undefined);
 const purify=row(view('CLERIC',skills,{benevolence:70}).rows,310014001);
 assert.equal(purify.requirementsMet,false);
 assert.match(purify.reasonRu,/71/);
 assert.match(purify.reasonEn,/71/);
});
test('source corruption, cycle and missing child reject the whole tree',()=>{
 const mutate=[
  s=>{s[440003001].funcs[0].fv1[3]=123456789;},
  s=>{s[440003002].funcs.push({
   ep:'EP_SKILL_EXEC',dir:'TARGET',fv1:[0,0,0,440003001],fv2:[0,0,0,0]});},
  s=>{s[440003001].funcs[1].fv2[3]=3;},
  s=>{s[440003001].funcs[0].dir='CASTER';},
  s=>{s[440003001].funcs[0].fv1[0]=10;}
 ];
 for(const change of mutate){
  const copy=structuredClone(skills);change(copy);
  const result=view('CALAMITY',copy);
  assert.equal(row(result.rows,440003001),undefined);
  assert.ok(result.rejected.includes(440003001));
 }
});
test('linked skill audit tracks only verified crafting numeric sources',()=>{
 const audit=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(audit.summary.skillRecords,569);
 assert.equal(audit.summary.executionChains.sourceLinks,100);
 assert.equal(audit.summary.executionChains.zeroTargetSentinels,2);
 assert.ok(audit.summary.executionChains.eligibleSkillRoots>0);
 assert.equal(audit.summary.statuses['unmodeled-learnable'],87);
});
test('Hero Book uses player language and explanatory collapsed group',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-skill-chain-effects/);
 assert.match(book,/skillExecutionChains\?\.\(/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(id\)\]\?\.n\|\|ru/);
 assert.match(book,/Это не гарантированный урон/);
});
