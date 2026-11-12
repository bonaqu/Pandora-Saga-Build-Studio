import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const guideSource=read('pandora-studio-honor-guide.js');
const bookSource=read('pandora-studio-hero-book.js');
const appSource=read('pandora-studio-app.js');
const css=read('pandora-studio-hero-book-additions.css');
const ui={};
Function('window',guideSource)(ui);
const guide=ui.PandoraHonorGuide;
const book={};
Function('window','document',bookSource)(book,{documentElement:{lang:'ru'}});

test('body/mind explanations contain real newlines in both locales',()=>{
 for(const [key,ru,en] of [
  ['Сопр. аном. тел.','оглушение','stun'],
  ['Сопр. аном. дух.','немота','silence']
 ]){
  const hint=guide.hints[key];
  assert.equal(hint.length,2);
  for(const copy of hint){
   assert.equal(copy.split('\n').length,3,key);
   assert.equal(copy.includes('\\n'),false,'do not display backslash n');
  }
  assert.ok(hint[0].includes(ru));
  assert.ok(hint[1].includes(en));
  assert.match(hint[0],/«Защита»/);
 }
});

test('D1 summary fields preserve existing 43-result keys and RU/EN multiline edits',()=>{
 const rows=book.PandoraStageAttributes.summaryRows({}).flatMap(group=>group.rows);
 assert.equal(rows.length,43);
 for(const [ru,index] of [['Сопр. аном. тел.',40],['Сопр. аном. дух.',41]]){
  assert.equal(rows[index].ru,ru);
  const patch={hintRu:'Описание\nНовая строка',hintEn:'Details\nNew line'};
  const overrides={['guideedit.book.summary.'+index]:JSON.stringify(patch)};
  assert.ok(guide.validOverride('book.summary.'+index,JSON.stringify(patch)));
  const actual=guide.summary(overrides,index,ru,rows[index].en);
  assert.equal(actual.hintRu,patch.hintRu);
  assert.equal(actual.hintEn,patch.hintEn);
 }
 assert.match(bookSource,/PandoraHonorGuide\?\.summary\(options\.overrides\|\|\{\},index,ru,en\)/);
 assert.match(bookSource,/guideDisplayText\(english\?record\?\.hintEn:record\?\.hintRu\)/);
 assert.match(bookSource,/guideDisplayText\(english\?info\?\.hintEn:info\?\.hintRu\)/);
 assert.match(bookSource,/options\.onTextEdit\(copy,key,field,description\)/);
 assert.match(appSource,/type:field==='hintRu'\|\|field==='hintEn'\?'textarea':'text'/);
 assert.match(appSource,/saveGuidePatch\('book\.'\+key,\{\[field\]:value\}\)/);
 assert.match(css,/\.stage-status-family-copy\{white-space:pre-line/);
});

test('results have only their existing hover help, not the extra info badge',()=>{
 assert.doesNotMatch(bookSource,/stage-status-family-info/);
 assert.doesNotMatch(css,/stage-status-family-info/);
 assert.match(bookSource,/guideLabel\(tile\.firstChild,'summary\.'\+summaryIndex\+\+/);
 assert.match(bookSource,/stage-status-family-guide/);
});

test('all twelve individual resistances are documented in RU/EN and owner-editable',()=>{
 const keys=['burn','stun','numb','tumble','knockback','sleep',
  'silence','evil','curse','disease','madness','blockBreak'];
 const expectedNames=['Ожоги','Оглушение','Заморозка','Падение',
  'Отбрасывание','Сон','Немота','Проклятие','Слабость',
  'Болезнь','Безумие','Пробитие блока'];
 const statuses=Object.fromEntries(keys.map((key,i)=>[key,i+1]));
 const rows=book.PandoraStageAttributes.defenseChapterGroups({
  resistances:{status:statuses}}).find(group=>group.key==='status').rows;
 assert.deepEqual(rows.map(row=>row.ru),expectedNames);
 for(const [i,key] of keys.entries()){
  const hint=guide.help['defense.resistStatus:'+key];
  assert.ok(Array.isArray(hint),'missing '+key);
  assert.equal(hint.length,2);
  assert.ok(hint.every(text=>text.length>=20&&text.length<240),key);
  const text={ru:rows[i].ru,en:rows[i].en,hintRu:hint[0],hintEn:hint[1]};
  const patch={hintRu:'Тестовое пояснение\nВторая строка'};
  assert.ok(guide.validOverride('book.defense.resistStatus:'+key,
   JSON.stringify(patch)),key);
  const override={['guideedit.book.defense.resistStatus:'+key]:JSON.stringify(patch)};
  const actual=guide.field(override,'defense.resistStatus:'+key,
   text.ru,text.en);
  assert.equal(actual.hintRu,patch.hintRu,key);
  assert.equal(actual.hintEn,hint[1],key);
 }
 assert.match(bookSource,/guideLabel\(labelSlot\.firstChild,\(options\.page\|\|'attack'\)\+'\.'\+row\.key/);
});
