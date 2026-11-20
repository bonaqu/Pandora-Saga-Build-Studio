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

test('origin and generic headings edit their own text without duplicate caption pencils',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/function originCopyLabel\(node,key,ru,en\)/);
 assert.match(app,/editOriginCopyLabel\(node,key,ru,en\)/);
 assert.match(app,/node\.addEventListener\('dblclick',edit\)/);
 assert.match(app,/function bindStaticUICopyEditors\(/);
 assert.doesNotMatch(app,/class:'origin-copy-pencil'/);
 assert.doesNotMatch(app,/class:'ui-content-pencil','data-ui-content-for':key/);
 assert.match(app,/node\.dataset\.pathCopyBound==='1'/);
 assert.match(app,/bindAccountCopyEditors\(root\)/);
 assert.match(app,/const authoredKey=statusKey\?\.startsWith\('status'\)/);
 assert.match(app,/authoredKey&&adminEditing&&adminToken/);
});


test('hero book edits visible captions in place and adds pencil only for real hover explanations',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/node\.addEventListener\('dblclick',editName\)/);
 assert.match(book,/if\(meaningfulGuideHint\(hint\)\)/);
 assert.match(book,/class:'stage-guide-edit-hint'/);
 assert.match(book,/english\?'hintEn':'hintRu'/);
 assert.doesNotMatch(book,/class:'stage-guide-edit-name'/);
 assert.doesNotMatch(book,/class:'stage-book-tab-pencil'/);
});

