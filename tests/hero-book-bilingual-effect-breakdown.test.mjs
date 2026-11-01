import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const book=read('stage-attributes.js'),calc=read('os-calculator.js');
function load(lang){
 const root={};Function('window','document',book)(root,{documentElement:{lang}});
 return root.PandoraStageAttributes;
}
test('gemstone elemental rows and explanatory text have explicit RU/EN captions',()=>{
 for(const text of [
  "english?'Weapon aura base':'Основа ауры оружия'",
  "english?'Total aura':'Итог ауры'",
  "english?'Weapon magic enhancement':'Магическое усиление оружия'",
  "english?'Armor resistance':'Сопротивление от брони'",
  "english?'Status effect chance':'Шанс наложения состояния'",
  "english?'Rainbow gems: ':'Радужные самоцветы: '",
  "fire:'Fire',ice:'Ice',lightning:'Lightning',poison:'Poison'",
  "fire:'Огонь',ice:'Лёд',lightning:'Молния',poison:'Яд'",
  "Gem resistances are included in defense.",
  "Сопротивления от самоцветов включены в защиту."
 ])assert.ok(book.includes(text),text);
 assert.match(book,/const labels=english\?/);
});
test('healing and mana breakdowns retain numeric formulas but translate all displayed headings',()=>{
 for(const text of [
  "english?'Healing-skill effectiveness':'Эффективность лечащих навыков'",
  "english?'Effectiveness: ':'Эффективность: '",
  "english?'% (base 100%, honor +':'% (основа 100%, честь +'",
  "english?'%, equipment/Souls +':'%, предметы/души +'",
  "english?'MP cost':'Расход ОМ'",
  "english?'Remaining cost index: ':'Индекс остаточного расхода: '",
  "english?'INT base: ':'База от ИНТ: '",
  "english?'Racial passive: −':'Расовая способность: −'",
  "english?'Equipment and Souls: −':'Снаряжение и души: −'",
  "Not all active skill conditions are included.",
  "This preview excludes active effects"
 ])assert.ok(book.includes(text),text);
 const ctx={};Function('window',calc)(ctx);
 assert.equal(typeof ctx.PandoraOSCalculator.potionRecovery,'function');
});
test('potions retain base-vs-additive percentage semantics in both languages',()=>{
 for(const text of [
  "english?'Potion effects':'Действие зелий'",
  "english?'Stamina (base effectiveness)':'Выносливость (базовая эффективность)'",
  "english?'Herbalist (human racial passive)':'Знахарство (расовая способность человека)'",
  "english?'Honor title':'Титул чести'",
  "english?'Equipment and Souls':'Экипировка и души'",
  "modifiers.potion.base,true",
  "modifiers.potion.racial,false",
  "modifiers.potion.mastery,false",
  "modifiers.potion.equipment,false",
  "for(const [name,value,isBase] of parts)",
  "(isBase?'':value>0?'+':'')+value+'%'"
 ])assert.ok(book.includes(text),text);
 assert.ok(!book.includes("name.startsWith('Выносливость')"),
  'sign must not depend on an untranslated Russian label');
});
test('unknown official names and user text remain unchanged across locales',()=>{
 const en=load('en'),ru=load('ru');
 for(const text of ['Душа несчастья','Великий клинок','Custom name 77',
  'Character ✦ 1','Проклятая броня']) {
  assert.equal(en.bookText(text),text);
  assert.equal(ru.bookText(text),text);
 }
 assert.equal(en.bookText('Самоцветы'),'Gems');
 assert.equal(ru.bookText('Самоцветы'),'Самоцветы');
 assert.equal(en.bookText('Расход ОМ'),'MP cost');
});
