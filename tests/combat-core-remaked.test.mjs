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
test('armor preview sums only equipped item AC and gated EP_ARMORCLASS_CONST once',()=>{
 const rows=[
  ['item:helmet',{AC:10,effects:[{func:'EP_ARMORCLASS_CONST',a:2}]},0],
  ['item:shield',{AC:14,effects:[]},0],
  ['soul:guard',{AC:900,effects:[{func:'EP_ARMORCLASS_CONST',a:3,min:5,max:10}]},7]
 ];
 const yes=calc.defensePreview({records:rows,honorTitle:11});
 assert.deepEqual([yes.armor,yes.equipment,yes.honor,yes.known],[24,5,5,34]);
 assert.equal(calc.defensePreview({records:rows.slice(0,2)}).known,26);
 assert.equal(calc.defensePreview({records:[...rows.slice(0,2),[rows[2][0],rows[2][1],4]]}).equipment,2);
 assert.equal(calc.defensePreview({records:rows,honorTitle:14}),null);
 assert.equal(yes.verified,false);
});
test('missing weapon improvement tables cannot make valid HP/MP disappear',()=>{
 const classes=JSON.parse(read('data/os/classes.json'));
 const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:15};
 const result=calc.base({classData:classes.WARRIOR,raceData:stats,
  jobData:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},allocation:{},level:45,
  combatContext:{weapon:{W:48},weaponGrade:5,weaponPlus:null}});
 assert.ok(Number.isFinite(result.hp));
 assert.ok(Number.isFinite(result.mp));
 assert.equal(result.combat?.attack,null);
 assert.equal(result.combat.defense.known,0);
});

test('OS structured attack modifiers apply flat and percent in Legacy rounding order',()=>{
 const weapon={W:48};
 const rows=[
  ['item:tunic',{effects:[{func:'EP_DAMAGERATE_CONST',a:4},
    {func:'EP_DAMAGERATE_SCALE',a:5},
    {func:'EP_TOHIT_SCALE',a:10}]},0],
  ['soul:strong',{effects:[{func:'EP_SKILL_EQUIP_DAMAGERATE',a:6,min:5,max:10}]},5],
  ['soul:late',{effects:[{func:'EP_SKILL_EQUIP_DAMAGERATE',a:7,min:6,max:10}]},5]
 ];
 const out=calc.combatPreview({stats:stat,level:45,weapon,records:rows});
 assert.equal(out.attack.raw,78.76);
 assert.equal(out.attack.flatEquipment,10);
 assert.equal(out.attack.percentEquipment[0].bonus,4);
 assert.equal(out.attack.known,93); // ceil(78.76+4+6+ceil(78.76*5%))
 assert.equal(out.accuracy.base,80);
 assert.equal(out.accuracy.percentage[0].bonus,8);
 assert.equal(out.accuracy.known,88);
 assert.equal(out.verified,false);
});
test('conditional soul not included below its min refinement',()=>{
 const rows=[['soul:strong',{effects:[{func:'EP_SKILL_EQUIP_DAMAGERATE',a:6,min:5,max:10}]},4]];
 const out=calc.combatPreview({stats:stat,level:45,weapon:{W:48},records:rows});
 assert.equal(out.attack.flatEquipment,0);
 assert.equal(out.attack.known,79);
 assert.equal(out.accuracy.known,80);
});
