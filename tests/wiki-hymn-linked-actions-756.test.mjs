import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const w={};
Function('window',read('pandora-os-character-calculator.js'))(w);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(w);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const inspect=(id,source=skills,caps=classes)=>
 w.PandoraWikiSkillInsights.inspect({
  skillCatalog:source,classes:caps,id,calculator:w.PandoraOSCalculator});
const sourcePaths=[
 [340001001,340001002,340001003],
 [340001004,340001005,340001006],
 [340003001,340003002,340003003],
 [340004001,340004002,340004003]
];

test('four OS learnable hymns have distinct linked area and target actions',()=>{
 for(const path of sourcePaths){
  const e=inspect(path[0]);
  assert.ok(e,'missing hymn source insight '+path[0]);
  assert.equal(e.pathKind,'hymn');
  assert.deepEqual(e.paths,[path]);
  assert.deepEqual(e.extra,[]);
  assert.equal(e.sourceOnly,true);
  assert.equal(e.finalAmount,null);
  assert.ok(e.notes[0]?.ru&&e.notes[0]?.en);
  assert.equal(skills[String(path[1])].skillType,'SPHERE');
  assert.equal(skills[String(path[2])].skillType,'ALLY');
 }
 assert.match(inspect(340001004).notes[0].ru,/Улучшенная/);
 assert.match(inspect(340004001).notes[0].ru,/стихийный урон/);
 assert.match(inspect(340004001).notes[0].ru,/перезарядки/);
});

test('no invented 4-second timing or final cooldown in read-only paths',()=>{
 assert.equal(skills['340001001'].funcs[0].fv2[3],4);
 for(const [id] of sourcePaths){
  const e=inspect(id);
  assert.doesNotMatch(e.notes[0].ru,/каждые 4 секунды/);
  assert.equal(e.paths[0].length,3);
 }
 assert.match(inspect(340004001).notes[0].ru,/Точные секунды отката не подтверждены/);
});

test('changed OS vectors, requirements and chain IDs cannot be presented as proven',()=>{
 for(const [id,change] of [
  [340001001,s=>s.funcs[0].fv2[3]=5],
  [340001004,s=>s.funcs[1].fv1[2]=0],
  [340003001,s=>s.reqs[0].amount=100],
  [340004001,s=>s.funcs[2].fv2[3]=8]
 ]){
  const bad=structuredClone(skills);change(bad[String(id)]);
  assert.notEqual(inspect(id,bad)?.pathKind,'hymn',String(id));
 }
 for(const [rootId,childId,change] of [
  [340001001,340001002,s=>s.funcs[0].fv1[3]=340001006],
  [340003001,340003003,s=>s.funcs[0].fv1[2]=100],
  [340004001,340004003,s=>s.funcs[1].dir='CASTER']
 ]){
  const bad=structuredClone(skills);change(bad[String(childId)]);
  assert.notEqual(inspect(rootId,bad)?.pathKind,'hymn');
 }
 const impossible=structuredClone(classes);
 for(const c of Object.values(impossible))if(c.branchCaps)
  for(const k of ['hymn','benevolence','blessing'])c.branchCaps[k]=0;
 assert.notEqual(inspect(340003001,skills,impossible)?.pathKind,'hymn');
});

test('other source paths and recipes remain unchanged with contextual hymn labels',()=>{
 assert.deepEqual(inspect(310023001).paths,[[310023001,310023002]]);
 assert.equal(inspect(310023001).pathKind,undefined);
 assert.deepEqual(inspect(220001001).extra,
  [{type:'requiredItem',count:1,itemId:50056}]);
 const app=read('pandora-studio-app.js');
 assert.match(app,/evidence\.pathKind==='hymn'&&index>0/);
 assert.match(app,/Область: /);
 assert.match(app,/Эффект: /);
 assert.match(app,/wikiLink\(role\+dataName\('skill'/);
});
