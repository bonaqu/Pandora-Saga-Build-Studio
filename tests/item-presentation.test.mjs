import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const sandbox={window:{}};
vm.runInNewContext(readFileSync(new URL('../item-presentation.js',import.meta.url),'utf8'),sandbox);
const p=sandbox.window.PandoraItemPresentation;
test('player sees localized item type instead of raw enum',()=>{
 assert.equal(p.kind({kind:'RING'}),'Кольцо');
 assert.equal(p.kind({kind:'BELT'}),'Пояс');
});
test('Golden Astir jacket gains meaningful source-line breaks',()=>{
 const source='Красивая куртка цвета полной луны. Такие любят носить мужчины Астира.ИНТ +1, ОЗ +15, ОМ +10За каждые 2 единицы улучшения:Магическая атака +1%';
 const output=p.description(source);
 assert.match(output,/Астира\.\nИНТ \+1/);
 assert.match(output,/ОМ \+10\nЗа каждые 2/);
 assert.match(output,/улучшения:\nМагическая атака/);
});
test('source line breaks are not lost',()=>{
 assert.match(p.description('Описание.\nОЗ +15'),/\nОЗ \+15/);
});
