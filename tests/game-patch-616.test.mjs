import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const json=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
const skills=json('skills'),items=json('items'),trades=json('trades');
const tables=json('tables'),classes=json('classes'),monsters=json('monsters'),chests=json('chests');

test('November 13 patch level 46-50 EXP and points are retained exactly',()=>{
 assert.equal(tables.levelCap,50);
 for(const [level,exp,stats] of [[46,13306266,14],[47,15967519,14],
  [48,19161023,14],[49,22993228,14],[50,27591874,16]]){
  const row=tables.exp[String(level-1)];
  assert.equal(row.expReq,exp);
  assert.equal(row.ability,stats);
  assert.equal(row.skill,3);
 }
 assert.equal(classes.CONJURER.branchCaps.warding,10);
});

test('confirmed Conjurer level-50 source skill replacements keep their lineage and casts',()=>{
 for(const [baseId,advancedId,oldCast,newCast,oldCool,newCool] of [
  [420004001,420004002,5,1,1.5,1.5],
  [420005001,420005002,3.5,2,10,12],
  [420007001,420007101,7,4,45,45]
 ]){
  const base=skills[baseId],advanced=skills[advancedId];
  assert.equal(advanced.prereq,baseId);
  assert.equal(advanced.charLevel,50);
  assert.equal(advanced.name,base.name);
  assert.equal(base.cast,oldCast);assert.equal(advanced.cast,newCast);
  assert.equal(base.cooldown,oldCool);assert.equal(advanced.cooldown,newCool);
  assert.equal(advanced.classes.CONJURER,1);
 }
 assert.equal(skills[420004002].funcs.some(x=>x.ep==='EP_ALL_RESISTANCE_CONST'),true);
 assert.equal(skills[320006001].skillType,'ALLY');
 assert.ok(skills[340001001].funcs.some(f=>f.ep==='EP_UNABLE_CAST'));
 assert.ok(skills[340003001].funcs.some(f=>f.ep==='EP_UNABLE_CAST'));
 assert.ok(skills[340004001].funcs.some(f=>f.ep==='EP_UNABLE_CAST'));
 assert.equal(skills[440011001].skillType,'ENEMY');
 assert.ok(skills[440009002].funcs.some(f=>f.ep==='EP_DESTINED_KNOCKBACK'));
});

test('all 14 fire weapons are sold by the three permanent medal traders with actual ingredients',()=>{
 const ids=[252,452,652,852,1052,1252,1493,1652,1862,2042,2262,2442,2652,2852];
 const fire=trades.trades.filter(row=>ids.includes(row.i));
 assert.equal(fire.length,14);
 for(const id of ids)assert.equal(typeof items[String(id)].name,'string');
 for(const recipe of fire){
  assert.deepEqual(recipe.npc,[131,232,331]);
  assert.ok(recipe.mats.some(m=>m.i===80098&&m.n===200));
  assert.equal(recipe.mats.length,2);
  assert.ok([80092,80093,80095].some(id=>
   recipe.mats.some(m=>m.i===id&&m.n===1)));
 }
 assert.deepEqual(['131','232','331'].map(id=>trades.npcs[id].name),
  ['Огун VIII','Содан','Саймон']);
});

test('permanent armor exchange appears in all three capitals and includes Pumpkin Cloak',()=>{
 const vendor=trades.npcs['423'],pumpkin=trades.trades.filter(row=>row.i===18018);
 assert.equal(vendor.name,'Обмен доспехов');
 assert.deepEqual([...vendor.maps].sort(),[1002001,1003001,1004001]);
 assert.equal(pumpkin.length,1);
 assert.deepEqual(pumpkin[0].npc,[423]);
 assert.equal(pumpkin[0].gold,100000);
 assert.deepEqual(pumpkin[0].mats,[{i:80098,n:300}]);
 assert.equal(items['18018'].name,'Тыквенный плащ');
});

test('ancient Muldia bosses and King chest are retained in the current game catalog',()=>{
 assert.deepEqual([95120,95121,95122].map(id=>monsters[id].name),
  ['Древний исполин','Древний рукокрыл','Древняя гончая']);
 for(const id of [51009,51017,51025,51033]){
  const commander=chests.boxes.find(x=>x.i===id);
  assert.ok(commander,'missing lvl50 commander box '+id);
  assert.deepEqual(commander.rolls[0],[{i:65006,n:7,p:100}]);
  assert.ok(!commander.rolls.some(group=>group.some(row=>
   row.i===80098&&row.n===100)));
 }
 const king=chests.boxes.find(x=>x.i===51036);
 assert.ok(king);
 assert.equal(king.rolls[0].length,127);
});

test('Honor includes exact permanent PvP rewards, weekly limits and Moscow schedule',()=>{
 const root={};runInNewContext(readFileSync(
  new URL('../pandora-studio-honor-guide.js',import.meta.url),'utf8'),{window:root});
 const article=root.PandoraHonorGuide.article({});
 const pvp=article.pvpVictories;
 assert.equal(pvp.sourceDate,'2026-11-13');
 assert.deepEqual(Array.from(pvp.daily.map(x=>x.wins)),[50,100,200,300]);
 assert.deepEqual(Array.from(pvp.weekly.map(x=>x.limit)),[35,7,3]);
 assert.deepEqual(Array.from(pvp.hunts.map(x=>x.hours)),
  ['05:00–07:00','16:00–18:00','20:00–22:00']);
 assert.ok(article.overview.pvpWeeklyRu.includes('00:00 МСК'));
 assert.ok(article.overview.pvpIntroRu.includes('той же карте'));
 assert.ok(article.overview.pvpHuntRu.includes('2 победы и 2 жетона'));
 assert.ok(root.PandoraHonorGuide.validOverride('honor.overview',
  JSON.stringify({pvpDailyRu:'Исправленный текст'})));
 const source=readFileSync(new URL('../pandora-studio-honor-view.js',import.meta.url),'utf8');
 assert.match(source,/\['victories','Победы в PvP','PvP Victories'/);
 assert.match(source,/const victories=section\('victories'/);
 assert.match(source,/event\.weekly\.map/);
 assert.doesNotMatch(source,/смена класса|изменение внешности|лидер гильдии/i);
});
