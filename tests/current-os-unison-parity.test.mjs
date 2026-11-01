import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('os-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator;
const sets=JSON.parse(read('data/os/unison.json'));
const items=JSON.parse(read('data/os/items.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const rows=(ids,root,grade)=>ids.map(id=>['item:'+id,items[id],String(id)===String(root)?grade:0]);
const divine=['12081',...sets['12081'].members];
const gold=['12103',...sets['12103'].members];
const synergy=['14094','17034'];
const hero=(records,unisonCatalog=sets)=>calc.base({
 classData:classes.WARRIOR,raceData:{vit:40,str:50,agi:70,dex:35,spi:30,int:50},
 jobData:zero,allocation:zero,level:55,records,unisonCatalog,
 combatContext:{jobKey:'WARRIOR',skillCatalog:{}}});
test('OS Divine Cuirass needs root and all four distinct set companions',()=>{
 const partial=calc.unisonPreview({records:rows(divine.slice(0,4),12081,5),catalog:sets});
 const full=calc.unisonPreview({records:rows(divine,12081,5),catalog:sets});
 assert.equal(partial.active.find(x=>x.id===12081),undefined);
 assert.equal(full.active.find(x=>x.id===12081).companionCount,4);
 assert.equal(full.active.find(x=>x.id===12081).required,4);
 assert.equal(full.supplemental.length,1);
});
test('complete Divine set grade +0 = 200 MP, 12 cast resist, -8 cooldown',()=>{
 const equipment=rows(divine,12081,0);
 const noSet=hero(equipment,{});
 const withSet=hero(equipment);
 assert.equal(withSet.mp-noSet.mp,200);
 assert.equal(withSet.combat.castInterruption-noSet.combat.castInterruption,12);
 assert.equal(withSet.combat.cooldown-noSet.combat.cooldown,-8);
 assert.equal(withSet.combat.defense.known-noSet.combat.defense.known,0);
});
test('Divine set at root +5 yields additional 40 MP, 4 armor and 4 cast resistance',()=>{
 const equipment=rows(divine,12081,5);
 const noSet=hero(equipment,{});
 const withSet=hero(equipment);
 assert.equal(withSet.mp-noSet.mp,240);
 assert.equal(withSet.combat.castInterruption-noSet.combat.castInterruption,16);
 assert.equal(withSet.combat.defense.known-noSet.combat.defense.known,4);
 assert.equal(withSet.combat.cooldown-noSet.combat.cooldown,-8);
 assert.equal(withSet.unison.active[0].effects.length,6);
});
test('Divine +7 enhancement uses source linear p*grade+c with no double count',()=>{
 const withSet=hero(rows(divine,12081,7));
 const noSet=hero(rows(divine,12081,7),{});
 assert.equal(withSet.mp-noSet.mp,320);
 assert.equal(withSet.combat.defense.known-noSet.combat.defense.known,12);
 assert.equal(withSet.combat.castInterruption-noSet.combat.castInterruption,24);
});
test('Divine gloves and Sentinel Shield trigger separate two-piece synergy',()=>{
 const equipment=rows(synergy,14094,0);
 const withSet=hero(equipment);
 const noSet=hero(equipment,{});
 assert.equal(withSet.stats.vit-noSet.stats.vit,2);
 assert.equal(withSet.combat.backAttackEquipmentRate-noSet.combat.backAttackEquipmentRate,15);
 assert.equal(withSet.unison.active.length,1);
 assert.equal(withSet.unison.active[0].id,14094);
});
test('Gold armor fall protection unlocks with four companions and root grade +7',()=>{
 const near=calc.unisonPreview({records:rows(gold,12103,6),catalog:sets});
 const ready=calc.unisonPreview({records:rows(gold,12103,7),catalog:sets});
 assert.ok(!near.active.some(x=>x.id===12103));
 const effect=ready.active.find(x=>x.id===12103);
 assert.ok(effect);
 assert.equal(effect.conditions.length,1);
 assert.equal(effect.conditions[0].label,'Защита от падения');
 assert.equal(effect.effects.length,0,'do not fabricate an immunity percentage from zero-valued EP');
});
test('OS catalog atomic snapshot includes unison and the book shows active set effects',()=>{
 const app=read('app.js'),book=read('stage-attributes.js');
 assert.match(app,/\['meta','classes','skills','items','souls','racialPassives','unison'\]/);
 assert.match(app,/unisonCatalog:catalogSource\?\.unison/);
 assert.match(book,/Активные комплекты/);
 assert.match(book,/modifiers\?\.unison\?\.active/);
 assert.match(book,/Перезарядка умений/);
});

test('invalid root or companion enhancement never activates a real OS set',()=>{
 const baseline=calc.unisonPreview({records:rows(divine,12081,5),catalog:sets});
 assert.equal(baseline.active.length,1);
 for(const grade of [-1,11,1.5,undefined]){
  const badRoot=rows(divine,12081,grade);
  assert.equal(calc.unisonPreview({records:badRoot,catalog:sets}).active.length,0,
   'root grade '+String(grade));
  const badCompanion=rows(divine,12081,5);
  badCompanion[1][2]=grade;
  assert.equal(calc.unisonPreview({records:badCompanion,catalog:sets}).active.length,0,
   'companion grade '+String(grade));
 }
});

test('forged source names and mismatched item IDs do not count as set pieces',()=>{
 const original=rows(divine,12081,5);
 const real=calc.unisonPreview({records:original,catalog:sets});
 assert.equal(real.active.length,1);
 const fakeSource=original.map(row=>row.slice());
 fakeSource[2][0]='item:wrong';
 assert.equal(calc.unisonPreview({records:fakeSource,catalog:sets}).active.length,0);
 const mismatched=original.map(row=>row.slice());
 mismatched[1][0]='item:12081';
 assert.equal(calc.unisonPreview({records:mismatched,catalog:sets}).active.length,0);
 const spoofRoot=original.map(row=>row.slice());
 spoofRoot[0][0]='soul:12081';
 assert.equal(calc.unisonPreview({records:spoofRoot,catalog:sets}).active.length,0);
 assert.equal(calc.unisonPreview({records:original,catalog:sets}).active.length,1,
  'rejected malformed inputs must not mutate original equipment');
});

test('set root never counts as its own companion and repeated entries count only once',()=>{
 const source={...sets['14094'],members:[14094,17034,17034],
  rows:[{func:'EP_VITARITY_CONST',minC:1,maxC:1,minL:0,maxL:10,
   a:{f:0,p:0,c:2},b:{f:0,p:0,c:0}}]};
 const custom={'14094':source};
 const rootOnly=calc.unisonPreview({records:rows([14094],14094,0),catalog:custom});
 assert.equal(rootOnly.active.length,0,'root alone is not a companion');
 const repeated=calc.unisonPreview({records:rows([14094,17034,17034],14094,0),catalog:custom});
 assert.equal(repeated.active.length,1);
 assert.equal(repeated.active[0].companionCount,1);
 assert.equal(repeated.active[0].required,1);
 assert.deepEqual(repeated.active[0].matched,['17034']);
});
