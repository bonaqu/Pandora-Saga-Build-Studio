import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('the guest library gate explains login and registration in both languages',()=>{
 const gate=app.slice(app.indexOf('function buildSignInCard('),
  app.indexOf('function openBuildAccount('));
 assert.match(gate,/Мои билды — в аккаунте/);
 assert.match(gate,/Your builds belong to your account/);
 assert.match(gate,/Войти','Sign in'/);
 assert.match(gate,/Регистрация','Register'/);
 assert.match(gate,/Без аккаунта текущий герой хранится только в этом браузере/);
});
test('no RU/EN legacy import panel, manual key form or automatic guest library transfer',()=>{
 assert.doesNotMatch(app,/Перенести старые билды|Import older builds/);
 assert.doesNotMatch(app,/Код старой библиотеки|Previous library code/);
 assert.doesNotMatch(app,/Найти на этом устройстве|Find on this device/);
 assert.doesNotMatch(app,/buildLegacyImport\(/);
 assert.doesNotMatch(app,/activateLibraryScope\(\{carry:Boolean\(register\)\}\)/);
});
