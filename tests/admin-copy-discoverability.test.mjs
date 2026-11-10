import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-ui-locale.js'),root);
runInNewContext(read('pandora-studio-honor-guide.js'),root);
const locale=root.PandoraUILocale,guide=root.PandoraHonorGuide;

test('fixed notices have safe RU/EN D1 copy keys, with no server/user inputs',()=>{
 const ids=['statusBuildDeleted','statusConflictingBuilds','statusLibraryFull',
  'statusDeleteFailed','statusLocalDelete','statusDeleteRetryFailed',
  'statusSaveFailed','statusImportsQueued','statusGuestHero',
  'statusBuildOpenStorage','statusBuildCorrupted','statusBuildRestore',
  'statusSharedAccountChanged','statusSharedLimit','statusSharedImportStorage',
  'statusSharedDeleted','statusSharedLegacy','statusSharedInvalid',
  'statusSharedNotFound','statusSharedNetwork','statusItemDeleteLinked',
  'statusNpcDeleteLinked'];
 for(const key of ids){
  assert.ok(locale.keys().includes(key));
  assert.match(locale.fieldKey(key),/^ui\.label\.status-/);
  assert.equal(typeof locale.baseText(key,'ru'),'string');
  assert.ok(locale.baseText(key,'en'));
  assert.equal(locale.literalKey(locale.baseText(key,'ru')),key);
  assert.equal(locale.literalKey(locale.baseText(key,'en')),key);
  assert.equal(guide.validOverride('book.'+locale.fieldKey(key),
   JSON.stringify({ru:'Изменённый текст',en:'Updated copy'})),true);
 }
 assert.equal(locale.literalKey('Пароли не совпадают.'),null);
 assert.equal(locale.literalKey('Ошибка сервера'),null);
 assert.equal(locale.literalKey('Билд «Personal name» удалён.'),null);
 const id='guideedit.book.'+locale.fieldKey('statusBuildDeleted');
 locale.setOverrides({[id]:JSON.stringify({ru:'Запись удалена',en:'Record deleted'})});
 assert.equal(locale.ui('Билд удалён. Все его ссылки больше не работают.','ru'),'Запись удалена');
 assert.equal(locale.ui('Билд удалён. Все его ссылки больше не работают.','en'),'Record deleted');
 locale.setOverrides({});
});

test('authoring pencil is visible for origin and main stage headings',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/node\?\.matches\?\.\('h2'\)/);
 assert.match(app,/originCopyLabel\(node,key,ru,en,\{pencilHost\}\)/);
 assert.match(app,/button\|\|node\.matches\('h2,h3'\)/);
 assert.match(app,/node\.dataset\.pathCopyBound==='1'/);
 assert.match(app,/bindAccountCopyEditors\(root\)/);
 assert.match(app,/const authoredKey=statusKey\?\.startsWith\('status'\)/);
 assert.match(app,/authoredKey&&adminEditing&&adminToken/);
 assert.match(app,/data-owner-copy-key':authoredKey/);
});

test('hero-book editor offers distinct stat caption and hint actions',()=>{
 const book=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-owner-inline-ui.css');
 assert.match(book,/class:'stage-guide-edit-name'/);
 assert.match(book,/class:'stage-guide-edit-hint'/);
 assert.match(book,/onclick:editName/);
 assert.match(book,/english\?'hintEn':'hintRu'/);
 assert.match(book,/text:'\?'/);
 assert.match(book,/class:'stage-guide-actions'/);
 assert.match(css,/\.stage-result-tile>\.stage-guide-actions/);
 assert.match(css,/\.stage-chapter-label/);
});
