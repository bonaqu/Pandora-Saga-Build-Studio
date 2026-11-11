import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const styles=read('pandora-studio-owner-inline-ui.css');
const smoke=read('tests/browser-admin-entry.mjs');
const root={};root.window=root;
Function('window',read('pandora-studio-honor-guide.js'))(root);

test('admin translation and GitHub modals use independent RU/EN owner D1 keys',()=>{
 const names=['translationsIntro','translationsSaveButton','githubPrompt',
  'githubExplanation','githubCreateButton'];
 for(const key of names){
  assert.ok(app.includes("'"+key+"'"),key);
  const normalized=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
  const d1='book.owner-dialog.'+normalized;
  assert.equal(root.PandoraHonorGuide.validOverride(d1,
   JSON.stringify({ru:'Изменённое пояснение',en:'Updated explanation'})),true,d1);
 }
 assert.match(app,/function ownerDialogHelp\(key,ru,en\)/);
 assert.match(app,/ownerCopy\('owner-dialog',key,ru,en\)/);
 assert.match(app,/ownerCopyLabel\(caption,'owner-dialog',key,ru,en\)/);
 assert.match(app,/caption\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(app,/function ownerDialogAction\(button,key,ru,en\)/);
 assert.match(app,/ownerCopyLabel\(host,'owner-dialog',key,ru,en/);
 assert.match(app,/button\.hidden=true;pencil\.hidden=true;host\.hidden=false/);
 assert.doesNotMatch(app,/button\.dispatchEvent\(new MouseEvent\('dblclick'/);
});

test('realtime counts, field translations and GitHub actions stay noneditable',()=>{
 const start=app.indexOf('function ownerDialogHelp(');
 const end=app.indexOf('async function showCatalogImport(',start);
 const view=app.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(view,/text:row\.title/);
 assert.match(view,/text:field\.ru\+' → '\+field\.en/);
 assert.match(view,/text:tr\('К сохранению: '/);
 assert.match(view,/text:tr\('Записей к публикации: '/);
 assert.match(view,/info\.count/);
 assert.match(view,/expectedFingerprint:info\.fingerprint/);
 assert.match(view,/if\(!info\.configured\)/);
 assert.match(view,/ownerDialogAction\(go,'githubCreateButton'/);
 assert.match(view,/ownerDialogAction\(save,'translationsSaveButton'/);
 assert.doesNotMatch(view,/ownerCopyLabel\(.*row\.title/);
 assert.match(smoke,/calls\.filter\(x=>x==='owner-pr'\)\.length,beforePRCalls/);
 assert.match(smoke,/guideedit\.book\.owner-dialog\.github-explanation/);
 assert.match(smoke,/guideedit\.book\.owner-dialog\.github-create-button/);
});

test('D1 writes and Undo update a mounted caption, including the action label',()=>{
 const refresh=app.slice(app.indexOf('function refreshVisibleOwnerCopy('),
  app.indexOf('function ',app.indexOf('function refreshVisibleOwnerCopy(')+20));
 assert.match(refresh,/owner-dialog/);
 assert.match(refresh,/action\.textContent=value/);
 assert.match(app,/key\.startsWith\('book\.owner-dialog\.'\)/);
 assert.match(app,/owner-history\|owner-dialog/);
 assert.match(styles,/\.owner-dialog-editor>/);
 assert.match(styles,/\.owner-dialog-action-editor>/);
 assert.match(styles,/\.owner-dialog-action-host>\.wiki-inline-input/);
});

test('English admin review statuses and titles do not reuse untranslated RU defaults',()=>{
 assert.match(app,/modal\(tr\('Английские переводы','English translations'\),body\)/);
 assert.match(app,/modal\(tr\('Синхронизация энциклопедии с GitHub','Encyclopedia sync with GitHub'\),panel\)/);
 assert.match(app,/tr\('Готово: ','Done: '\)/);
 assert.match(app,/tr\('Сохранено ','Saved '\)/);
 assert.match(app,/tr\('Открыть PR для проверки','Open PR for review'\)/);
});
