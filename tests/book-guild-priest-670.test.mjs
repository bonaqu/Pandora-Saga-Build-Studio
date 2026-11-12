import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
const host={};
Function('window',read('pandora-studio-guild-skills.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const os=JSON.parse(read('data/os/skills.json'));
const guild=host.PandoraGuildSkillSource,calculator=host.PandoraOSCalculator;

test('guild source has 7 passive and 3 active original skill families',()=>{
 assert.equal(guild.length,11);
 assert.deepEqual(guild.slice(1,8).map(s=>s.nameRu),[
  'Сила гильдии','Дух гильдии','Восстановление силы',
  'Восстановление духа','Физическая устойчивость',
  'Магическая устойчивость','Опыт']);
 assert.deepEqual(guild.slice(8).map(s=>s.nameRu),[
  'Магистр исцеления','Магистр битвы','Магистр магии']);
 for(const level of [1,2,4,6,10,12]){
  assert.ok(guild[0].levels[level-1].ru.includes('пассивных навыков'));
 }
 assert.match(guild[0].levels[9].ru,/Физическая устойчивость/);
 assert.match(guild[0].levels[9].ru,/Магическая устойчивость/);
 assert.equal(os['600000001'].name,'Сила гильдии I');
});
test('level 10 has 7 selected passives rather than one configured choice',()=>{
 const start=book.indexOf(' const guildSelected=Number(buffs.guildLevel)>0;');
 const end=book.indexOf(' const status=make(',start);
 assert.ok(start>=0&&end>start);
 const count=Function('buffs','vitalsBuffs','remakedBuffRows',
  book.slice(start,end)+'\nreturn configured;');
 const selected=(level)=>count({guildLevel:level,priestEnabled:false},{},[]);
 assert.deepEqual([0,1,2,4,6,10,12].map(selected),[0,1,3,5,7,7,7]);
 assert.equal(count({guildLevel:10,priestEnabled:true,
  priestBlessing:90,priestGratia:true,priestLapisMedio:true}, {},[]),9);
});
test('ally effects and priest-linked selections have no duplicate controls',()=>{
 assert.doesNotMatch(book,/section\('ОЗ и ОМ','Vitals'\)/);
 assert.match(book,/toggle\(party,'Знак жизни','lifeSign'/);
 assert.match(book,/\[320012001,'priestEncouragement',61\]/);
 assert.match(book,/\[320007001,'priestGratia',8\]/);
 assert.match(book,/\[320008001,'priestLapisMedio',12\]/);
 for(const id of [320011001,330051001,340001001,340004001])
  assert.match(book,new RegExp(String(id)));
 assert.match(book,/resistanceSkillChoices\.filter\(s=>s\.id!==330004001\)/);
 assert.match(book,/collapseBookSections\(body,chosen\)/);
 assert.doesNotMatch(book,/Учтено в результатах/);
});
test('guild-level physical and magical resistance and experience flow to results',()=>{
 const guildPart=calculator.guildPassiveAtLevel(10);
 assert.equal(guildPart.physicalReduction,6);
 assert.equal(guildPart.magicReduction,6);
 assert.equal(guildPart.experience,6);
 const engine=read('pandora-os-character-calculator.js');
 assert.match(engine,/resistances\.mitigation\.physical-=guildPhysical/);
 assert.match(engine,/resistances\.mitigation\.magic-=guildMagical/);
 assert.match(engine,/experienceBonus\.entries\.push/);
 assert.match(app,/effectiveGuildBuffs\.attributes/);
});
