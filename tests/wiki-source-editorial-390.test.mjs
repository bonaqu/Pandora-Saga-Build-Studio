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
