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
