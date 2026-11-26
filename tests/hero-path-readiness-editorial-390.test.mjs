import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=read('pandora-studio-hero-path.js');
const rowsMatch=source.match(
 /const heroSkillReadinessCopyRows=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(rowsMatch,'The original bilingual source copy registry must be present');
const rows=Function('return '+rowsMatch[1])();
const root={};
Function('window',read('pandora-studio-skill-progression.js'))(root);
Function('window','document',source)(root,{});
const readiness=root.PandoraHeroPath.readiness;
const skill=(id,extra={})=>({
 id,name:'Source skill '+id,classes:{CLERIC:1},charLevel:1,reqs:[],
 ...extra
});
const fixture=(skills,lang='ru')=>({
 lang,job:'CLERIC',state:{
  level:1,points:{brush:0},mastery:{brush:0},masteryAuto:false
 },skillCatalog:skills,branchName:key=>'Source branch '+key,
 cap:()=>0,innate:{},branchCaps:{brush:0}
});
const combined=(gate,lang)=>gate.problemParts.map(parts=>
 parts.map(part=>part.key?(lang==='en'?part.en:part.ru):part.text).join(''));

test('#390 exact 16 blocked-skill RU/EN phrases use source-backed versioned D1 defaults',()=>{
 const manifest=buildEditorialDefaultsManifest(),keys=new Set();
 assert.equal(rows.length,16);
 assert.equal(manifest.stats.cohorts['hero-path-readiness'],32);
 for(const [key,ru,en] of rows){
  assert.match(key,/^skillGate[A-Z]/);
  assert.equal(keys.has(key),false,'Duplicate semantic identity: '+key);
  keys.add(key);
  assert.equal(ru,ru.trim(),key+' RU whitespace');
  assert.equal(en,en.trim(),key+' EN whitespace');
  const id='guideedit.book.path.'+
   key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
  const records=manifest.records.filter(x=>x.recordKey===id);
  assert.deepEqual(records.map(x=>x.field).sort(),['en','ru']);
  assert.equal(records.find(x=>x.field==='ru').value,ru);
  assert.equal(records.find(x=>x.field==='en').value,en);
  assert.doesNotMatch(id,/source-skill|skill-name|branch-name|source-branch|points|level-\d/);
 }
 assert.match(source,/heroSkillReadinessCopyByKey=new Map/);
 assert.match(source,/for\(const \[i,parts\] of gate\.problemParts\.entries\(\)\)/);
 assert.match(source,/authored\(api,part\.key,part\.ru,part\.en,'span','path-skill-reason-copy'\)/);
 assert.match(source,/class:'path-skill-reason-source',text:part\.text/);
 assert.doesNotMatch(source,/class:'path-skill-no',text:'🔒 '\+gate\.problems\.join/);
});

test('#390 game level, source branch and original class capacity are never author text',()=>{
 for(const lang of ['ru','en']){
  const s=skill(22,{charLevel:20,reqs:[{branch:'brush',amount:8}],
   learnable:false});
  const gate=readiness(s,fixture([s],lang));
  assert.equal(gate.learned,false);
  assert.deepEqual(combined(gate,lang),gate.problems,
   'Presentation pieces must preserve the public readiness text');
  assert.ok(gate.problemParts.some(parts=>parts.some(p=>
   p.key==='skillGateRequiredLevel')&&parts.some(p=>p.text==='20')));
  assert.ok(gate.problemParts.some(parts=>parts.some(p=>
   p.key==='skillGateClassUnavailable')&&parts.some(p=>p.text==='Source branch brush')));
  assert.ok(gate.problemParts.some(parts=>parts.some(p=>
   p.key==='skillGateAllocated')&&parts.some(p=>p.text==='0')&&
   parts.some(p=>p.text==='8')));
  assert.equal(gate.problemParts.some(parts=>parts.some(p=>p.key&&
   String(p.ru||'').includes('Source branch'))),false);
  if(lang==='ru'){
   assert.ok(gate.problems.includes('Требуется уровень 20'));
   assert.ok(gate.problems.includes('Source branch brush: вложено 0/8'));
  }else{
   assert.ok(gate.problems.includes('Requires level 20'));
   assert.ok(gate.problems.includes('Source branch brush : allocated 0/8'));
  }
 }
});

test('#390 cyclic, malformed and prerequisite names remain unchanged game logic',()=>{
 const prior=skill(40,{charLevel:20,name:'CANONICAL CLASS SKILL'});
 const follow=skill(41,{prereq:40,reqs:[{branch:'brush',amount:null}]});
 const api=fixture([prior,follow],'ru');
 const gate=readiness(follow,api);
 assert.equal(gate.learned,false);
 assert.deepEqual(gate.problems,combined(gate,'ru'));
 assert.ok(gate.problems.includes('Неизвестное условие'));
 assert.ok(gate.problems.some(v=>v.includes('Требуется предыдущее умение «CANONICAL CLASS SKILL»')));
 const prerequisite=gate.problemParts.find(parts=>
  parts.some(p=>p.key==='skillGatePreviousRequired'));
 assert.ok(prerequisite);
 assert.equal(prerequisite.find(p=>p.text==='CANONICAL CLASS SKILL')?.text,
  'CANONICAL CLASS SKILL');
 assert.equal(prerequisite.some(p=>p.key&&
  String(p.ru||'').includes('CANONICAL CLASS SKILL')),false);
 const loop=readiness(prior,api,new Set(['40']));
 assert.equal(loop.learned,false);
 assert.deepEqual(loop.problems,['Циклическая зависимость навыков']);
 assert.deepEqual(combined(loop,'ru'),loop.problems);
 const valid=skill(42,{charLevel:1});
 assert.equal(readiness(valid,fixture([valid])).learned,true);
 assert.deepEqual(readiness(valid,fixture([valid])).problemParts,[]);
});

test('#390 count of readability segments matches all original reason branches',()=>{
 const expected=[
  'skillGateCycle','skillGateWrongClass','skillGateUnknownLevel',
  'skillGateRequiredLevel','skillGateBadRequirements','skillGateUnknownRequirement',
  'skillGateClassMaximum','skillGateTrained','skillGateClassUnavailable',
  'skillGateAllocated','skillGatePreviousMissing','skillGatePreviousRequired',
  'skillGateLearningMethod','skillGateUnknownMethod',
  'skillGateUnknownAdditional','skillGateAdditionalRequirement'
 ];
 assert.deepEqual(rows.map(x=>x[0]),expected);
 for(const key of expected){
  assert.ok(source.includes("reason('"+key+"')"),
   'A staged fallback key must be used in an actual rendered readiness branch');
 }
});
