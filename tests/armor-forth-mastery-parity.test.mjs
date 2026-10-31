import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win={};Function('window',read('os-calculator.js'))(win);Function('window',read('skill-progression.js'))(win);
const calc=win.PandoraOSCalculator,progress=win.PandoraSkillProgression;
const forth=JSON.parse(read('data/os/itemForth.json')),items=JSON.parse(read('data/os/items.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
test('Legacy armor +N applies floor(N*1.5) to six slots separately',()=>{
 const slots=['shield','head','body','gloves','legs','feet'];
 const rows=slots.map((slot,i)=>['item:'+i,{id:5000+i,slot,name:'Броня',AC:10},7]);
 const out=calc.defensePreview({records:rows,honorTitle:11});
 assert.deepEqual([out.armor,out.refinement,out.honor,out.known],[60,60,5,125]);
});
test('Legacy shields refine but jewelry, Souls and names with hyphen do not',()=>{
 const rows=[['item:1',{name:'Кольцо',slot:'ring',AC:4},10],
 ['item:2',{name:'-',slot:'head',AC:7},10],
 ['soul:42',{name:'Душа',slot:'head',AC:99},10]];
 const out=calc.defensePreview({records:rows});
 assert.equal(out.refinement,0);assert.equal(out.armor,11);
});
test('current OS itemForth grade +7 replaces text extraction, not intrinsic effects',()=>{
 const item=items['2'];assert.equal(item.id,2);
 const effects=calc.gatherEffects([['item:2',item,7]],forth);
 assert.equal(effects.health.mp,60);
 assert.equal(effects.flat.agi,2);
});
test('Forth contribution is applied to armor and attack effects',()=>{
 const item={id:777,slot:'body',name:'Броня',AC:9};
 const lookup={'777':{'7':[{func:'EP_DAMAGERATE_CONST',a:5},
  {func:'EP_ARMORCLASS_CONST',a:2}]}};
 const cm=calc.combatPreview({stats,level:40,weapon:{W:48},
  records:[['item:777',item,7]],itemForth:lookup});
 assert.equal(cm.attack.flatEquipment,5);
 assert.deepEqual([cm.defense.armor,cm.defense.refinement,
  cm.defense.equipment,cm.defense.known],[9,10,2,21]);
});
test('MATK thresholds, mage and equipment weapon types',()=>{
 const x=calc.magicAttackPreview({int:50,jobKey:'WIZARD',
  magicMastery:15,weapon:{kind:'WAND'}});
 assert.deepEqual([x.intelligence,x.passive,x.staff,x.known],[15,11,10,136]);
 assert.equal(calc.magicAttackPreview({int:95,weapon:{kind:'STAFF',
  name:'Таинственный посох'}}).known,150.25);
});
test('Remaked innate and trained grouped passives do not double count potential',()=>{
 const st={points:{slash:20,element:20,archery:20},masteryAuto:false,
  mastery:{slash:7,element:4,archery:3}};
 const g=progress.combatMasteries(st,{slash:5,element:5,archery:5});
 assert.deepEqual(g,{melee:12,magic:9,techniqueInnate:5,techniqueTrained:3});
 assert.equal(calc.combatPreview({stats,level:40,jobKey:'GLADIATOR',...g}).weaponPhysical,2);
 assert.equal(calc.combatPreview({stats,level:40,jobKey:'ARCHER',...g}).accuracy.passive,15);
 assert.equal(calc.combatPreview({stats,level:40,jobKey:'AGENT',...g}).dodge.passive,15);
});
test('critical Honor, back attack and INT cooldown remain independent',()=>{
 const x=calc.combatPreview({stats,level:40,honorTitle:8});
 assert.deepEqual([x.criticalIncoming,x.criticalIncomingDamage,
  x.cooldown,x.backAttack],[-10,90,90,15]);
 assert.equal(calc.combatPreview({stats,level:40,honorTitle:13}).frontAttack,10);
});
