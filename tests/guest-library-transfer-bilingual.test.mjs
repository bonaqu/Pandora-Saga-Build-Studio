import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const locale=readFileSync(new URL('../pandora-studio-ui-locale.js',import.meta.url),'utf8');

test('the guest library gate explains login and registration in both languages',()=>{
 const gate=app.slice(app.indexOf('function buildSignInCard('),
  app.indexOf('function openBuildAccount('));
 assert.match(gate,/caption\(titleKey\)/);
 assert.match(gate,/caption\(leadKey\)/);
 assert.match(gate,/caption\('libraryGuestStorageWarning'\)/);
 assert.match(gate,/caption\('accountSignIn'\)/);
 assert.match(gate,/caption\('accountRegister'\)/);
 assert.match(locale,/libraryGuestTitle:\['Мои билды — в аккаунте','Your builds belong to your account'\]/);
 assert.match(locale,/libraryGuestStorageWarning:\['Без аккаунта текущий герой хранится только в этом браузере/);
});
test('no RU/EN legacy import panel, manual key form or automatic guest library transfer',()=>{
 assert.doesNotMatch(app,/Перенести старые билды|Import older builds/);
 assert.doesNotMatch(app,/Код старой библиотеки|Previous library code/);
 assert.doesNotMatch(app,/Найти на этом устройстве|Find on this device/);
 assert.doesNotMatch(app,/buildLegacyImport\(/);
 assert.doesNotMatch(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
});
