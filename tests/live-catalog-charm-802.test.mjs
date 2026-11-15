import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const previous=JSON.parse(read('data/os/skills.json'));
const current=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/skills.json'));
const classes=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/classes.json'));
const preview=(skills,jobKey='JESTER')=>C.specializedSkillPreview({
 skillCatalog:skills,jobKey,level:55,
 branchCaps:classes[jobKey].branchCaps,
 branchMasteries:classes[jobKey].branchCaps
});
const row=(source,id)=>preview(source).magic.find(x=>x.id===id);

test('both source variants preserve only source-backed Silent Storm and Plague tooltips',()=>{
 const oldStorm=row(previous,440009001),liveStorm=row(current,440009001);
 const oldPlague=row(previous,440011001),livePlague=row(current,440011001);
 for(const result of [oldStorm,liveStorm,oldPlague,livePlague]){
  assert.ok(result,'The exact source-backed skill remains visible');
  assert.equal(result.sourceOnly,true);
  assert.equal(result.finalAmount,null);
  assert.equal(result.appliedToHero,false);
  assert.equal(result.requirementsMet,true);
 }
 assert.doesNotMatch(oldStorm.noteRu,/отталкивания/);
 assert.match(liveStorm.noteRu,/отталкивания/);
 assert.match(liveStorm.noteEn,/knockback/);
 assert.equal(oldPlague.cooldown,20);
 assert.equal(livePlague.cooldown,20);
 assert.equal(previous[440011001].skillType,'BOLT');
 assert.equal(current[440011001].skillType,'ENEMY');
 assert.deepEqual(previous[440011001].aoe,[4500,2700]);
 assert.deepEqual(current[440011001].aoe,[0,0]);
 assert.ok(livePlague.noteRu.includes('проклятие и болезнь'));
});

test('current Silent Storm requires all three exact linked source effects',()=>{
 const before=JSON.stringify(current);
 for(const corrupt of [
  fx=>{fx[0].fv1[0]=9},
  fx=>{fx[1].fv2[3]=36},
  fx=>{fx[2].fv1[3]=-101},
  fx=>{fx[2].ep='EP_UNKNOWN_KNOCKBACK'},
  fx=>{fx.pop()}
 ]){
  const bad=structuredClone(current);
  corrupt(bad[440009002].funcs);
  const result=preview(bad);
  assert.ok(result.rejected.includes(440009001));
  assert.equal(result.magic.some(x=>x.id===440009001),false);
  assert.ok(result.magic.some(x=>x.id===440011001),
   'An unrelated valid Plague must remain available');
 }
 assert.equal(JSON.stringify(current),before);
});

test('Plague ENEMY variant validates root type, area and real child',()=>{
 const before=JSON.stringify(current);
 for(const corrupt of [
  source=>{source[440011001].skillType='BOLT'},
  source=>{source[440011001].aoe=[4500,2700]},
  source=>{source[440011001].funcs[0].fv1[3]=440009002},
  source=>{source[440011002].funcs[0].fv1[3]=31},
  source=>{source[440011002].funcs[1].fv2[0]=33}
 ]){
  const bad=structuredClone(current);corrupt(bad);
  const result=preview(bad);
  assert.ok(result.rejected.includes(440011001));
  assert.ok(!result.magic.some(x=>x.id===440011001));
 }
 assert.equal(JSON.stringify(current),before);
});

test('class caps and skill checks still restrict Jester source previews',()=>{
 const cleric=preview(current,'CLERIC');
 assert.equal(cleric.magic.some(x=>x.id===440011001),false);
 assert.equal(cleric.magic.some(x=>x.id===440009001),false);
 const jester=preview(current);
 assert.ok(jester.magic.some(x=>x.id===440011001));
 assert.ok(jester.magic.some(x=>x.id===440009001));
});
