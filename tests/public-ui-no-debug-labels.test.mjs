import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('hero book uses game-focused labels rather than debug disclaimers',()=>{
 const book=read('stage-attributes.js');
 assert.doesNotMatch(book,/Магическая атака \(частичный показатель\)/);
 assert.doesNotMatch(book,/Частичный показатель: /);
 assert.doesNotMatch(book,/не включено в частичный итог: порядок округления OS не проверен/);
 assert.doesNotMatch(book,/сочетаний требуют специальной проверки/);
 assert.doesNotMatch(book,/Особых сочетаний самоцветов/);
 assert.match(book,/Радужные самоцветы: /);
 assert.match(book,/Магическая атака: /);
 assert.match(book,/отдельный эффект/);
});
test('player-facing icon state does not expose local archive counters',()=>{
 const app=read('app.js');
 assert.doesNotMatch(app,/Локальные иконки OS: /);
 assert.doesNotMatch(app,/локальный архив пока не импортирован/);
 assert.match(app,/Изображения загружены/);
 assert.match(app,/Некоторые изображения недоступны/);
 assert.match(app,/Используются игровые изображения/);
});
