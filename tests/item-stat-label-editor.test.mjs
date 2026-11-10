import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);
runInNewContext(read('pandora-studio-item-presentation.js'),root);
const item=root.PandoraItemPresentation,guide=root.PandoraHonorGuide;

test('all item stat captions have independent D1-editable RU and EN values',()=>{
 const defaults={
  kind:['Тип','Type'],level:['Уровень','Level'],W:['Атака','Attack'],
  PEN:['Пробитие','Penetration'],AC:['Защита','Defense'],
  atkspeed:['Скорость атаки','Attack speed'],range:['Дальность','Range'],
  soulslot:['Слоты душ','Soul slots']
 };
 for(const [key,[ru,en]] of Object.entries(defaults)){
  assert.equal(item.fieldLabel(key,'ru'),ru);
  assert.equal(item.fieldLabel(key,'en'),en);
  assert.equal(guide.validOverride('book.'+item.fieldHintKey(key),
   JSON.stringify({ru:'Иное название',en:'New label'})),true);
 }
 assert.equal(item.fieldLabel('__unknown','ru'),null);
});

test('renaming the weapon PEN caption preserves the hint and numerical PEN',()=>{
 const field='wiki.item-field.pen',key='guideedit.book.'+field;
 const overrides={[key]:JSON.stringify({
  ru:'Потенциал атаки',en:'Attack potential',
  hintRu:'Подсказка изменена отдельно.',hintEn:'Separate hint.'
 })};
 const weapon={id:1482,W:90,PEN:80};
 assert.equal(item.fieldLabel('PEN','ru',overrides),'Потенциал атаки');
 assert.equal(item.fieldLabel('PEN','en',overrides),'Attack potential');
 assert.equal(item.fieldHint('PEN','ru',overrides),'Подсказка изменена отдельно.');
 assert.equal(item.fieldHint('PEN','en',overrides),'Separate hint.');
 assert.deepEqual(weapon,{id:1482,W:90,PEN:80});
 assert.equal(item.fieldLabel('PEN','ru',{}),'Пробитие');
 assert.equal(item.fieldHint('PEN','ru',{}).includes('разброс'),true);
});

test('summary uses native independent details groups and no redundant heading',()=>{
 const source=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-theme.css');
 assert.match(source,/const collapsedSummaryGroups=new Set\(\)/);
 assert.match(source,/const section=make\('details',\{class:'stage-result-section'/);
 assert.match(source,/const heading=make\('summary',\{class:'stage-result-section-head'/);
 assert.match(source,/section\.open=!collapsedSummaryGroups\.has\(groupIndex\)/);
 assert.match(source,/section\.addEventListener\('toggle'/);
 assert.doesNotMatch(source,/make\('div',\{class:'stage-result-intro'/);
 assert.match(css,/\.stage-result-section-head:focus-visible/);
 assert.match(css,/\.stage-result-section\[open\] \.stage-result-chevron/);
});
