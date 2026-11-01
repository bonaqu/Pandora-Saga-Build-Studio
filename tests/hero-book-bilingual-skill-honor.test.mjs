import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skillSrc=read('skill-results.js'),book=read('stage-attributes.js'),app=read('app.js');
const skillCtx={};Function('window',skillSrc)(skillCtx);
const create=skillCtx.PandoraSkillResults.create;
const source={
 '100051001':{id:100051001,name:'Lunge',desc:'Rush forward',charLevel:18,
  learnable:true,classes:{WARRIOR:1},mana:4,cast:1.5,cooldown:10,reqs:[],funcs:[]},
 '100054001':{id:100054001,name:'Concentration',desc:'Improves accuracy',
  charLevel:0,learnable:true,classes:{WARRIOR:1},mana:8,cast:0,cooldown:30,
  reqs:[{branch:'slash',amount:26}],funcs:[]}
};

test('existing English skill names are passed through and actual mastery requirements are localized',()=>{
 const en=create({catalog:source,jobKey:'WARRIOR',level:10,innate:{slash:5},
  trained:{slash:12},lang:'en',branchLabels:{slash:'Slashing'}});
 assert.equal(en.total,2);
 const lunge=en.records.find(x=>x.id==='100051001');
 const focus=en.records.find(x=>x.id==='100054001');
 assert.equal(lunge.name,'Lunge');
 assert.equal(lunge.desc,'Rush forward');
 assert.equal(lunge.requirement,'Level 18');
 assert.equal(focus.requirement,'Branch Slashing 17/26');
 assert.equal(en.available,0);
 assert.equal(focus.confirmedDamage,false);
 assert.deepEqual([focus.mana,focus.cast,focus.cooldown],[8,0,30]);
});

test('Russian skill requirements are retained by default and damaged sources do not get translated by resemblance',()=>{
 const ru=create({catalog:source,jobKey:'WARRIOR',level:10,innate:{slash:5},
  trained:{slash:12},branchLabels:{slash:'Рубящее оружие'}});
 assert.equal(ru.records.find(x=>x.id==='100051001').requirement,'Уровень 18');
 assert.equal(ru.records.find(x=>x.id==='100054001').requirement,
  'Ветка Рубящее оружие 17/26');
 const unnamed=create({catalog:{'2':{id:2,name:'Личный навык 999',learnable:true,
   classes:{WARRIOR:1},reqs:[{branch:'invented',amount:10}]}},
   jobKey:'WARRIOR',lang:'en'});
 assert.equal(unnamed.records[0].name,'Личный навык 999');
 assert.equal(unnamed.records[0].requirement,'Branch invented 0/10');
});

test('selected game language is forwarded into the inspector without modifying progression',()=>{
 assert.match(app,/catalog:skillMap,jobKey:cls,level:state.level,innate,lang,/);
 assert.match(app,/branchLabels:catalog.meta\?\.branchLabels\|\|\{\}/);
 assert.match(app,/Requires '\+req.amount\+' '\+branchName\+' mastery/);
 assert.doesNotMatch(app,/Нужно 26 очков мастерства рубящего оружия/);
 assert.match(app,/const reason=unavailableReason\(ability\)/);
 assert.match(app,/const reason=unavailableReason\(ability,false\)/);
 assert.match(app,/bookEn\?' movement speed'/);
});

test('skill browser in both languages uses exact localized descriptions and avoids Russian-only helper labels',()=>{
 assert.match(book,/english\?'Find skill by name':'Поиск навыка по названию'/);
 assert.match(book,/english\?'Search skills…':'Найти навык…'/);
 assert.match(book,/english\?'Basic requirements met':'По базовым условиям доступен'/);
 assert.match(book,/english\?'Requirements not met':'Требования не выполнены'/);
 assert.match(book,/english\?'MP ':'ОМ '/);
 assert.match(book,/english\?' · Cast ':' · Применение '/);
 assert.match(book,/english\?' s · Cooldown ':' с · Откат '/);
 assert.match(book,/english\?'No skills match this search.':'Для текущего поиска навыки не найдены.'/);
 assert.match(book,/english\?'Found '\+filtered.length/);
 assert.match(book,/\.toLocaleLowerCase\(locale\)/);
});

test('honor dropdown and reward text use approved English names without altering stored honor IDs',()=>{
 const root={};Function('window',read('os-calculator.js'))(root);
 assert.deepEqual(root.PandoraOSCalculator.honorTitles.map(x=>x.id),
  Array.from({length:14},(_,i)=>i));
 assert.equal(root.PandoraOSCalculator.honorTitles[1].en,'Curiosity to strength');
 assert.match(book,/honorTitles.map\(x=>\[x.id,english\?x.en:x.ru\]\)/);
 assert.match(book,/Honor title: '\+honor.en:'Титул чести: '\+honor.ru/);
 for(const name of ['allAttributes','healingSkills','attackPercent','fireMagic',
  'castingResist','incomingCriticalDamage','rangedDodge','frontAttack']){
  assert.match(book,new RegExp(name+":'[^']+'"),name);
 }
 assert.match(book,/honorEnglishLabels\[key\]:labels\[key\]\|\|key/);
});
