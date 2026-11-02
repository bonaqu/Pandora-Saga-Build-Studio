import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const ctx={};
Function('window',readFileSync(new URL('pandora-os-character-calculator.js',root),'utf8'))(ctx);
const calculator=ctx.PandoraOSCalculator;
const classes=read('data/os/classes.json');
const tables=read('data/os/tables.json');
const values=[0,1,23,49,99,130];

test('all 28 current game-class coefficients preserve integer-cent HP/MP rounding through level 55',()=>{
 assert.equal(Object.keys(classes).length,28);
 for(const [name,data] of Object.entries(classes))
  for(const level of [1,15,30,45,50,55])
   for(const ability of values)
    for(const [kind,abilityName] of [['hp','vit'],['mp','spi']]){
     const source=data[kind];
     assert.ok(source,'Missing '+kind+' source for '+name);
     const integer=Math.floor((
      Math.round(source.base*100)+
      level*Math.round(source.lv*100)+
      ability*Math.round(source[abilityName]*100))/100);
     const actual=calculator.classBase(source,level,ability,abilityName);
     assert.equal(actual,integer,name+' '+kind+' level '+level+' '+abilityName+' '+ability);
    }
});
test('published magic improvement tiers are distinct from physical and historic gemstone series',()=>{
 assert.deepEqual(Object.keys(tables.magicPlus),Array.from({length:10},(_,i)=>String(i+1)));
 assert.deepEqual(Object.keys(tables.weaponPlus),Array.from({length:10},(_,i)=>String(i+1)));
 for(const grade of [1,5,7,10]){
  const m=tables.magicPlus[grade],p=tables.weaponPlus[grade];
  assert.ok(Number.isFinite(m.flat)&&Number.isFinite(m.ratio));
  assert.ok(Number.isFinite(p.flat)&&Number.isFinite(p.ratio));
 }
 assert.notDeepEqual(tables.magicPlus[10],tables.weaponPlus[10],
  'Never substitute the physical refinement table for magical refinement');
 const historical=calculator.gemstonePreview([
  {slot:'weapon',grade:10,gem:{type:'magical',element:'fire'},itemId:2801}
 ]);
 assert.equal(historical.verified,false,
  'Legacy magical gemstone series does not prove current game-client magic refinement');
});
test('defense and magic output remain explicitly partial without a live client result oracle',()=>{
 const defense=calculator.defensePreview({
  records:[['item:armor',{id:333,slot:'body',AC:15,name:'Armor'},10]]
 });
 assert.equal(defense.verified,false);
 const magic=calculator.magicAttackPreview({int:50,jobKey:'WIZARD',weapon:{kind:'STAFF',id:2801}});
 assert.equal(magic.verified,false);
 assert.equal(Number.isFinite(defense.known),true);
 assert.equal(Number.isFinite(magic.known),true);
});
