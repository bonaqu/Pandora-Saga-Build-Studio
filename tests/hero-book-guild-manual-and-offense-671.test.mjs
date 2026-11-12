import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const guild=read('pandora-studio-hero-book.js'),engine=read('pandora-os-character-calculator.js'),app=read('pandora-studio-app.js');
const skills=JSON.parse(read('data/os/skills.json'));

test('all seven independently chosen passives use actual OS IDs and human-readable ranks',()=>{
 for(const [key,id] of [
  ['guildHp',600000001],['guildMp',600000011],
  ['guildLifeRecovery',600000021],['guildManaRecovery',600000031],
  ['guildPhysicalReduction',600000071],['guildMagicReduction',600000081],
  ['guildExperience',600000061]]){
  assert.match(guild,new RegExp("'"+key+"'[^\\n]*"+id));
  assert.ok(skills[String(id)]?.name,'Missing source skill '+key);
 }
 assert.match(guild,/gameTerms\.skills\?\.\[String\(firstSkillId\+rank-1\)\]/);
 assert.match(guild,/guildChoice\(passiveGroup,key,idx,id,vital\)/);
 assert.match(guild,/skillIconForId\(id\)\|\|skillIconForId\(spec\.id\)/);
 const css=read('pandora-studio-hero-book-additions.css');
 assert.match(css,/width:30px!important;height:30px!important/);
 assert.match(css,/stage-guild-passive-row/);
});
test('manual effect ranks are validated, preserved and included in actual calculations',()=>{
 for(const [key,maximum] of [['guildPhysicalReduction',3],['guildMagicReduction',3],['guildExperience',8]]){
  assert.match(app,new RegExp("'"+key+"'"));
  assert.match(guild,new RegExp(key));
 }
 assert.match(engine,/guildManualRate\('guildPhysicalReduction',\[0,3,6,10\]\)/);
 assert.match(engine,/guildManualRate\('guildMagicReduction',\[0,3,6,10\]\)/);
 assert.match(engine,/guildManualRate\('guildExperience',\[0,2,3,4,5,6,7,8,10\]\)/);
 assert.match(engine,/guildLevel>0\?\(guildPassives\?\.physicalReduction\|\|0\)/);
 assert.match(engine,/resistances\.mitigation\.magic-=guildMagical/);
 assert.match(engine,/experienceBonus\.entries\.push/);
 const start=guild.indexOf(' const guildSelected=Number(buffs.guildLevel)>0;');
 const end=guild.indexOf(' const status=make(',start);
 const count=Function('buffs','vitalsBuffs','remakedBuffRows',
  guild.slice(start,end)+'\nreturn configured;');
 assert.equal(count({guildPhysicalReduction:2,guildMagicReduction:1,guildExperience:6},{},[]),3);
 assert.equal(count({guildLevel:10,guildPhysicalReduction:3,guildExperience:8},{},[]),7,
  'Auto guild selection replaces manual passives, without double counting');
});
test('priest buff text remains legible when externally disabled and old ally signs are moved',()=>{
 assert.match(guild,/toggle\(priest,row\?\.name\|\|key,key/);
 assert.match(guild,/externalPriest:true/);
 assert.match(guild,/if\(skill&&!allowed&&!skill\.externalPriest\)/);
 assert.match(guild,/if\(skill\?\.summary\)/);
 for(const id of ['320003001','320011001','330051001','340001001','340003001','340004001'])
  assert.ok(guild.includes(id));
 assert.doesNotMatch(guild,/Учтено в результатах/);
});
test('offensive skills use existing calculated effects, not made-up per-hit formula',()=>{
 assert.match(guild,/class:'stage-attribute-row stage-attacking-skills'/);
 assert.match(guild,/combat\.critical\?\.coldBlood/);
 assert.match(guild,/combat\.accuracy\?\.thirdEye/);
 assert.match(guild,/const hitPassive=combat\.incredibleStrength/);
 assert.match(guild,/Точная прибавка ещё не подтверждена/);
 assert.match(guild,/combat\.attack\?\.racialBonus-racial\.flat/);
 assert.match(guild,/Эффекты стихийных оружий/);
});
