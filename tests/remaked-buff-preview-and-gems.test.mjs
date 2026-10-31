import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ctx={};Function('window',read('os-calculator.js'))(ctx);
const calc=ctx.PandoraOSCalculator;
test('all eleven support skill effect previews reproduce Remaked Calc formulas',()=>{
 const v=calc.legacyBuffPreview({spi:70,blessing:50,hymn:40,alchemy:60});
 assert.deepEqual(Object.keys(v),[
  'gratia','lapisMedio','groupBarrier','holyWeapon','gloomyEffect',
  'enchantEnhance','enchantMagic','minstrelSong','sageSong','toxify','toxicAura'
 ]);
 assert.equal(v.gratia.value,12);
 assert.equal(v.gratia.nextSpi,84);
 assert.equal(v.lapisMedio.value,9);
 assert.equal(v.groupBarrier.value,-20);
 assert.equal(v.holyWeapon.value,4);
 assert.equal(v.gloomyEffect.value,5);
 assert.equal(v.enchantEnhance.value,20);
 assert.equal(v.enchantMagic.value,5);
 assert.equal(v.minstrelSong.value,19);
 assert.equal(v.sageSong.value,8);
 assert.equal(v.toxify.value,3);
 assert.equal(v.toxicAura.value,9);
});
test('support previews preserve floor and exact threshold behavior',()=>{
 const lo=calc.legacyBuffPreview({spi:83,blessing:24,hymn:7,alchemy:19});
 const hi=calc.legacyBuffPreview({spi:84,blessing:25,hymn:8,alchemy:20});
 assert.equal(lo.gratia.value,12);
 assert.equal(hi.gratia.value,14);
 assert.equal(lo.enchantEnhance.value,14);
 assert.equal(hi.enchantEnhance.value,15);
 assert.equal(lo.toxify.value,0);
 assert.equal(hi.toxify.value,1);
 assert.equal(calc.legacyBuffPreview({spi:-1}),null);
 assert.equal(calc.legacyBuffPreview({spi:'70'}),null);
});
const classes=JSON.parse(read('data/os/classes.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
function baseWith(gemSelections=[],extra={}){
 return calc.base({classData:classes.WARRIOR,
  raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
  jobData:zeros,allocation:zeros,level:45,
  combatContext:{jobKey:'WARRIOR',skillCatalog:{},
   legacyBuffMasteries:{blessing:50,hymn:40,alchemy:60}},
  gemSelections,...extra});
}
const gem=(slot,grade,element,type='physical')=>({
 slot,grade,itemId:21,gem:{element,type}
});
test('two real armor gemstones feed Remaked elemental defenses once',()=>{
 const gemSelections=[gem('body',7,'light'),gem('head',5,'light')];
 const full=baseWith(gemSelections);
 const plain=baseWith();
 assert.deepEqual(full.gemstones.resistance,{fire:5,ice:5,lightning:5});
 for(const element of ['fire','ice','lightning']){
  assert.equal(full.resistances.elements[element]-plain.resistances.elements[element],5);
  assert.equal(full.resistances.gemstones[element],5);
 }
 assert.equal(full.legacyBuffs.groupBarrier.value,-20);
 assert.equal(full.legacyBuffs.toxify.value,3);
 assert.equal(full.hp,plain.hp);
 assert.equal(full.mp,plain.mp);
});
test('physical weapon gemstone aura never increases flat weapon ATK or armor',()=>{
 const plain=baseWith();
 const withWeaponGem=baseWith([gem('weapon',7,'ice')]);
 assert.equal(withWeaponGem.gemstones.auras.ice,11);
 assert.equal(withWeaponGem.gemstones.status.ice,7);
 assert.equal(withWeaponGem.combat.attack.known,plain.combat.attack.known);
 assert.equal(withWeaponGem.combat.defense.known,plain.combat.defense.known);
});
test('read-only buff figures are available in the book but cannot switch effects on',()=>{
 const app=read('app.js'),stage=read('stage-attributes.js');
 assert.match(app,/legacyBuffMasteries=Object\.fromEntries/);
 assert.match(app,/\['blessing','hymn','alchemy'\]/);
 assert.match(stage,/stage-legacy-buff-previews/);
 assert.match(stage,/Мощность поддерживающих навыков/);
 assert.match(stage,/Просмотр не включает усиление/);
 assert.match(stage,/Сопротивления самоцветов учтены/);
});
