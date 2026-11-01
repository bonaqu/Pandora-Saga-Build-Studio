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
 assert.match(output,/Астира\.\n\nИНТ \+1/);
 assert.match(output,/ОМ \+10\n\nЗа каждые 2/);
 assert.match(output,/улучшения:\nМагическая атака/);
});
test('glued gameplay effects break cleanly but ordinary sentence spaces remain intact',()=>{
 const source='Красивая куртка. Такие любят носить мужчины Астира.ИНТ +1, ОЗ +15, ОМ +10Сопротивляемость магии +5%За каждые 2 единицы улучшения:Магическая атака +1%Время перезарядки -1%';
 const output=p.description(source);
 assert.match(output,/Красивая куртка\. Такие любят/);
 assert.match(output,/Астира\.\n\nИНТ \+1/);
 assert.match(output,/ОМ \+10\nСопротивляемость/);
 assert.match(output,/\+5%\n\nЗа каждые 2/);
 assert.match(output,/улучшения:\nМагическая атака \+1%\nВремя/);
 assert.equal(p.description(output),output);
});
test('source line breaks are not lost',()=>{
 assert.match(p.description('Описание.\nОЗ +15'),/\nОЗ \+15/);
});

test('localized item names prefer the active language without translating original source text',()=>{
 const item={id:19022,name:{ru:'Кольцо метели',en:'Blizzard Ring'},kind:'RING'};
 assert.equal(p.displayName(item),'Кольцо метели');
 assert.equal(p.displayName(item,'Unknown','ru'),'Кольцо метели');
 assert.equal(p.displayName(item,'Unknown','en'),'Blizzard Ring');
 assert.equal(p.displayName({names:{ru:'Руна',en:'Rune'}},'Unknown','en'),'Rune');
 assert.equal(p.displayName({name:{ru:'Только русское'}},'Unknown','en'),'Только русское');
 assert.equal(p.displayName({name:'Оригинальное имя'},'Unknown','en'),'Оригинальное имя');
 assert.equal(p.displayName({name:'19022'},'Unnamed item','en'),'Unnamed item');
 assert.equal(item.id,19022);
 assert.deepEqual(item.name,{ru:'Кольцо метели',en:'Blizzard Ring'});
});
