import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const host={};
Function('window',source('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;

test('guild-level automatic passives match Remaked level unlock tables',()=>{
 for(const [level,hp,regen,reduce,exp] of [
  [0,0,0,0,0],[1,0,0,0,2],[2,1,0,0,2],
  [4,2,1,0,3],[6,3,1,3,4],[8,4,2,3,5],
  [10,5,2,6,6],[12,5,2,6,6]
 ]){
  const row=calc.guildPassiveAtLevel(level);
  assert.equal(row.guildHp,hp,'HP rank at guild level '+level);
  assert.equal(row.guildMp,hp,'MP rank at guild level '+level);
  assert.equal(row.guildLifeRecovery,regen);
  assert.equal(row.guildManaRecovery,regen);
  assert.equal(row.physicalReduction,reduce);
  assert.equal(row.magicReduction,reduce);
  assert.equal(row.experience,exp);
 }
 assert.equal(calc.guildPassiveAtLevel(13),null);
 assert.equal(calc.guildPassiveAtLevel(-1),null);
 assert.equal(calc.guildPassiveAtLevel(2.5),null);
});

test('external priest SD 134, blessing 90, hymn 30 use verified original numeric preview',()=>{
 const buffs=calc.legacyBuffPreview({spi:134,blessing:90,hymn:30});
 assert.ok(buffs.gratia.value>0);
 assert.ok(buffs.lapisMedio.value>5);
 assert.ok(buffs.minstrelSong.value>5);
 assert.equal(buffs.gratia.value,5+Math.floor(Math.floor(134/(100/6))*1.9));
 assert.equal(buffs.lapisMedio.value,5+Math.floor(134/(100/3))+Math.floor(90/(100/4)));
});

test('priest and guild controls persist and combat applies only manually selected supported buffs',()=>{
 const app=source('app.js'),book=source('stage-attributes.js'),engine=source('os-calculator.js');
 for(const key of ['priestSpi','priestBlessing','priestHymn','guildLevel','priestEnabled',
  'priestGratia','priestLapisMedio']){
  assert.ok(app.includes(key),'Missing stored setting '+key);
  assert.ok(book.includes(key),'Missing UI setting '+key);
 }
 assert.match(app,/guildPassiveAtLevel\(guildLevel\)/);
 assert.match(app,/effectiveGuildBuffs\.vitals/);
 assert.match(app,/effectiveGuildBuffs\.attributes/);
 assert.match(engine,/const priestEffects=priestActive/);
 assert.match(engine,/priestBonus:priestSpeed/);
 assert.match(engine,/priestBonus:priestDefense/);
 assert.match(book,/class:'stage-guild-level-effects'/);
 assert.match(book,/Ручной выбор усилений/);
});

test('current live OS drop slot variants are preserved as source-specific annotations',()=>{
 const drops=JSON.parse(source('data/os/drops.json'));
 for(const id of ['43106','43650','43730','43731','43732']){
  assert.equal(drops[id].d.find(x=>x.i===11095)?.slotAdd,1);
 }
 assert.match(source('wiki-data.js'),/slotAdd:r\.slotAdd\?\?0/);
 assert.match(source('app.js'),/Гнёзда \+/);
});

// Prerequisites from current OS skills 320007001 and 320008001.
test('external priest buffs require correct Blessing mastery and valid numbers',()=>{
 const engine=source('os-calculator.js'),book=source('stage-attributes.js');
 const skills=JSON.parse(source('data/os/skills.json'));
 assert.equal(skills['320007001'].name,'Знак атаки');
 assert.equal(skills['320008001'].name,'Знак защиты');
 assert.equal(skills['320007001'].reqs.find(x=>x.branch==='blessing').amount,8);
 assert.equal(skills['320008001'].reqs.find(x=>x.branch==='blessing').amount,12);
 assert.match(engine,/priestValid&&priest\.blessing>=8&&attributeBuffs\?\.priestGratia/);
 assert.match(engine,/priestValid&&priest\.blessing>=12&&attributeBuffs\?\.priestLapisMedio/);
 assert.match(engine,/Number\.isSafeInteger\(n\)&&n>=0&&n<=500/);
 assert.match(book,/Number\(buffs\.priestBlessing\)>=8/);
 assert.match(book,/Number\(buffs\.priestBlessing\)>=12/);
});
test('Hero Book buff names use Remaked approved RU identities',()=>{
 const book=source('stage-attributes.js');
 for(const name of ['Знак атаки','Знак защиты','Божественная защита',
  'Священное оружие','Темная аура','Чары усиления','Песнь поэта','Песнь чар'])
  assert.ok(book.includes(name),'Missing approved Remaked name: '+name);
 assert.match(book,/'Песнь поэта': "Minstrel's Song"/);
 assert.match(book,/'Песнь чар': "Sage's Song"/);
 assert.match(book,/priestSpi','priestBlessing','priestHymn','priestEnabled'/);
});
