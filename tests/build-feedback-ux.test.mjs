import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const root={};
Function('window',read('pandora-studio-ui-locale.js'))(root);

test('guest working draft warns about clearing browser data in both languages',()=>{
 const block=app.slice(app.indexOf('function buildSignInCard('),app.indexOf('function openBuildAccount('));
 assert.match(block,/build-guest-storage-note/);
 assert.match(block,/caption\('libraryGuestStorageWarning'\)/);
 assert.equal(root.PandoraUILocale.text('libraryGuestStorageWarning','ru'),
  'Без аккаунта текущий герой хранится только в этом браузере. Очистка его данных удалит черновик.');
 assert.equal(root.PandoraUILocale.text('libraryGuestStorageWarning','en'),
  'Without an account, your current hero stays only in this browser. Clearing its data erases the draft.');
 assert.match(css,/\.build-signin-copy \.build-guest-storage-note/);
});
test('conflicting drafts save existing account work before switching to guest',()=>{
 const block=app.slice(app.indexOf('function finishBuildAccountEntry('),app.indexOf('function renderBuilds('));
 assert.match(block,/const accountWasSaved=!unsavedBuild\(\)/);
 assert.match(block,/if\(!accountWasSaved&&!saveBuild\(state\.name\|\|tr\('Новый герой','New hero'\)\)\)return/);
 assert.match(block,/if\(!switchActiveDraft\(structuredClone\(guest\.snapshot\),null\)\)return/);
 assert.match(block,/build-draft-choices/);
 assert.match(block,/Оставить героя аккаунта/);
});
test('shared library import has an account guard, capacity limit and no browser alert',()=>{
 const block=app.slice(app.indexOf('function openSharedSnapshot(share){'),
   app.indexOf('let studioToastTimer=',app.indexOf('function openSharedSnapshot(share){')));
 assert.match(block,/viewerToken=window\.PandoraAccountUI\.token\(\),viewerOwner=libraryScopeId\(\)/);
 assert.match(block,/if\(!verifyViewer\(\)\)return/);
 assert.match(block,/if\(builds\.length\+added\.length>200\)/);
 assert.doesNotMatch(block,/\balert\(/);
});
test('new failure messages explain local versus cloud storage in RU/EN',()=>{
 for(const message of [
  'Не удалось загрузить облачные билды. Локальные копии не удалены. Проверь соединение и нажми «Обновить библиотеку».',
  'Сохранено только в этом браузере · облако недоступно. Обнови библиотеку после восстановления соединения.',
  'Билд не сохранён: браузер не смог записать его. Текущий герой остался открытым. Освободи место в браузере и повтори.'
 ]){
  assert.ok(app.includes(message));
  const english=root.PandoraUILocale.ui(message,'en');
  assert.notEqual(english,message);
  assert.doesNotMatch(english,/[А-Яа-яЁё]/);
 }
});
