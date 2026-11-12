import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const preview=(job,masteries={},stats={vit:40,str:70,agi:60,dex:50,spi:134,int:40},
 level=50,combat={attack:{walkingBase:160},defense:{directRaw:80},
 accuracy:{base:95},dodge:{base:108}})=>
 C.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,
  stats,combat,branchMasteries:masteries,branchCaps:classes[job].branchCaps});
const find=(r,id)=>[...r.offense,...r.defense].find(x=>x.id===id);
test('OS priest vectors + Remaked separate floors produce source-gated peace and enchant models',()=>{
 const r=C.priestCastPreviews({spi:134,blessing:90,hymn:30,skills});
 assert.equal(r.holyWeapon,10);
 assert.equal(r.peaceful,99);
 assert.equal(r.enchantAuraRate,54);
 assert.equal(r.enchantAuraFlat,20);
 assert.equal(r.enchantElementRate,28);
 assert.equal(r.holyEnhanced,36);
 assert.equal(r.gratia,22);
 assert.equal(r.lapisMedio,12);
 const changed=structuredClone(skills);
 changed['340003003'].funcs[0].fv1[0]=99;
 assert.equal(C.priestCastPreviews({spi:134,blessing:90,hymn:30,skills:changed}).peaceful,null);
 const forged=structuredClone(skills);
 forged['320011001'].funcs.find(x=>x.ep==='EP_AURADAMAGE_SCALE').fv1[0]=500;
 const noEnchant=C.priestCastPreviews({spi:134,blessing:90,hymn:30,skills:forged});
 assert.equal(noEnchant.enchantAuraRate,null);
 assert.equal(noEnchant.holyEnhanced,null);
 assert.equal(noEnchant.holyWeapon,10);
});
test('desperation and sniping interpolate base physical ATK without claiming server parity',()=>{
 const jug=find(preview('JUGGERNAUT',{slash:85}),100058001);
 assert.equal(jug.amount,111);
 assert.equal(jug.modelOnly,true);
 assert.equal(jug.uncertain,true);
 const sniper=find(preview('SNIPER',{archery:60}),213605001);
 assert.equal(sniper.amount,61);
 assert.equal(sniper.modelOnly,true);
 assert.equal(sniper.coefficientModels[0].amount,38);
});
test('swift arrow fixed 30%, dark aura SPR and both poison ranks show numerical models',()=>{
 const quick=find(preview('SNIPER',{archery:60}),213702001);
 assert.equal(quick.amount,30);
 assert.equal(quick.modelOnly,true);
 const gloom=find(preview('DARKROAR',{darkness:30}),430051001);
 assert.equal(gloom.amount,25);
 assert.equal(gloom.modelOnly,true);
 const basic=find(preview('PREDATOR',{alchemy:12}),220001001);
 assert.equal(basic.amount,10);
 assert.equal(basic.modelOnly,true);
 const improved=find(preview('PREDATOR',{alchemy:61}),220001003);
 assert.equal(improved.amount,20);
 assert.equal(find(preview('PREDATOR',{alchemy:61}),220001001),undefined);
});
test('250 synthetic edge cases are source-only and stable across mastery/SPR thresholds',()=>{
 const source=JSON.stringify(skills);
 let cases=0;
 for(let spi=1;spi<=50;spi++)for(const mastery of [0,15,30,61,90]){
  const value=C.priestCastPreviews({spi,blessing:mastery,hymn:mastery,skills});
  assert.ok(Number.isSafeInteger(value.enchantAuraRate));
  assert.ok(Number.isSafeInteger(value.peaceful));
  assert.ok(value.holyEnhanced>value.holyWeapon);
  cases++;
 }
 assert.equal(cases,250);
 assert.equal(JSON.stringify(skills),source);
});
test('Book puts model magnitudes underneath source skill name and next to caster inputs',()=>{
 const book=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-hero-book-additions.css');
 const app=read('pandora-studio-app.js');
 assert.match(book,/class:'stage-ally-skill-row'/);
 assert.match(book,/casterStatKey/);
 assert.match(book,/priestValues\.holyEnhanced/);
 assert.match(book,/priestValues\.peaceful/);
 assert.match(book,/priestBenevolence/);
 assert.match(book,/skill\.modelOnly\?'≈ '/);
 assert.match(css,/\.stage-ally-caster-field>input/);
 assert.match(app,/priestBenevolence:61/);
 assert.match(app,/benevolence:snap\.attributeBuffs\?\.priestBenevolence/);
});

test('real character-sheet pipeline combines Holy + Enchantment only when both enabled and a weapon exists',()=>{
 const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
 const ctx={classData:classes.WARRIOR,
  raceData:{vit:45,str:50,agi:50,dex:40,spi:70,int:25},
  jobData:zeros,allocation:zeros,level:45,
  combatContext:{jobKey:'WARRIOR',skillCatalog:skills,
   branchMasteries:{},weapon:{kind:'1H_SWORD',atk:90},
   externalPriest:{enabled:true,spi:134,blessing:90,hymn:30,benevolence:61}}};
 const preview=selected=>C.base({...ctx,
  attributeBuffs:{priestEnabled:true,remakedSkillIds:selected}});
 const plain=preview([]),holy=preview([330051001]),
  both=preview([330051001,320011001]),enchantedOnly=preview([320011001]);
 assert.equal(holy.auraDamage.elements.light.known,10);
 assert.equal(both.auraDamage.elements.light.known,36);
 assert.equal(both.auraDamage.elements.light.modeled,true);
 assert.equal(both.auraDamage.elements.light.priestEnhanceBonus,26);
 assert.equal(enchantedOnly.auraDamage.elements.light,undefined,
  'Enhancement must not invent Holy aura on its own');
 assert.equal(both.combat.attack.known,plain.combat.attack.known,
  'Unverified aura modeling cannot alter physical attack');
 assert.equal(both.hp,plain.hp);
 assert.equal(both.mp,plain.mp);
 const noWeapon=C.base({...ctx,combatContext:{
  ...ctx.combatContext,weapon:null},
  attributeBuffs:{priestEnabled:true,
   remakedSkillIds:[330051001,320011001]}});
 assert.deepEqual(noWeapon.auraDamage.elements,{});
 const changed=structuredClone(skills);
 changed['320011001'].funcs.find(x=>x.ep==='EP_AURADAMAGE_SCALE').fv1[0]=99;
 const badSource=C.base({...ctx,combatContext:{
  ...ctx.combatContext,skillCatalog:changed},
  attributeBuffs:{priestEnabled:true,
   remakedSkillIds:[330051001,320011001]}});
 assert.equal(badSource.auraDamage.elements.light.known,10,
  'Unknown OS enchantment vector must never trigger an invented aura boost');
});
