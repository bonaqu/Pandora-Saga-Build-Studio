import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const scope={};
Function('window',read('pandora-studio-ui-locale.js'))(scope);
const translate=scope.PandoraUILocale.ui;

test('EN shared-link and browser-storage failures show translated errors',()=>{
 const messages=[
  'Не удалось сохранить билд. Проверь свободное место в браузере.',
  'Ссылка содержит некорректные параметры персонажа',
  'Некорректная ссылка',
  'Ссылка не подтвердила выбранный билд. Попробуйте ещё раз.',
  'Владелец удалил этот билд. Ссылка больше не существует.',
  'Ссылка устарела. Попросите владельца поделиться билдом заново.',
  'Билд по ссылке не найден. Возможно, адрес неверный.',
  'Не получилось загрузить билд. Проверь соединение и попробуй снова.'
 ];
 for(const message of messages){
  const en=translate(message,'en');
  assert.notEqual(en,message,'Missing UI translation: '+message);
  assert.doesNotMatch(en,/[А-Яа-яЁё]/);
  assert.equal(translate(message,'ru'),message);
 }
});

test('shared receiver buttons, dialogs and dynamic build name use explicit locale',()=>{
 assert.match(app,/const sharedText=\(ru,en\)=>lang==='en'\?en:ru/);
 for(const fragment of [
  "sharedText('Добавить билды по ссылке?','Add builds from link?')",
  "sharedText('Открыть билд по ссылке?','Open build from link?')",
  "sharedText('Сохранить текущий и открыть','Save current and open')",
  "sharedText('Открыть без сохранения','Open without saving')",
  "sharedText('Отмена','Cancel')",
  "sharedText('× Закрыть','× Close')",
  "sharedText('Добавить в мои билды','Add to My Builds')",
  "incoming.name+sharedText("
 ])assert.ok(app.includes(fragment),'Share dialog copy is not bilingual: '+fragment);
 assert.match(app,/sharedText\('Открыть билд «','Open build “'\)\+\s*incoming\.name\+sharedText\('»\?','”\?'\)/);
 assert.match(app,/PandoraUILocale\?\.localize\(unsavedWarning,lang\)/);
 assert.doesNotMatch(app,/modal\('Открыть билд по ссылке\?',view\)/);
});

test('share status errors use translated detail instead of raw Russian in EN UI',()=>{
 assert.match(app,/window\.PandoraUILocale\?\.ui\(error\.message,lang\)\|\|error\.message/);
 assert.match(app,/const prefix=h\('span',\{class:'share-error-intro',text:'Не удалось создать ссылку:'\}\)/);
 assert.match(app,/class:'share-runtime-detail'/);
 assert.ok(translate('Ссылка выделена — скопируй через меню или Ctrl+C','en').includes('copy'));
 assert.match(app,/copy\.textContent=window\.PandoraUILocale\?\.ui\('✓ Скопировано',lang\)/);
 assert.match(app,/copy\.textContent=window\.PandoraUILocale\?\.ui\(\s*'Ссылка выделена — скопируй через меню или Ctrl\+C',lang\)/);
});
