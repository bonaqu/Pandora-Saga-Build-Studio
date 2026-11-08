import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-account-ui.js');
const root={};
vm.runInNewContext(read('pandora-studio-ui-locale.js'),{window:root});
const translate=(value,lang='en')=>root.PandoraUILocale.ui(value,lang);

test('all visible account identity and sign-out labels have RU/EN translations',()=>{
 for(const [ru,en] of [
  ['УЧЁТНАЯ ЗАПИСЬ','ACCOUNT'],
  ['Облачные билды привязаны к вашему профилю','Cloud builds belong to your account'],
  ['Выйти из аккаунта','Sign out of account'],
  ['Войти или зарегистрироваться','Sign in or register'],
  ['Изменить пароль','Change password'],
  ['Новый пароль · от 8 символов','New password · at least 8 characters']
 ]){
  assert.ok(source.includes(ru),'Account must actually use: '+ru);
  assert.equal(translate(ru),en,'EN label for '+ru);
  assert.equal(translate(ru,'ru'),ru,'RU label for '+ru);
 }
});

test('authentication diagnostics have human-readable EN equivalents',()=>{
 for(const [ru,en] of [
  ['Некорректный ответ авторизации','Invalid sign-in response'],
  ['Некорректный владелец аккаунта','Account identity mismatch'],
  ['Ошибка сервера','Server error']
 ])assert.equal(translate(ru),en);
});
