import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js'),calc=read('pandora-os-character-calculator.js');
function load(lang){
 const root={};Function('window','document',book)(root,{documentElement:{lang}});
 return root.PandoraStageAttributes;
}
test('gemstones preserve named final aura and independent magical effects in RU/EN',()=>{
 for(const term of [
  "english?'Total aura':'Итог ауры'",
  "english?'Weapon magic enhancement':'Магическое усиление оружия'",
  "english?'Armor resistance':'Сопротивление от брони'",
  "english?'Status effect chance':'Шанс наложения состояния'",
  "english?'Rainbow gems: ':'Радужные самоцветы: '",
  "fire:'Fire',ice:'Ice',lightning:'Lightning',poison:'Poison'",
  "fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд'"
 ])assert.ok(book.replace(/\s+/g,'').includes(term.replace(/\s+/g,'')),term);
 assert.doesNotMatch(book,/show\(english\?'Weapon aura base'/);
});
test('potion, skill and mana results remain calculated but no origin equation appears in UI',()=>{
 const root={};Function('window',calc)(root);
 assert.equal(typeof root.PandoraOSCalculator.potionRecovery,'function');
 for(const term of [
  "row('Леч. зельями','Potion healing',calc?.potion?.percent,'%')",
  "row('Леч. умениями','Skill healing',calc?.healingSkill?.percent,'%')",
  "row('Расход ОМ','MP cost',c.manaCost?.remaining,'%')",
  "english?'Healing skills':'Лечащие умения'",
  "english?'Potion effectiveness':'Эффективность зелий'"
 ])assert.ok(book.includes(term),term);
 assert.doesNotMatch(book,/Remaining cost index: |База от ИНТ: |База от ВЫН: /);
});
test('unknown official names and custom user text remain unchanged',()=>{
 const en=load('en'),ru=load('ru');
 for(const text of ['Душа несчастья','Великий клинок','Custom name 77',
  'Character ✦ 1','Проклятая броня']){
  assert.equal(en.bookText(text),text);
  assert.equal(ru.bookText(text),text);
 }
 assert.equal(en.bookText('Самоцветы'),'Gems');
 assert.equal(ru.bookText('Самоцветы'),'Самоцветы');
 assert.equal(en.bookText('Расход ОМ'),'MP cost');
});
