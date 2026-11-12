import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-build-comparison.css');
const hint=read('pandora-studio-guide-tooltips.js');
const root={};
vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
const locale=root.PandoraUILocale;

const cases=[
 ['libraryHintOpen','Загрузить этого героя в редактор.','Load this character in the editor.'],
 ['libraryHintOverwrite','Заменить этот билд текущим героем.','Replace this build with your current character.'],
 ['libraryHintShare','Создать ссылку для отправки билда.','Create a link to share this build.'],
 ['libraryHintDelete','Удалить билд и отозвать его ссылки.','Delete this build and revoke its links.'],
 ['libraryHintDeleteLocal','Удалить локальную копию билда.','Delete this local build copy.']
];

test('short library help is separate RU/EN D1-authored plain text with safe fallbacks',()=>{
 for(const [key,ru,en] of cases){
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  assert.equal(locale.fieldKey(key),
   'ui.label.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase()));
  const id='guideedit.book.'+locale.fieldKey(key);
  locale.setOverrides({[id]:JSON.stringify({ru:'Короткая подсказка',en:'Short hint'})});
  assert.equal(locale.text(key,'ru'),'Короткая подсказка');
  assert.equal(locale.text(key,'en'),'Short hint');
  locale.setOverrides({[id]:JSON.stringify({ru:'  ',en:'x'.repeat(91)})});
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
 }
 locale.setOverrides({});
});

test('four build actions attach shared game-style hints without native title bubbles',()=>{
 const body=app.slice(app.indexOf('function renderBuilds(root){'),app.indexOf('function newId(){'));
 assert.match(body,/window\.PandoraGuideTooltip\?\.attach\(button,libraryText\(hintKey\),\{hoverDelay:350\}\)/);
 assert.match(body,/data-build-action-hint':hintKey/);
 assert.match(body,/data-build-action-label':labelKey/);
 assert.match(body,/cardAction\('📂','libraryCardOpen','libraryHintOpen'/);
 assert.match(body,/cardAction\('↻','libraryCardOverwrite','libraryHintOverwrite'/);
 assert.match(body,/cardAction\('🔗','libraryCardShare','libraryHintShare'/);
 assert.match(body,/libraryHintDeleteLocal':'libraryHintDelete'/);
 assert.doesNotMatch(body.slice(body.indexOf('const cardAction='),body.indexOf('for(const b of builds)')),/\btitle:/);
 assert.match(hint,/popup\.textContent=node\.dataset\.guideHint\|\|text/);
 assert.match(hint,/node\.addEventListener\('pointerleave'/);
 assert.match(hint,/node\.addEventListener\('focus'/);
 assert.match(hint,/document\.addEventListener\('scroll'/);
 assert.match(css,/\.build-card-actions>\.stage-guide-label\{cursor:pointer;text-decoration:none\}/);
});

test('library search and empty states use semantic RU/EN D1 copy, not user data',()=>{
 const search=[
  ['librarySearchInputLabel','Найти сохранённый билд','Find a saved build'],
  ['librarySearchPlaceholder','Поиск по названию, классу, уровню…','Search by name, class or level…']
 ];
 for(const [key,ru,en] of search){
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  assert.ok(locale.fieldKey(key));
 }
 assert.match(app,/placeholder:libraryText\('librarySearchPlaceholder'\)/);
 assert.match(app,/'aria-label':libraryText\('librarySearchInputLabel'\)/);
 assert.match(app,/text:libraryText\('librarySearchEmpty'\)/);
 assert.match(app,/text:libraryText\('libraryEmpty'\)/);
});
