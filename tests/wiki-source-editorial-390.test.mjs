import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-os-character-calculator.js'))(root);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(root);
Function('window',read('pandora-studio-honor-guide.js'))(root);
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const inspect=(id,records=skills)=>root.PandoraWikiSkillInsights.inspect({
 skillCatalog:records,classes,id,calculator:root.PandoraOSCalculator
});
test('game-attested static Wiki explanations have scoped owner copy with independent RU/EN CAS fields',()=>{
 const examples=[
  [220001001,'Poison'],[220001003,'Poison'],
  [340001001,'Hymn'],[340001004,'Hymn'],
  [340003001,'Hymn'],[340004001,'Hymn'],
  [240009001,'Trap'],[410002001,'Composite'],
  [430053001,'Composite'],[410004001,'Composite'],
  [213608001,'Linked']
 ];
 const identities=new Set();
 for(const [id,family] of examples){
  const evidence=inspect(id),key='osSource'+family+id;
  assert.ok(evidence,'Missing verified evidence '+id);
  const note=evidence.notes.find(n=>n.editorialKey===key);
  assert.ok(note,'Missing stable editorial identity '+key);
  assert.ok(note.ru&&note.en,'Missing RU/EN defaults '+key);
  assert.equal(identities.has(key),false,'D1 key collision '+key);
  identities.add(key);
  const editKey='wiki-ui.os-source-'+family.toLowerCase()+id;
  const overrides={
   ['guideedit.book.'+editKey]:JSON.stringify({ru:'Редакция '+id,en:'Revision '+id})
  };
  const pair=root.PandoraHonorGuide.field(overrides,editKey,note.ru,note.en);
  assert.equal(pair.ru,'Редакция '+id);
  assert.equal(pair.en,'Revision '+id);
  assert.equal(root.PandoraHonorGuide.field({},editKey,note.ru,note.en).ru,note.ru);
 }
});
test('an invalid game signature disables editorial source claims rather than assigning them to another skill',()=>{
 for(const id of [220001001,340001001,240009001,410002001,213608001]){
  const bad=structuredClone(skills);
  const record=bad[String(id)];
  assert.ok(record?.funcs?.length,id);
  record.funcs[0].fv1[3]=(record.funcs[0].fv1[3]||0)+100000;
  const evidence=inspect(id,bad);
  assert.ok(!evidence?.notes?.some(note=>
   note.editorialKey&&note.editorialKey.endsWith(String(id))&&
   note.editorialKey.startsWith('osSource')),
   'Source claim survived a changed game signature: '+id);
 }
 const source=read('pandora-studio-wiki-skill-insights.js');
 const dynamic=source.slice(source.indexOf('const jobs=Object.keys(classes)'),
  source.indexOf('const linked=sourceLinkedEvidence'));
 assert.match(dynamic,/row\.noteRu\|\|''/);
 assert.doesNotMatch(dynamic,/editorialKey/);
});


test('owner acquisition source UI separates editable missing-chance wording from live percentages and destructive controls',()=>{
 const app=read('pandora-studio-app.js');
 const start=app.indexOf('const sourceEntry=(row,itemId)=>{');
 const end=app.indexOf('const appendSourceFlow=(found,itemId)=>{',start);
 assert.ok(start>=0&&end>start,'Actual Wiki acquisition renderer must be inspected');
 const renderer=app.slice(start,end);
 assert.match(renderer,/row\.percent==null\?monsterCopy\('chanceMissing'\):row\.percent\+'%'/,
  'An absent chance is authorial bilingual copy; a real chance stays numeric');
 assert.match(renderer,/if\(row\.percent==null\)monsterBind\(chance,'chanceMissing'\)/,
  'Mounted missing-chance captions retain D1 Save/Undo bindings');
 assert.match(renderer,/monsterBind\(chance,'chanceHint','title'\)/,
  'The existing editable hint key must supply the owner instruction');
 assert.match(renderer,/type:'number',min:0,max:100/,
  'Editing the chance itself must remain strictly numeric');
 assert.match(renderer,/wt\('Удалить источник ','Remove source '\)\+\s*dataName\(row\.type,row\.id\)/,
  'Remove-source ARIA must be bilingual but keep the dynamic game name');
 assert.match(renderer,/wt\('Убрать источник получения','Remove acquisition source'\)/);
 assert.doesNotMatch(renderer,/title:'Двойной клик — изменить шанс выпадения'|title:'Убрать источник получения'/,
  'No Russian-only admin instructions in this acquisition renderer');
 const custom={'guideedit.book.wiki.monster.text.chance-missing':
  JSON.stringify({ru:'Неизвестная вероятность',en:'Chance not specified'})};
 const pair=root.PandoraHonorGuide.field(custom,
  'wiki.monster.text.chance-missing','Шанс не указан','Chance not listed');
 assert.equal(pair.ru,'Неизвестная вероятность');
 assert.equal(pair.en,'Chance not specified');
});
