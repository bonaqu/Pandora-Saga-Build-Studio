import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-wiki-history.css');
const browser=read('tests/browser-admin-entry.mjs');
const guideRoot={};guideRoot.window=guideRoot;
Function('window',read('pandora-studio-honor-guide.js'))(guideRoot);

test('owner history has stable bilingual editorial keys and does not expose game values',()=>{
 const start=app.indexOf('function showOverrideManager(){');
 const end=app.indexOf('\nfunction ',start+30);
 assert.ok(start>=0&&end>start);
 const manager=app.slice(start,end);
 for(const key of ['intro','empty']){
  assert.match(manager,new RegExp("authoredHistory\\('"+key+"'"));
  assert.equal(guideRoot.PandoraHonorGuide.validOverride('book.owner-history.'+key,
   JSON.stringify({ru:'Пояснение',en:'Help'})),true);
 }
 assert.match(manager,/ownerCopy\('owner-history',key,ru,en\)/);
 assert.match(manager,/ownerCopyLabel\(node,'owner-history',key,ru,en\)/);
 assert.match(manager,/class:'owner-history-pencil'/);
 assert.match(manager,/node\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(manager,/count\.textContent=tr\('Найдено '/);
 assert.match(manager,/h\('p',\{text:entry\.before\}\)/);
 assert.match(manager,/h\('p',\{text:entry\.after\}\)/);
 assert.doesNotMatch(manager,/ownerCopyLabel\(count/);
 assert.doesNotMatch(manager,/ownerCopyLabel\(row/);
});

test('history copy save, Undo and reset share D1 CAS and keep the current modal mounted',()=>{
 assert.match(app,/key\.startsWith\('book\.owner-history\.'\)/);
 assert.match(app,/last\.key\)/);
 assert.match(app,/book\.owner-history\./);
 assert.match(app,/record\.key\.startsWith\('guideedit\.book\.owner-history\.'\)/);
 const start=app.indexOf('function refreshVisibleOwnerCopy(');
 assert.ok(start>0);
 const refresh=app.slice(start,start+4500);
 assert.match(refresh,/owner-history/);
 assert.match(app,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(css,/\.owner-manager \.owner-history-edit-row/);
 assert.match(css,/\.owner-manager \.owner-history-pencil/);
 assert.match(css,/\.owner-manager \.owner-history-edit-row \.wiki-inline-input/);
 assert.match(browser,/guideedit\.book\.owner-history\.intro/);
 assert.match(browser,/beforeCatalogCalls/);
});
