import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
test('Wiki owner common picker UI uses the shared RU/EN helper',()=>{
 for(const [ru,en] of [
  ['Название предмета…','Item name…'],
  ['Найти предмет','Find item'],['Выбери предмет','Choose item'],
  ['Предметы не найдены','No items found'],
  ['Убрать класс ','Remove class '],['Добавить доступный класс','Add eligible class'],
  ['Выбери класс','Choose class'],
  ['Поиск эффекта','Search effects'],['Выбери эффект','Choose effect'],
  ['+ Добавить эффект','+ Add effect'],
  ['Поиск предыдущего умения…','Search prerequisite skill…'],
  ['Найти умение','Find skill'],
  ['Выбери предыдущее умение','Choose prerequisite skill'],
  ['Выбери умение','Choose skill'],
  ['Удалить требование ','Remove requirement '],
  ['Выбери ветку','Choose branch'],['+ Требование ветки','+ Branch requirement'],
  ['Убрать слот ','Remove slot '],['Выбери слот','Choose slot'],['+ Слот','+ Slot']
 ]){
  assert.ok(source.includes("wt('"+ru+"','"+en+"')"),
   'Every owner picker label must have both locales: '+ru);
 }
});
test('owner picker controls do not expose untranslated static Russian aria labels',()=>{
 for(const raw of [
  "'aria-label':'Найти предмет'","'aria-label':'Выбери предмет'",
  "'aria-label':'Добавить доступный класс'","'aria-label':'Выбери класс'",
  "'aria-label':'Поиск эффекта'","'aria-label':'Выбери эффект'",
  "'aria-label':'Выбери слот'","'aria-label':'Выбери ветку'",
  "'aria-label':'Выбери предыдущее умение'","'aria-label':'Найти умение'"
 ])assert.equal(source.includes(raw),false,raw);
 assert.match(source,/wt\('Убрать слот ','Remove slot '\)\+slotLabel\(slot\)/);
 assert.match(source,/wt\('Убрать класс ','Remove class '\)\+name/);
});
