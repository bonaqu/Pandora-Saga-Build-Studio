import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:50,str:70,agi:65,dex:70,spi:80,int:45};
const combat={attack:{walkingBase:200},defense:{directRaw:90},accuracy:{base:140},dodge:{base:120}};
const preview=(job,masteries,weaponKind,catalog=skills,heroStats=stats,level=50)=>
 C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchMasteries:masteries,branchCaps:classes[job].branchCaps,
  stats:heroStats,combat,weaponKind});
const by=(o,id)=>o.offense.find(x=>x.id===id);
const effect=(r,ep)=>r?.coefficientModels?.find(x=>x.ep===ep)?.amount;

test('OS source coefficients are visible for crossbow duplicate attack and unarmed follow-up',()=>{
 const double=by(preview('PREDATOR',{archery:40},'CROSSBOW'),213703001);
 assert.equal(double?.amount,null,'Do not invent final crossbow damage');
 assert.equal(double?.available,true);
 assert.equal(effect(double,'EP_DOUBLE_MISSILE'),-85+Math.floor(70*.20)+Math.floor(40*.30));
 assert.equal(effect(double,'EP_ATTACKRANGE_CONST'),100+Math.floor(40*9));
 assert.equal(effect(double,'EP_ATTACKCARRY_CONST'),100+Math.floor(40*9));
 const wave=by(preview('ASSASSIN',{assassin:60},'2H_TRUMP_WEAPON'),233200101);
 assert.equal(wave?.amount,null,'Do not treat second hit coefficient as total attack');
 assert.equal(wave?.available,true);
 assert.equal(effect(wave,'EP_INCREASE_ATTACK'),-100+Math.floor(60*.45));
});

test('250 varying STR/mastery conditions compute each component independently and never change source',()=>{
 const prior=JSON.stringify(skills);
 let count=0;
 for(let rank=0;rank<50;rank++)for(const strength of [1,51,70,100,150]){
  const current={...stats,str:strength};
  const skill=by(preview('PREDATOR',{archery:rank},'CROSSBOW',skills,current),213703001);
  const wave=by(preview('ASSASSIN',{assassin:rank},'2H_TRUMP_WEAPON',skills,current),233200101);
  assert.equal(effect(skill,'EP_DOUBLE_MISSILE'),
   -85+Math.floor(strength*.20)+Math.floor(rank*.30));
  assert.equal(effect(skill,'EP_ATTACKRANGE_CONST'),100+Math.floor(rank*9));
  assert.equal(effect(skill,'EP_ATTACKCARRY_CONST'),100+Math.floor(rank*9));
  assert.equal(effect(wave,'EP_INCREASE_ATTACK'),-100+Math.floor(rank*.45));
  count++;
 }
 assert.equal(count,250);
 assert.equal(JSON.stringify(skills),prior);
});

test('invalid source, branch cap and equip requirements cannot create a damage estimate',()=>{
 const bad=structuredClone(skills);
 bad['213703001'].funcs.find(x=>x.ep==='EP_DOUBLE_MISSILE').fv1[2]=90;
 bad['233200101'].funcs.find(x=>x.ep==='EP_INCREASE_ATTACK').fv2[3]=1;
 assert.equal(by(preview('PREDATOR',{archery:40},'CROSSBOW',bad),213703001),undefined);
 assert.equal(by(preview('ASSASSIN',{assassin:40},'2H_TRUMP_WEAPON',bad),233200101),undefined);
 assert.ok(by(preview('PREDATOR',{archery:40},'CROSSBOW',bad),220001001),
  'Corrupt projectile data must not suppress an unrelated Poison skill');
 const impossible=by(preview('PREDATOR',{archery:75},'CROSSBOW'),213703001);
 assert.equal(impossible?.coefficientModels.length,0);
 assert.equal(impossible?.available,false);
 assert.match(impossible?.reason||'',/Мастерство превышает предел профессии/);
 assert.equal(by(preview('PREDATOR',{archery:40},'BOW'),213703001)?.available,false);
 assert.equal(by(preview('ASSASSIN',{assassin:40},'BARE_HAND'),233200101)?.available,false);
 assert.equal(by(preview('PREDATOR',{archery:40},'CROSSBOW',skills,stats,49),213703001)?.available,false);
});
