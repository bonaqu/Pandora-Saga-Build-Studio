import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);
const old=JSON.parse(read('data/os/skills.json'));
const live=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/skills.json'));
const oldClasses=JSON.parse(read('data/os/classes.json'));
const liveClasses=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/classes.json'));
const inspect=(skills,classes,id)=>host.PandoraWikiSkillInsights.inspect({
 skillCatalog:skills,classes,id,calculator:host.PandoraOSCalculator
});
const songs=[
 [340001001,340001002,340001003],
 [340001004,340001005,340001006],
 [340003001,340003002,340003003],
 [340004001,340004002,340004003]
];

test('all four hymn chains are visible in both archived and current D1 Wiki',()=>{
 for(const [name,skills,classes,ending] of [
  ['archive',old,oldClasses,'EP_STATE_CHANT'],
  ['published D1',live,liveClasses,'EP_UNABLE_CAST']
 ]){
  for(const path of songs){
   const record=skills[String(path[0])];
   assert.equal(record.funcs[3].ep,ending,name+' '+path[0]);
   const result=inspect(skills,classes,path[0]);
   assert.equal(result?.pathKind,'hymn',name+' '+path[0]);
   assert.deepEqual(result.paths,[path],name+' '+path[0]);
   assert.equal(result.finalAmount,null);
   assert.equal(result.sourceOnly,true);
   assert.equal(result.extra.length,0);
  }
 }
});

test('invalid service effect or recipient chain is not presented as a verified hymn',()=>{
 for(const source of [old,live]){
  for(const mutate of [
   s=>s[340001001].funcs[3].ep='EP_UNKNOWN',
   s=>s[340001001].funcs[3].fv1[3]=1,
   s=>s[340001001].funcs[3].fv2[0]=1,
   s=>s[340001002].funcs[0].fv1[3]=340004003,
   s=>s[340001003].funcs[0].fv1[2]=14
  ]){
   const broken=structuredClone(source);
   mutate(broken);
   const insight=inspect(broken,liveClasses,340001001);
   assert.notEqual(insight?.pathKind,'hymn',
    'An unverified hymn must not show a confirmed chain');
  }
 }
});

test('level-50 trap-capacity passive is only described for exact live two-effect source',()=>{
 assert.equal(old['240009001'].learnable,false);
 assert.equal(live['240009001'].learnable,true);
 assert.equal(inspect(old,oldClasses,240009001),null);
 const info=inspect(live,liveClasses,240009001);
 assert.equal(info?.pathKind,'trap-passive');
 assert.equal(info?.sourceOnly,true);
 assert.equal(info?.finalAmount,null);
 assert.deepEqual(info.paths,[]);
 assert.deepEqual(info.extra,[]);
 assert.match(info.notes[0].ru,/50-го уровня/);
 assert.match(info.notes[0].en,/level 50/);
 assert.match(info.notes[0].ru,/не подтверждены/);
 assert.ok(!Object.hasOwn(info,'finalDamage'));
});

test('trap passive never accepts changed class, level or source coefficient',()=>{
 for(const mutate of [
  s=>s[240009001].funcs[0].fv1[2]=6,
  s=>s[240009001].funcs[1].fv1[2]=15,
  s=>s[240009001].funcs[1].fv2[0]=1,
  s=>s[240009001].funcs[1].ep='EP_UNKNOWN',
  s=>s[240009001].funcs.pop(),
  s=>s[240009001].classes={DISTURBANCE:1,SNIPER:1},
  s=>s[240009001].charLevel=49,
  s=>s[240009001].learnable=false
 ]){
  const broken=structuredClone(live);
  mutate(broken);
  const check=inspect(broken,liveClasses,240009001);
  assert.notEqual(check?.pathKind,'trap-passive');
 }
 const alteredClass=structuredClone(liveClasses);
 alteredClass.DISTURBANCE.branchCaps.trap=0;
 assert.notEqual(inspect(live,alteredClass,240009001)?.pathKind,'trap-passive');
});

test('verified Wiki notes never become unsupported persistent Hero Book bonuses',()=>{
 assert.doesNotMatch(read('pandora-studio-hero-book.js'),/trapCapacityEvidence/);
 const inspector=read('pandora-studio-wiki-skill-insights.js');
 assert.match(inspector,/trapCapacityEvidence/);
 assert.match(inspector,/EP_UNABLE_CAST/);
});
