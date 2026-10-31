import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('os-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator;
const tables=JSON.parse(read('data/os/tables.json'));
const data=JSON.parse(read('data/os/items.json'));
const stat={str:50,dex:35,agi:70,vit:40,spi:30,int:15};
test('weapon uses current OS improvement tiers, not historic Remaked +7..10 table',()=>{
 const weapon=data['1'];
 assert.equal(weapon.W,48);
 const w=calc.weaponAttackPreview({str:50,weapon,grade:5,
  weaponPlus:tables.weaponPlus});
 assert.deepEqual([w.physical,w.weaponDamage,w.refinement,w.strengthRate,w.known],
  [25,48,15,.12,96]);
 assert.equal(calc.weaponAttackPreview({str:50,weapon,grade:7,
  weaponPlus:tables.weaponPlus}).refinement,26);
 assert.equal(calc.weaponAttackPreview({str:50}).known,26);
 assert.equal(calc.weaponAttackPreview({str:50,weapon,grade:11,
  weaponPlus:tables.weaponPlus}),null);
 assert.equal(calc.weaponAttackPreview({str:50,weapon,grade:5}),null);
});
test('legacy ATK strength breakpoints and exclusive Honor floor bonus',()=>{
 const weapon={W:48};
 const base=calc.weaponAttackPreview({str:50,weapon});
 assert.equal(base.known,79); // 25+48+48*0.12=78.76, ceil
 const title=calc.weaponAttackPreview({str:50,weapon,honorTitle:3});
 assert.equal(title.honor,1);
 assert.equal(title.known,80);
 assert.equal(calc.weaponAttackPreview({str:20,weapon}).strengthRate,.02);
 assert.equal(calc.weaponAttackPreview({str:19,weapon}).strengthRate,0);
});
test('accuracy/dodge/critical use Remaked base and verified OS flat bonuses',()=>{
 const cm=calc.combatPreview({stats:stat,level:45,bonuses:{
  accuracy:8,dodge:3,criticalChance:2},honorTitle:12});
 assert.equal(cm.accuracy.base,80);
 assert.equal(cm.accuracy.known,78);
 assert.equal(cm.dodge.base,140); // 45+70+25
 assert.equal(cm.dodge.known,153);
 assert.equal(cm.critical.known,6);
 assert.equal(cm.attack.known,26);
 assert.equal(cm.verified,false);
});
test('Myrine racial bonuses: direct +5 crit, separate +10% hit and +5% dodge',()=>{
 const critical=calc.combatPreview({stats:stat,level:45,racialPassiveId:900040001});
 assert.equal(critical.critical.known,9);
 const hit=calc.combatPreview({stats:stat,level:45,racialPassiveId:900040002});
 assert.equal(hit.accuracy.known,80);
 assert.equal(hit.racialRate.accuracy,10);
 const dodge=calc.combatPreview({stats:stat,level:45,racialPassiveId:900040003});
 assert.equal(dodge.dodge.known,140);
 assert.equal(dodge.racialRate.dodge,5);
});
test('base character calculator gets combat context without applying its bonuses to HP/MP',()=>{
 const classes=JSON.parse(read('data/os/classes.json'));
 const attrs={vit:40,str:50,agi:70,dex:35,spi:30,int:15};
 const b=calc.base({classData:classes.WARRIOR,raceData:attrs,jobData:{
  vit:0,str:0,agi:0,dex:0,spi:0,int:0},allocation:{},level:45,
  combatContext:{weapon:data['1'],weaponGrade:5,weaponPlus:tables.weaponPlus}});
 assert.equal(b.combat.attack.known,96);
 assert.equal(b.combat.accuracy.known,80);
 assert.equal(b.combat.dodge.known,140);
 assert.equal(b.verified,false);
 assert.equal(b.hp,b.hpBase+b.vitalsBonus.hp.total);
});
test('old combat-stage expectations are updated without loosening release version guard',()=>{
 const app=read('app.js'),stage=read('stage-attributes.js'),check=read('tests/stage-attributes.test.mjs');
 assert.match(app,/combatContext:\{weapon,weaponGrade,weaponPlus:gameTables\?\.weaponPlus\}/);
 assert.match(stage,/modifiers\?\.combat/);
 assert.match(stage,/частичный расчёт/);
 assert.match(check,/assert\.equal\(v,pkg\.pandoraRelease\)/);
});
