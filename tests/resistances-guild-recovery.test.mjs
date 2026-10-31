import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('os-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator;
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const classes=JSON.parse(read('data/os/classes.json'));
const make=(attributeBuffs={},potionContext={},records=[])=>calc.base({
 classData:classes.CLERIC,raceData:{...zero,vit:56,spi:84},jobData:zero,
 allocation:zero,level:45,attributeBuffs,potionContext,records
});
test('base physical and mental debuff resistances use exact floor(attribute / 28) * 7',()=>{
 const r=make().resistances;
 assert.equal(r.states.physical,14);
 assert.equal(r.states.mental,21);
 assert.equal(make({}, {racialPassiveId:900010002}).resistances.states.physical,29);
 assert.equal(make({}, {racialPassiveId:900020003}).resistances.elements.charm,20);
});
test('Honor is exclusive and adds the source-aligned element and state modifiers',()=>{
 const fire=make({honorTitle:3}).resistances;
 assert.equal(fire.elements.fire,10);
 assert.equal(fire.elements.ice,-15);
 assert.equal(fire.elements.lightning,0);
 const darkness=make({honorTitle:9}).resistances;
 assert.equal(darkness.elements.charm,5);
 assert.equal(darkness.elements.dark,10);
 assert.equal(darkness.elements.light,-5);
 assert.equal(darkness.states.mental,27);
 const light=make({honorTitle:10}).resistances;
 assert.equal(light.states.physical,20);
 assert.equal(light.elements.magic,3);
});
test('racial passive mitigation is not confused with elemental resistances',()=>{
 const guard=make({}, {racialPassiveId:900050001}).resistances;
 assert.equal(guard.mitigation.physical,-10);
 assert.equal(guard.elements.fire,0);
 const lapin=make({}, {racialPassiveId:900060001}).resistances;
 assert.equal(lapin.mitigation.magic,-10);
 assert.equal(lapin.states.physical,14);
});
test('structured equipped resistance effects add only once on top of Honor',()=>{
 const item={effects:[
  {func:'EP_FIRE_RESISTANCE_CONST',a:6},
  {func:'EP_CHARM_RESISTANCE_CONST',a:8},
  {func:'EP_MAGIC_RESISTANCE_CONST',a:5}
 ]};
 const r=make({honorTitle:3},{},[['item:fixture',item,0]]).resistances;
 assert.equal(r.elements.fire,16);
 assert.equal(r.elements.ice,-15);
 assert.equal(r.elements.charm,8);
 assert.equal(r.elements.magic,5);
});
test('Remaked HP/MP natural recovery guild selectors and Healing stack exactly',()=>{
 const r=make({guildLifeRecovery:2,guildManaRecovery:1,guildHealing:3}).regeneration;
 assert.deepEqual(r.hp,{base:5,guild:8,healing:30,total:43});
 assert.deepEqual(r.mp,{base:8,guild:5,healing:30,total:43,equipment:0});
 assert.equal(make().regeneration.hp.total,5);
 assert.equal(make().regeneration.mp.total,8);
 assert.equal(make({guildHealing:2}).regeneration.hp.total,25);
 assert.equal(make({guildHealing:2}).regeneration.mp.total,28);
});
test('invalid guild indices cannot create fake recovery or contaminate shared builds',()=>{
 assert.equal(make({guildLifeRecovery:3}),null);
 assert.equal(make({guildManaRecovery:-1}),null);
 assert.equal(make({guildHealing:4}),null);
 assert.equal(make({guildHealing:'2'}),null);
 const app=read('app.js'),html=read('index.html');
 for(const name of ['guildLifeRecovery','guildManaRecovery','guildHealing']){
  assert.ok(app.includes("safe.attributeBuffs[key]=level"));
  assert.ok(app.includes("'"+name+"'"));
  assert.ok(html.includes('id="origin'+name[0].toUpperCase()+name.slice(1)+'"'));
 }
 assert.match(app,/Number.isInteger\(level\)&&level>=0&&level<=limit/);
});
test('technical methodology remains admin-only, without cluttering the player book',()=>{
 const stage=read('stage-attributes.js');
 assert.match(stage,/не количество ОЗ\/ОМ за тик/);
 assert.match(stage,/const isAdmin=root\.PandoraStudioAdminActive\?\.\(\)===true/);
 assert.match(stage,/if\(isAdmin&&details\.children\.length>1\)body\.append\(details\)/);
 assert.match(stage,/modifiers\?\.regeneration/);
 assert.match(stage,/modifiers\?\.resistances/);
});
