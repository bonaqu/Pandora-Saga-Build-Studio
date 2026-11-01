import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../stage-attributes.js',import.meta.url),'utf8');
function load(lang){
 const doc={documentElement:{lang}};
 const root={};
 Function('window','document',code)(root,doc);
 return root.PandoraStageAttributes;
}
test('six Hero Book chapters have exact RU/EN translations',()=>{
 const ru=load('ru'),en=load('en');
 assert.equal(ru.bookPages.length,6);
 for(const [id,label] of ru.bookPages){
  assert.equal(ru.bookText(label),label,id);
  const translation=en.bookText(label);
  assert.match(translation,/^[A-Za-z &]+$/,'Missing EN chapter label: '+id);
 }
 assert.equal(en.bookText('Итоги'),'Summary');
 assert.equal(en.bookText('Зелья и умения'),'Potions & skills');
 assert.equal(en.bookText('Гильдия и честь'),'Guild & honor');
});
test('Hero Book never fuzzy-translates official item names or player-entered text',()=>{
 const en=load('en');
 for(const label of ['Душа несчастья','Проклятый посох','Меч героя','Нестандартное имя',
  'Критический шанс +55%','Мощность 100'])assert.equal(en.bookText(label),label);
 assert.equal(en.bookText(20),20);
 assert.equal(en.bookText('ОЗ'),'HP');
 assert.equal(en.bookText('ОМ'),'MP');
});
test('Hero Book UI and aria descriptions follow document language on rerender',()=>{
 assert.match(code,/n\.textContent=bookText\(value\)/);
 assert.match(code,/document\.documentElement\?\.lang==='en'\?/);
 assert.match(code,/Hero Book\./);
 assert.match(code,/make\('span',\{text:\(document\.documentElement\.lang==='en'\?'HERO BOOK'/);
});
