import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-ui-locale.js'),root);
runInNewContext(read('pandora-studio-honor-guide.js'),root);
const locale=root.PandoraUILocale,guide=root.PandoraHonorGuide;

test('library controls have safe semantic RU/EN D1 keys and preserve bundled copy',()=>{
 const expected={
  librarySaveNew:'✧ Сохранить новый билд',
  libraryRefresh:'↻ Обновить библиотеку',
  libraryUnsavedOpen:'Есть несохранённые изменения. Открыть другой билд?',
  libraryDeleteAsk:'Удалить билд и отозвать все созданные ссылки?',
  libraryLocalCopyNote:'Локальная копия · чтобы сохранить в облако, откройте её и нажмите «Перезаписать»'
 };
 for(const [key,ru] of Object.entries(expected)){
  assert.ok(locale.keys().includes(key),key);
  assert.equal(locale.baseText(key,'ru'),ru);
  assert.ok(locale.baseText(key,'en')!==ru,key+' English default');
  assert.equal(locale.literalKey(ru),key);
  const id=locale.fieldKey(key);
  assert.match(id,/^ui\.label\.library-/);
  assert.equal(guide.validOverride('book.'+id,JSON.stringify({
   ru:'Проверено',en:'Verified'
  })),true);
 }
 assert.equal(locale.literalKey('Имя моего героя'),null);
 assert.equal(locale.literalKey('Server error: authorization rejected'),null);
 assert.equal(locale.literalKey('Сохранение ID 113'),null);
 assert.equal(locale.literalKey('Перезаписать сохранённый билд «Hero» текущим персонажем?'),null);
});

test('library captions localize by exact literal, never translate a saved name',()=>{
 const make=(label,childCount=1)=>{
  const parent={childNodes:new Array(childCount),dataset:{},attributes:{},
   closest:()=>false,setAttribute(key,value){this.attributes[key]=value}};
  const node={nodeValue:label,parentElement:parent};
  parent.childNodes[0]=node;
  return {node,parent};
 };
 const save=make('✧ Сохранить новый билд');
 const warning=make('Есть несохранённые изменения. Открыть другой билд?');
 const personal=make('Удалить билд',2);
 const name=make('Удалить билд — мой билд');
 const nodes=[save.node,warning.node,personal.node,name.node];
 const document={
  createTreeWalker:()=>{let i=0;return {nextNode:()=>nodes[i++]||null}}
 };
 const target={ownerDocument:document,querySelectorAll:()=>[]};
 locale.setOverrides({['guideedit.book.'+locale.fieldKey('librarySaveNew')]:
  JSON.stringify({ru:'✧ Сохранить персонажа',en:'✧ Save character'})});
 locale.localize(target,'ru');
 assert.equal(save.parent.attributes['data-owner-copy-key'],'librarySaveNew');
 assert.equal(save.node.nodeValue,'✧ Сохранить персонажа');
 assert.equal(warning.parent.attributes['data-owner-copy-key'],'libraryUnsavedOpen');
 assert.equal(personal.parent.attributes['data-owner-copy-key'],undefined,
  'compound label with a checkbox is not editable');
 assert.equal(name.parent.attributes['data-owner-copy-key'],undefined,
  'player-generated text cannot be promoted to owner copy');
 save.node.nodeValue='✧ Сохранить новый билд';
 warning.node.nodeValue='Есть несохранённые изменения. Открыть другой билд?';
 locale.localize(target,'en');
 assert.equal(save.node.nodeValue,'✧ Save character');
 assert.equal(warning.node.nodeValue,'You have unsaved edits. Open another build?');
 assert.equal(name.node.nodeValue,'Удалить билд — мой билд');
 locale.setOverrides({});
});

test('edited library strings are independent across languages with strict fallbacks',()=>{
 const id='guideedit.book.'+locale.fieldKey('libraryDeleteAsk');
 locale.setOverrides({[id]:JSON.stringify({ru:'Удалить вместе со ссылками?',en:'Delete along with links?'})});
 assert.equal(locale.text('libraryDeleteAsk','ru'),'Удалить вместе со ссылками?');
 assert.equal(locale.text('libraryDeleteAsk','en'),'Delete along with links?');
 locale.setOverrides({[id]:JSON.stringify({ru:'x'.repeat(251)})});
 assert.equal(locale.text('libraryDeleteAsk','ru'),
  locale.baseText('libraryDeleteAsk','ru'));
 locale.setOverrides({});
 assert.equal(locale.text('libraryDeleteAsk','en'),
  'Delete this build and revoke all its links?');
});

test('the real library view binds edit controls after rendering without touching saves',()=>{
 const app=read('pandora-studio-app.js');
 const view=app.slice(app.indexOf('function renderBuilds(root){'),
  app.indexOf('function newId(){'));
 assert.match(view,/PandoraUILocale\.localize\(root,lang\);\s*\/\/[^\n]*\n[^\n]*\n bindAccountCopyEditors\(root\);/);
 assert.match(app,/function bindAccountCopyEditors\(panel\)/);
 assert.match(app,/node\.addEventListener\('keydown',event=>/);
 assert.match(app,/node\.after\(h\('button',\{type:'button',class:'ui-content-pencil account-copy-pencil'/);
 assert.match(app,/saveGuidePatch\('book\.'\+id,\{\[lang\]:next\}\)/);
 assert.doesNotMatch(view,/\bsecret\b|data-owner-copy-key.*b\.name/i);
});
