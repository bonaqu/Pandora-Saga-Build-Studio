import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=read('pandora-studio-hero-book.js'),calculator=read('pandora-os-character-calculator.js');
const load=lang=>{const host={};Function('window','document',source)(host,
 {documentElement:{lang}});return host.PandoraStageAttributes};
test('global elemental resistance has one bilingual home: the 43 results',()=>{
 const summary=load('ru').summaryRows({resistances:{elements:{
  fire:0,ice:20,lightning:3,poison:-5,charm:4,light:7,dark:8,magic:9
 }}}).flatMap(x=>x.rows);
 for(const name of ['Сопр. огню','Сопр. льду','Сопр. молниям','Сопр. яду',
  'Сопр. чарам','Сопр. свету','Сопр. тьме','Сопр. магии'])
  assert.ok(summary.some(row=>row.ru===name),name);
 assert.equal(summary.find(x=>x.ru==='Сопр. огню').value,0);
 assert.equal(summary.find(x=>x.ru==='Сопр. яду').value,-5);
 const defense=load('ru').defenseChapterGroups({resistances:{elements:{fire:12}}});
 assert.ok(!defense.some(x=>x.rows.some(row=>row.key==='resistElement:fire')));
});
test('all current individual state resistances have distinct bilingual defense labels',()=>{
 const states=['burn','stun','numb','tumble','knockback','sleep',
  'silence','evil','curse','disease','madness','blockBreak'];
 const status=Object.fromEntries(states.map((key,i)=>[key,i+1]));
 const ru=load('ru').defenseChapterGroups({resistances:{status}});
 const en=load('en').defenseChapterGroups({resistances:{status}});
 const rows=group=>group.flatMap(x=>x.rows);
 assert.equal(rows(ru).length,12);
 assert.deepEqual(rows(ru).map(row=>row.key),states.map(k=>'resistStatus:'+k));
 assert.deepEqual(rows(ru).map(row=>row.value),states.map((_,i)=>i+1));
 assert.ok(rows(ru).some(x=>x.ru==='Пробитие блока'));
 assert.ok(rows(en).some(x=>x.en==='Block break'));
 assert.ok(!rows(en).some(x=>x.en===x.ru));
});
test('locale translation never mutates unknown player names or fabricates statuses',()=>{
 const en=load('en'),ru=load('ru');
 for(const name of ['Имя героя 2','Душа несчастья','Слабость/проклятие особое']){
  assert.equal(en.bookText(name),name);
  assert.equal(ru.bookText(name),name);
 }
 assert.deepEqual(en.defenseChapterGroups({resistances:{status:{}}}),[]);
 const root={};Function('window',calculator)(root);
 assert.equal(typeof root.PandoraOSCalculator.resistancePreview,'function');
});
