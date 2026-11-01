import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../stage-attributes.js',import.meta.url),'utf8');
function load(lang){
 const doc={documentElement:{lang}};
 const root={};
 Function('window','document',code)(root,doc);
 return root.PandoraStageAttributes;
}
test('six Hero Book chapters have exact RU/EN translations',()=>{
 const ru=load('ru'),en=load('en');
 assert.equal(ru.bookPages.length,6);
 for(const [id,label] of ru.bookPages){
  assert.equal(ru.bookText(label),label,id);
  const translation=en.bookText(label);
  assert.match(translation,/^[A-Za-z &]+$/,'Missing EN chapter label: '+id);
 }
 assert.equal(en.bookText('Итоги'),'Summary');
 assert.equal(en.bookText('Зелья и умения'),'Potions & skills');
 assert.equal(en.bookText('Гильдия и честь'),'Guild & honor');
});
test('Hero Book never fuzzy-translates official item names or player-entered text',()=>{
 const en=load('en');
 for(const label of ['Душа несчастья','Проклятый посох','Меч героя','Нестандартное имя',
  'Критический шанс +55%','Мощность 100'])assert.equal(en.bookText(label),label);
 assert.equal(en.bookText(20),20);
 assert.equal(en.bookText('ОЗ'),'HP');
 assert.equal(en.bookText('ОМ'),'MP');
});
test('Hero Book UI and aria descriptions follow document language on rerender',()=>{
 assert.match(code,/n\.textContent=bookText\(value\)/);
 assert.match(code,/document\.documentElement\?\.lang==='en'\?/);
 assert.match(code,/Hero Book\./);
 assert.match(code,/make\('span',\{text:\(document\.documentElement\?\.lang==='en'\?'HERO BOOK'/);
});

test('equipment effects, item procs and experience preview headings follow RU/EN selection',()=>{
 assert.match(code,/if\(page==='effects'\)\{\s*const english=document\.documentElement\?\.lang==='en'/);
 assert.match(code,/english\?'Special item and Soul effects'/);
 assert.match(code,/english\?'Item and Soul triggers':'Срабатывания предметов и душ'/);
 assert.match(code,/english\?'Experience gain bonus':'Бонус к получаемому опыту'/);
 assert.match(code,/english\?\(proc\.triggerEn\|\|proc\.trigger\):proc\.trigger/);
 assert.match(code,/english\?\(proc\.skillNameEn\|\|proc\.skillName\):proc\.skillName/);
 assert.match(code,/english\?'% experience':'% опыта'/);
});

test('equipment sets and consumable recovery sections switch to RU/EN without touching item IDs',()=>{
 assert.match(code,/english\?'Active equipment sets':'Активные комплекты'/);
 assert.match(code,/english\?'Potion effects':'Эффекты зелий'/);
 assert.match(code,/english\?'MP recovery items':'Предметы восстановления ОМ'/);
 assert.match(code,/english\?'HP recovery items':'Предметы восстановления ОЗ'/);
 assert.match(code,/english\?'Remove status effects':'Снятие состояний'/);
 assert.match(code,/english\?entry\.conditionsEn:entry\.conditions/);
 assert.match(code,/text:item\?\.name\|\|entry\.name/);
 assert.match(code,/english\?'Potion effectiveness':'Эффективность зелий'/);
});

test('compound combat and recovery captions translate only known UI prefixes',()=>{
 const en=load('en'),ru=load('ru');
 const input='Базовая атака 80 · Дальность 200 · Скорость 90 · +5';
 assert.equal(en.bookText(input),'Base attack 80 · Range 200 · Speed 90 · +5');
 assert.equal(ru.bookText(input),input);
 assert.equal(en.bookText('ОЗ: 100 (база 85, гильдия +10, лечение +5)'),
  'HP: 100 (base 85, guild +10, healing +5)');
 assert.equal(en.bookText('Точность: 120 (база 110, бонусы 10)'),
  'Accuracy: 120 (base 110, bonuses 10)');
 assert.equal(en.bookText('Физические состояния: 15'),'Physical conditions: 15');
 assert.equal(en.bookText('Скорость естественного восстановления'),'Natural recovery speed');
 assert.equal(en.bookText('Восстановление каждые 2 секунды'),'Recovery every 2 seconds');
 for(const value of ['Базовая атака драконов','Душа несчастья',
  'Проклятый посох','Именной предмет: 50%','Мой герой','ОЗ +500']) {
  assert.equal(en.bookText(value),value,'item/player text must not be fuzzy translated');
 }
});
