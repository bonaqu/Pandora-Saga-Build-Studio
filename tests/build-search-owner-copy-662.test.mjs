import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const root={};
vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
const locale=root.PandoraUILocale;

test('owner can edit four search and empty-state keys independently in RU/EN',()=>{
 const samples=[
  ['librarySearchInputLabel','Найти сохранённый билд','Find a saved build'],
  ['librarySearchPlaceholder','Поиск по названию, классу, уровню…','Search by name, class or level…'],
  ['librarySearchEmpty','Билды по запросу не найдены.','No builds match this search.'],
  ['libraryEmpty','Сохранённых билдов пока нет.','No saved builds yet.']
 ];
 const render=app.slice(app.indexOf('function renderBuilds(root){'),app.indexOf('function newId(){'));
 for(const [key,ru,en] of samples){
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  assert.ok(locale.fieldKey(key)?.startsWith('ui.label.library-'));
  assert.ok(render.includes("['"+key+"',"),'Owner-visible '+key);
  const override='guideedit.book.'+locale.fieldKey(key);
  locale.setOverrides({[override]:JSON.stringify({ru:'Правка',en:'English edit'})});
  assert.equal(locale.text(key,'ru'),'Правка');
  assert.equal(locale.text(key,'en'),'English edit');
 }
 locale.setOverrides({});
});

test('live copy refresh changes text attributes only, not query or library state',()=>{
 const update=app.slice(app.indexOf('function refreshVisibleUICopy(recordKey){'),
  app.indexOf('// An Origin copy Undo',app.indexOf('function refreshVisibleUICopy(recordKey){')));
 assert.match(update,/if\(id===locale\.fieldKey\('librarySearchInputLabel'\)\)/);
 assert.match(update,/search\.setAttribute\('aria-label',locale\.text\('librarySearchInputLabel',lang\)\)/);
 assert.match(update,/if\(id===locale\.fieldKey\('librarySearchPlaceholder'\)\)/);
 assert.match(update,/search\.placeholder=locale\.text\('librarySearchPlaceholder',lang\)/);
 assert.match(update,/state\.textContent=locale\.text\(key,lang\)/);
 assert.doesNotMatch(update,/\.value\s*=|renderBuilds\(|renderDetails\(|buildSearchQuery\s*=/,
  'Owner copy must not reset user query or rerender their saved cards');
 assert.match(app,/'data-build-library-search':''/);
 assert.match(app,/'data-build-library-state-copy':'librarySearchEmpty'/);
 assert.match(app,/'data-build-library-state-copy':'libraryEmpty'/);
});
