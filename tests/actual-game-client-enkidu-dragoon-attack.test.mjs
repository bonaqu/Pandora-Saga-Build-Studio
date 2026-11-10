import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Actual client screenshots supplied 2026-11-10: Enkidu Dragoon level 45.
// This fixture is deliberately not an invented fix for the unresolved ATK
// formula (#386). It freezes everything else that matches the game.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win={};
Function('window',read('pandora-os-character-calculator.js'))(win);
const C=win.PandoraOSCalculator;
const [items,souls,skills,tables,classes,itemForth]=
 ['items','souls','skills','tables','classes','itemForth']
  .map(k=>JSON.parse(read('data/os/'+k+'.json')));
const worn=[
 [1483,8], // Strong Zephyr Spear +8, physical fire
 [11087,3], // Dark Crown +3
 [12608,4], // Black Astir Jacket +4
 [14562,3], // Dawn Gloves for Enkidu +3
 [13608,4], // Black Astir Pants +4
 [15608,6], // Black Astir Shoes +6
 [18001,0], // Mastery Cloak
 [19036,0],[19036,0], // Sharp Edge Rings I/II
 [20001,0], // Necklace
 [21001,0], // Belt
 [22005,0],[22005,0] // Fire Earrings I/II
];
const socketed=[
 [101001,8],[101001,8], // 2 Happiness Souls ON SPEAR, not on jacket
 [103002,4],[103002,4], // 2 Wolf Souls ON JACKET: each +1 dodge
 [104003,3], // Berserker Soul on gloves: STR+1, AGI+1, INT-3
 [103010,4],[103010,4], // 2 Mind Souls on pants
 [105001,6], // Dawn Soul on boots
 [107006,0],[107006,0] // 2 Thorny Souls on belt
];
const records=[
 ...worn.map(([id,g])=>['item:'+id,items[id],g]),
 ...socketed.map(([id,g])=>['soul:'+id,souls[id],g])
];
const gems=[
 [1483,8,'fire'],[11087,3,'lightning'],[12608,4,'fire'],
 [14562,3,'light'],[13608,4,'fire'],[15608,6,'lightning']
].map(([id,grade,element])=>({slot:items[id].slot,itemId:id,grade,
 gem:{type:'physical',element}}));
const setup={
 classData:classes.DRAGOON,raceData:tables.raceInit.ENKIDU,
 jobData:tables.jobInit.WARRIOR,
 // Race+class start: 10 VIT, 9 STR, 3 AGI, 5 DEX, 5 SPI, 2 INT.
 // Manual allocations: STR 68, AGI 71, DEX 33 before gear/Souls.
 allocation:{vit:0,str:59,agi:68,dex:28,spi:0,int:0},
 level:45,records,itemForth,gemSelections:gems,
 potionContext:{racialPassiveId:900050002},
 combatContext:{weapon:items[1483],weaponGrade:8,
  weaponPlus:tables.weaponPlus,magicPlus:tables.magicPlus,
  jobKey:'DRAGOON',skillCatalog:skills,meleeMastery:72,
  ridingMastery:50}
};
const game=Object.freeze({
 normal:{min:189,max:219},warCry:{min:229,max:266},
 defense:72,accuracy:99,dodge:144,
 fire:9,ice:4,lightning:10
});
const result=warCry=>C.base(warCry?{...setup,attributeBuffs:{combatWarCry:true}}:setup);

test('confirmed equipment: two Wolf Souls, two Happiness Souls, exact STR and +8',()=>{
 assert.deepEqual(socketed.map(x=>x[0]).slice(0,4),
  [101001,101001,103002,103002]);
 assert.deepEqual(souls[103002].slots,['body','legs']);
 assert.deepEqual(souls[101001].slots,['weapon']);
 assert.equal(souls[103002].effects[0].a,1);
 assert.equal(items[1483].W,90);
 assert.deepEqual(tables.weaponPlus['8'],{ratio:18,flat:23});
 assert.equal(C.weaponAttackPreview({str:72,weapon:items[1483],grade:8,
  weaponPlus:tables.weaponPlus}).refinement,39);
 const calc=result(false);
 assert.deepEqual(calc.stats,{vit:10,str:72,agi:72,dex:40,spi:5,int:1});
});

test('verified OS client controls: DEF, ACC, DODGE and elemental resistances',()=>{
 for(const cry of [false,true]){
  const x=result(cry);
  assert.equal(x.combat.defense.known,game.defense);
  assert.equal(x.combat.accuracy.known,game.accuracy);
  assert.equal(x.combat.dodge.known,game.dodge);
  assert.deepEqual(['fire','ice','lightning']
   .map(e=>x.resistances.elements[e]),
   [game.fire,game.ice,game.lightning]);
 }
});

test('source: Strong arms matches POLE_ARM and War Cry has exactly 10 +20%',()=>{
 const x=result(false),cry=result(true);
 assert.equal(x.combat.racialWeapon.id,900050002);
 assert.equal(x.combat.racialWeapon.matchesCategory,true);
 assert.equal(x.combat.racialWeapon.percent,12);
 const effect=skills[320001001].funcs;
 assert.equal(effect.find(e=>e.ep==='EP_DAMAGERATE_CONST').fv1[3],10);
 assert.equal(effect.find(e=>e.ep==='EP_DAMAGERATE_SCALE').fv1[3],20);
 assert.equal(cry.combat.activeSkills.warCry,true);
});

// Observed real game max is 219 / 266 (ranges 189–219 / 229–266).
// The inherited strength curve calculates 231 / 281 on exactly these records.
// Do NOT hard-code 219 or 266 just for this character. Obtain independent
// STR threshold and/or server-engine evidence, then enable this parity check.
test.todo('Issue #386: OS client 45 Enkidu Dragoon Zephyr +8 max ATK 219 without War Cry');
test.todo('Issue #386: OS client 45 Enkidu Dragoon Zephyr +8 max ATK 266 with War Cry');
test.todo('Issue #238: OS client same build minimum ATK 189 without and 229 with War Cry');

test('diagnostic ONLY: a 15% strength coefficient reproduces both observed maxima',()=>{
 // This does not establish which STR ranges use that coefficient on OS.
 const raw=Math.floor(72/2)+(90+39)+(90+39)*.15;
 const passive=Math.ceil(raw*.12),flatGear=3+4+4;
 assert.equal(Math.ceil(raw+passive+flatGear),game.normal.max);
 assert.equal(Math.ceil(raw+passive+flatGear+10+Math.ceil(raw*.2)),
  game.warCry.max);
});
