import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const root={};
Function('window',file('pandora-studio-hero-book.js'))(root);
Function('window',file('pandora-studio-ui-locale.js'))(root);
const book=root.PandoraStageAttributes,locale=root.PandoraUILocale;

test('full Book copy catalog includes additional static player-facing explanations',()=>{
 const pairs=book.bookEditorialDefaults;
 assert.ok(Object.keys(pairs).length>=190,'156 existing Book + 36 supplementary authored captions');
 for(const [ru,en] of [
  ['Выбранные усиления','Configured enhancements'],
  ['Сохраняются с этим героем','Saved with this character'],
  ['Бонусы ОЗ и ОМ зависят от уровня гильдии.','HP and MP passives depend on guild level.'],
  ['Эффекты песен действуют после применения в игре. Бонусы не прибавляются к билду автоматически.','Song effects apply only when activated in the game. No bonus is added to this build automatically.'],
  ['Для текущих зелий ещё нет доступных значений.','No potion values are available yet.'],
  ['Эффект при использовании. Бонус эффективности зелий к ОМ не применён.','Effect on use. Potion effectiveness is not applied to MP.'],
  ['Показывать восстановление от зелий','Show potion recovery']
 ]){
  assert.equal(pairs[ru],en);
  const key=book.bookEditorialKey(ru);
  assert.equal(locale.bookFieldKey(ru),key);
  assert.equal(locale.bookFieldKey(en),key);
  assert.equal(locale.baseText(key,'ru'),ru);
  assert.equal(locale.baseText(key,'en'),en);
 }
});

test('Book user text, numeric values and runtime item labels never become editable D1 keys',()=>{
 for(const value of ['Hero PvP 255','Sword +9','1927','172–209','ОЗ: 1900','Сияние героя','Сохранённый билд']){
  assert.equal(locale.bookFieldKey(value),null);
  assert.equal(book.bookEditorialKey(value),null);
 }
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/\.stage-potion-item,\.stage-item-row,\.stage-skill-card/);
 assert.match(source,/node\.querySelector\('button,input,select,\[role="button"\]'\)/);
});

test('Book overrides stay scoped to one exact bilingual literal with archive fallback',()=>{
 const ru='Выбранные усиления',key=book.bookEditorialKey(ru);
 const d1='guideedit.book.'+locale.fieldKey(key);
 const previous=globalThis.document;
 globalThis.document={documentElement:{lang:'ru'}};
 try{
  locale.setOverrides({[d1]:JSON.stringify({ru:'Выбранные бафы QA',en:'Selected enhancements QA'})});
  assert.equal(book.bookText(ru),'Выбранные бафы QA');
  globalThis.document.documentElement.lang='en';
  assert.equal(book.bookText(ru),'Selected enhancements QA');
  assert.equal(book.bookText('Внешний персонаж'),'Внешний персонаж');
  assert.equal(book.bookText('2000'),'2000');
  locale.setOverrides({});
  assert.equal(book.bookText(ru),'Configured enhancements');
 }finally{
  locale.setOverrides({});
  if(previous===undefined)delete globalThis.document;
  else globalThis.document=previous;
 }
});

test('issue #390: source-backed values stay separate from editable Hero Book RU/EN copy',()=>{
 const authored=[
  ['Сейчас нет активных бонусов к опыту.','No experience bonuses are currently active.'],
  ['Уровень союзника','Ally level'],['СД союзника','Ally SPR'],
  ['Песнопения союзника','Ally Hymn'],
  ['Союзник: Клирик · Исцеление','Ally: Cleric · Healing'],
  ['необходимо (учитывается автоматически)','required (automatic)'],
  ['Упрямое сердце','Stronghearted'],['шанс по данным навыка','skill-source chance'],
  ['Подробнее','More details']
 ];
 for(const [ru,en] of authored){
  const key=book.bookEditorialKey(ru),d1=key&&'guideedit.book.'+locale.fieldKey(key);
  assert.ok(key&&d1,'No stable key for '+ru);
  assert.equal(locale.bookFieldKey(ru),key);
  assert.equal(locale.bookFieldKey(en),key);
  locale.setOverrides({[d1]:JSON.stringify({ru:'Правка '+ru,en:'Edit '+en})});
  assert.equal(locale.text(key,'ru'),'Правка '+ru);
  assert.equal(locale.text(key,'en'),'Edit '+en);
  locale.setOverrides({[d1]:'{broken'});
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  locale.setOverrides({});
 }
 const source=file('pandora-studio-hero-book.js');
 assert.match(source,/class:'stage-book-live-count',text:' · '\+conditional\.length/);
 assert.match(source,/make\('strong',\{text:String\(minHealing\)\}\)/);
 assert.match(source,/make\('strong',\{text:String\(survival\.chance\)\}\)/);
 for(const runtime of ['45','Player character name','250','320007001'])
  assert.equal(locale.bookFieldKey(runtime),null);
});
