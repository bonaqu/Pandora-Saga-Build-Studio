import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skillSrc=read('pandora-studio-skill-results.js'),book=read('pandora-studio-hero-book.js'),app=read('pandora-studio-app.js');
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
 assert.doesNotMatch(app,/PandoraSkillResults\.create\(/);
 assert.match(app,/Requires '\+req.amount\+' '\+branchName\+' mastery/);
 assert.doesNotMatch(app,/Нужно 26 очков мастерства рубящего оружия/);
 assert.match(app,/const reason=unavailableReason\(ability\)/);
 assert.match(app,/const reason=availability\[setting\]\?null/);
 assert.match(app,/skillCatalog:skillMap/);
 assert.match(app,/bookEn\?' movement speed'/);
});

test('Book has six localized chapters without repeating Path skill search',()=>{
 const host={};Function('window','document',book)(host,{documentElement:{lang:'en'}});
 const view=host.PandoraStageAttributes;
 assert.deepEqual(view.bookPages.map(x=>x[0]),['summary','attack','defense','buffs','effects','recovery']);
 assert.equal(view.bookText('Эффекты умений'),'Skill effects');
 assert.equal(view.bookText('Эффекты зелий'),'Potion effects');
 assert.doesNotMatch(book,/renderSkillInspector|stage-skill-inspector/);
});

test('honor dropdown still uses localized title names while results show only totals',()=>{
 const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
 const titles=root.PandoraOSCalculator.honorTitles;
 assert.deepEqual(titles.map(x=>x.id),Array.from({length:14},(_,i)=>i));
 assert.equal(titles[1].en,'Curiosity to strength');
 assert.match(book,/honorTitles.map\(x=>\[x.id,english\?x.en:x.ru\]\)/);
 assert.match(book,/row\('ОЗ','HP',calc\?\.hp\)/);
 assert.match(book,/row\('Защита','Defense',c.defense\?\.known\)/);
 assert.doesNotMatch(book,/honorEnglishLabels\[key\]/);
});
