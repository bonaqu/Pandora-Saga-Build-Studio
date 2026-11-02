import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const sandbox={};
Function('window',read('pandora-os-character-calculator.js'))(sandbox);
const calc=sandbox.PandoraOSCalculator;
const view={};
Function('window','document',read('pandora-studio-hero-book.js'))(view,
 {documentElement:{lang:'ru'}});
const rowFor=(result,label)=>view.PandoraStageAttributes.summaryRows(result)
 .flatMap(group=>group.rows).find(row=>row.ru===label);

const stats={vit:30,str:50,agi:70,dex:35,spi:20,int:40};

test('Remaked regular and front accuracy share a baseline when no front-only source exists',()=>{
 const result=calc.combatPreview({stats,level:45,jobKey:'ARCHER',
  techniqueInnate:5,techniqueTrained:15,
  bonuses:{accuracy:8},honorTitle:13});
 assert.equal(result.accuracy.known,45+35+8+10+
  Math.floor(5+15/10)+10);
 assert.equal(result.frontAccuracy.known,result.accuracy.known);
 assert.equal(result.frontAccuracy.positionalBonus,0);
 assert.equal(result.frontAccuracy.verified,false);
 assert.ok(result.frontAccuracy.excluded.length);
 assert.equal(rowFor({combat:result},'Точн. спереди').value,result.accuracy.known);
 assert.equal(rowFor({combat:result},'Точн. спереди').unit,'');
});

test('ranged evasion has precisely the Honor 12 legacy modifier, not global Dodge bonus',()=>{
 const without=calc.combatPreview({stats,level:45,honorTitle:0});
 const title=calc.combatPreview({stats,level:45,honorTitle:12});
 assert.equal(without.rangedEvasion.known,0);
 assert.equal(title.rangedEvasion.known,3);
 assert.equal(title.rangedEvasion.honor,3);
 assert.equal(title.dodge.known-without.dodge.known,10);
 assert.equal(rowFor({combat:title},'Укл. дальн. атак').value,3);
 assert.equal(rowFor({combat:title},'Уклонение').value,title.dodge.known);
 assert.equal(title.rangedEvasion.verified,false);
});

test('cast-time index remains its documented Remaked base, distinct from casting speed',()=>{
 for(const dex of [0,9,10,35,70,150]){
  const result=calc.combatPreview({stats:{...stats,dex},level:45});
  assert.equal(result.castTime.known,100,'DEX='+dex);
  assert.equal(rowFor({combat:result},'Сокрщ. времени каста').value,100);
  assert.equal(rowFor({combat:result},'Сокрщ. времени каста').unit,'%');
  assert.equal(result.castingSpeed.known,100+5*Math.floor(dex/10));
  assert.equal(result.castTime.verified,false);
 }
});

test('partial or missing combat data never fabricates a completed positional output',()=>{
 for(const label of ['Точн. спереди','Укл. дальн. атак','Сокрщ. времени каста']){
  assert.equal(rowFor({hp:100},label).value,null,label);
  assert.equal(rowFor({combat:{accuracy:{known:11}}},label).value,null,label);
 }
 const heroBook=read('pandora-studio-hero-book.js');
 assert.match(heroBook,/позиционные бонусы и активные эффекты OS ещё не полностью проверены/);
 assert.match(heroBook,/Уклонение от дальних атак включает исторический бонус/);
});
