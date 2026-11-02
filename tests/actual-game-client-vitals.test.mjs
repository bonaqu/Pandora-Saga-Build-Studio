import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// These expected outputs were observed in the actual Pandora Saga OS game
// client on 2026-10-13, NOT inferred from the public web calculator.
// Source: bonaqu/Pandora-Saga-Simulator-remaked,
// docs/INGAME_PARITY_VECTORS_2026-10-13.md (sections 1 and 4).
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const scope={};
Function('window',readFileSync(new URL('../pandora-os-character-calculator.js',import.meta.url),'utf8'))(scope);
const calc=scope.PandoraOSCalculator,classes=read('data/os/classes.json'),
 tables=read('data/os/tables.json'),items=read('data/os/items.json'),
 souls=read('data/os/souls.json'),forth=read('data/os/itemForth.json');
const six=['vit','str','agi','dex','spi','int'];
const zero=Object.fromEntries(six.map(k=>[k,0]));
const clericInput={vit:49,str:5,agi:40,dex:5,spi:53,int:71};
const cleric=(records=[],enhancements={})=>calc.base({
 classData:classes.CLERIC,raceData:clericInput,jobData:zero,
 allocation:zero,level:45,records,itemForth:forth,enhancements
});
const item=(id,grade=0)=>['item:'+id,items[id],grade];
const soul=(id,grade=0)=>['soul:'+id,souls[id],grade];

test('real client: first-level elf warrior, actual race/job start, HP149 MP44',()=>{
 const actual=calc.base({
  classData:classes.WARRIOR,
  raceData:tables.raceInit.ELF,jobData:tables.jobInit.WARRIOR,
  allocation:zero,level:1
 });
 assert.deepEqual([actual.stats.vit,actual.stats.str,actual.stats.agi,
  actual.stats.dex,actual.stats.spi,actual.stats.int],[5,6,5,5,6,7]);
 assert.deepEqual([actual.hpBase,actual.mpBase,actual.hp,actual.mp],
  [149,44,149,44]);
 assert.equal(actual.rounding,'floor-class-cents');
 // The dated public calculator's half-even 45 MP is *not* the game client.
 assert.equal(calc.halfToEven(44.72),45);
});

test('real client: elf warrior also reproduces defense, accuracy, evasion, charm and weapon max',()=>{
 // In-game equipment: Short Sword ID21 W9, Simple Tunic ID12001 AC6,
 // Pants ID13001 AC5 and Cloth Boots ID15061 AC1.
 const weapon=items[21];
 assert.ok(weapon,'Short Sword 21 must be published');
 assert.equal(weapon.W,9);
 const records=[item(21),item(12001),item(13001),item(15061)];
 for(const [source,record] of records)assert.ok(record,source);
 const actual=calc.base({
  classData:classes.WARRIOR,
  raceData:tables.raceInit.ELF,jobData:tables.jobInit.WARRIOR,
  allocation:zero,level:1,records,
  potionContext:{racialPassiveId:900020003},
  combatContext:{weapon,weaponGrade:0,weaponPlus:tables.weaponPlus,
   jobKey:'WARRIOR'}
 });
 assert.equal(actual.combat.attack.known,12,
  'known upper attack endpoint, original client reports 9–12');
 assert.equal(actual.combat.defense.known,12);
 assert.equal(actual.combat.accuracy.known,6);
 assert.equal(actual.combat.dodge.known,6);
 assert.equal(actual.resistances.elements.charm,20);
});

test('real client: crystal ring +1 vitality produces HP155, preserves MP44',()=>{
 const ring=items[19004];
 assert.ok(ring,'OS Ring with Crystal ID 19004 must exist');
 assert.ok(ring.effects.some(e=>e.func==='EP_VITARITY_CONST'&&e.a===1));
 const actual=calc.base({classData:classes.WARRIOR,
  raceData:tables.raceInit.ELF,jobData:tables.jobInit.WARRIOR,
  allocation:zero,level:1,records:[item(19004)]});
 assert.deepEqual([actual.stats.vit,actual.hp,actual.mp],[6,155,44]);
});

test('real client: unbuffed cleric 45 VIT49 SPR53 is HP3145 MP1279',()=>{
 const actual=cleric();
 assert.equal(actual.hpBase,3145);
 assert.equal(actual.mpBase,1279);
 assert.equal(actual.hp,3145);
 assert.equal(actual.mp,1279);
 assert.equal(calc.halfToEven(1279.9),1280,
  'web-only half-even output must not replace the game observation');
});

test('real client: source-backed Cleric gear and Life Sign reproduce 3402/1505 and 4127',()=>{
 // Original gameplay record identified shield 17034, boots 15004 +4,
 // novice pants 13102 +3, Moonlight Wand 2621, belt 21011, necklace 20001,
 // and High Soul 104002. Only the actual OS structured sources are used here.
 const records=[item(17034),item(15004,4),item(13102,3),
  item(2621),item(21011),item(20001),soul(104002,4)];
 for(const [name,source] of records)assert.ok(source,name+' is missing');
 const actual=cleric(records);
 assert.equal(actual.stats.vit,50);
 assert.equal(actual.stats.spi,57);
 assert.equal(actual.hpBase,3172);
 assert.equal(actual.mpBase,1320);
 assert.equal(actual.vitalsBonus.hp.flat,230);
 assert.equal(actual.vitalsBonus.mp.flat,80);
 assert.deepEqual(actual.vitalsBonus.mp.percentParts.map(x=>x.amount),[105]);
 assert.deepEqual([actual.hp,actual.mp],[3402,1505]);
 const buffed=cleric(records,{lifeSign:true});
 assert.equal(buffed.vitalsBonus.hp.lifeSign,725);
 assert.equal(buffed.hp,4127);
 assert.equal(buffed.mp,1505);
});

test('public web reference is distinct: Gladiator 45 MP163 is not a client fixture',()=>{
 const mp=calc.classBase(classes.GLADIATOR.mp,45,4,'spi');
 assert.equal(mp,162);
 assert.equal(calc.halfToEven(30+45*2.73+4*2.53),163);
});
