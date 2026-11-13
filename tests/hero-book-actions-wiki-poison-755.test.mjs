import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-book-skill-thresholds.js'))(root);
Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(root);
const skillCatalog=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const action=(id,jobKey='ENCHANTER',level=45,source=skillCatalog,
 available=true,masteries={hymn:8,blessing:78,slash:41})=>
 root.PandoraBookSkillThresholds.sourceAction({
  skillCatalog:source,skillId:id,jobKey,level,available,
  branchCaps:classes[jobKey]?.branchCaps,branchMasteries:masteries});
const inspect=(id,source=skillCatalog)=>
 root.PandoraWikiSkillInsights.inspect({
  skillCatalog:source,classes,id,calculator:root.PandoraOSCalculator});

test('current OS action cards expose only base MP/cast/cooldown and actual variant IDs',()=>{
 assert.deepEqual(action(340001001),{
  skillId:340001001,skillType:'TOGGLE',mana:30,cast:0,cooldown:5,
  baseOnly:true,serverFinalUnverified:true
 });
 assert.deepEqual(action(320011001),{
  skillId:320011001,skillType:'ALLY',mana:68,cast:0.5,cooldown:1.5,
  baseOnly:true,serverFinalUnverified:true
 });
 const strike=action(100102001,'JUGGERNAUT',45);
 assert.equal(strike.mana,14);
 assert.equal(strike.cast,0);
 assert.equal(strike.cooldown,10);
 assert.equal(action(100102001,'ENCHANTER'),null);
 assert.equal(action(320011001,'ENCHANTER',44),null);
 assert.equal(action(340001001,'ENCHANTER',45,skillCatalog,false),null);
 assert.equal(action(340001001,'ENCHANTER',45,skillCatalog,true,{hymn:7}),null);
 assert.equal(action(100102001,'JUGGERNAUT',45,skillCatalog,true,{slash:40}),null);
});

test('bad OS skill metadata or a passive skill never becomes a castable action',()=>{
 for(const mutate of [
  rec=>rec.id=123,
  rec=>rec.mana=-1,
  rec=>rec.cast=NaN,
  rec=>rec.cooldown=Infinity,
  rec=>rec.learnable=false,
  rec=>rec.funcs=[]
 ]){
  const source=structuredClone(skillCatalog);
  mutate(source['340001001']);
  assert.equal(action(340001001,'ENCHANTER',45,source),null);
 }
 const passive=structuredClone(skillCatalog);
 passive['340001001'].skillType='PASSIVE';
 assert.equal(action(340001001,'ENCHANTER',45,passive),null);
});

test('base action metadata stays in collapsed current-build cards, never source-only Wiki formulas',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/sourceAction\?\.\(\{/);
 assert.match(book,/data-skill-action-id/);
 assert.match(book,/branchCaps:heroBranchCaps,branchMasteries:heroMasteries/);
 assert.match(book,/Применение и затраты: Расход ОМ:/);
 assert.match(book,/Базовое применение/);
 assert.doesNotMatch(book,/Окончательные затраты и время с усилениями/);
 assert.doesNotMatch(book,/wiki-skill-source-material/);
});

test('both exact Toxify OS variants reveal Venom item and weapon-change rule',()=>{
 assert.equal(items['50056'].name,'Ядовитое зелье');
 assert.equal(english.items['50056'].n,'Venom');
 for(const id of [220001001,220001003]){
  const record=skillCatalog[String(id)];
  assert.equal(record.name,'Яд');
  assert.equal(english.skills[String(id)].n,'Toxify');
  const result=inspect(id);
  assert.deepEqual(result.extra,[{type:'requiredItem',count:1,itemId:50056}]);
  assert.match(result.notes[0].ru,/смене оружия/);
  assert.match(result.notes[0].en,/changing weapons/);
  assert.equal(result.sourceOnly,true);
  assert.equal(result.finalAmount,null);
 }
 assert.equal(inspect(220002001).extra.find(x=>x.type==='recipe').uses.length,2,
  'Existing crafting recipes are not replaced with a bare cost row');
});

test('poison costs fail closed if source vectors, item IDs or upgrade requirements drift',()=>{
 for(const [id,mutate] of [
  [220001001,s=>s.funcs[1].fv1[3]=50059],
  [220001001,s=>s.funcs[1].fv2[3]=3],
  [220001001,s=>s.funcs[2].ep='EP_UNKNOWN'],
  [220001003,s=>s.funcs[0].fv1[2]=100],
  [220001003,s=>s.reqs[0].amount=12],
  [220001003,s=>s.prereq=null]
 ]){
  const source=structuredClone(skillCatalog);
  mutate(source[String(id)]);
  assert.ok(!inspect(id,source)?.extra?.some(x=>x.type==='requiredItem'),
   'Outdated/forged OS item expense must not be displayed for '+id);
 }
});
