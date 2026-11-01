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
test('soul slot labels share one localized source of truth',()=>{
 assert.equal(p.slotLabel('weapon'),'Оружие');
 assert.equal(p.slotLabel('weapon','en'),'Weapon');
 assert.equal(p.slotLabel('necklace'),'Ожерелье');
 assert.equal(p.slotLabel('necklace','en'),'Necklace');
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
test('English OS item effects and enhancement conditions are separated without rewriting text',()=>{
 const src='A sword resembling a dagger.AGI +1Per every 2 enhancement levels:MP +20At +7 and above: AGI +1';
 const output=p.description(src);
 assert.match(output,/dagger\.\n\nAGI \+1/);
 assert.match(output,/AGI \+1\n\nPer every 2 enhancement levels:/);
 assert.match(output,/levels:\nMP \+20\n\nAt \+7 and above:/);
 assert.equal(p.description(output),output);
});
test('all bundled item and soul descriptions remain stable under a second formatting pass',()=>{
 for(const file of ['items','souls']){
  const records=JSON.parse(readFileSync(new URL('../data/os/'+file+'.json',import.meta.url),'utf8'));
  for(const row of Object.values(records)){
   if(typeof row.desc!=='string')continue;
   const one=p.description(row.desc);
   assert.equal(p.description(one),one,file+' description unstable: '+row.name);
  }
 }
});
test('all English source descriptions are stable when formatted twice',()=>{
 const en=JSON.parse(readFileSync(new URL('../data/os/strings.en.json',import.meta.url),'utf8'));
 for(const chapter of ['items','souls'])for(const [id,row] of Object.entries(en[chapter]||{})){
  if(typeof row.d!=='string')continue;
  const formatted=p.description(row.d);
  assert.equal(p.description(formatted),formatted,chapter+' translated description '+id);
 }
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
