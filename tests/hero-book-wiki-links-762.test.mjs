import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-book-skill-thresholds.js'))(root);
Function('window',read('pandora-studio-encyclopedia-data.js'))(root);
const skills=JSON.parse(read('data/os/skills.json'));
const gates=root.PandoraBookSkillThresholds,wiki=root.PandoraWikiData;
const castTime={known:50,allyReduction:50,
 source:"Remaked Calc('CastSPD'), Status_78 + current OS Воодушевление"};
test('Current hero active cast uses the OS/Remaked Inspiration 50% model',()=>{
 const action={baseOnly:true,skillId:142002001,cast:5,mana:19,cooldown:10};
 assert.deepEqual(gates.inspiredCastTime({action,castTime}),{
  baseSeconds:5,seconds:2.5,percent:50});
 for(const data of [
  {action:{...action,cast:0},castTime},
  {action:{...action,baseOnly:false},castTime},
  {action:{...action,cast:-1},castTime},
  {action,castTime:{...castTime,known:100}},
  {action,castTime:{...castTime,allyReduction:0}},
  {action,castTime:{...castTime,source:'unsupported'}}
 ])assert.equal(gates.inspiredCastTime(data),null);
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/gates\?\.inspiredCastTime/);
 assert.match(book,/castTime:modifiers\?\.combat\?\.castTime/);
 assert.match(book,/gates\?\.sourceAction/);
});
test('Wiki shows direct learnable successor with shared class',()=>{
 assert.equal(skills['110101001'].name,'Двойной удар');
 assert.equal(skills['110101002'].name,'Порез');
 assert.deepEqual(wiki.skillSuccessors(110101001,skills),[110101002]);
 assert.deepEqual(wiki.skillSuccessors(110101002,skills),[]);
 assert.deepEqual(wiki.skillSuccessors('wat',skills),[]);
 const tampered={...skills,'110101002':{...skills['110101002'],learnable:false}};
 assert.deepEqual(wiki.skillSuccessors(110101001,tampered),[]);
 const foreign={...skills,'110101002':{...skills['110101002'],classes:{UNREGISTERED:1}}};
 assert.deepEqual(wiki.skillSuccessors(110101001,foreign),[]);
 assert.match(read('pandora-studio-app.js'),/PandoraWikiData\.skillSuccessors/);
});
test('Recipes, ingredient usage and unusual item actions remain accessible',()=>{
 const rows=wiki.itemSkillRelations(50056,skills);
 assert.ok(rows.some(row=>row.id==='220002001'&&row.produces.includes(50056)));
 assert.ok(rows.some(row=>row.id==='220001001'&&row.consumes.includes(50056)));
 assert.ok(wiki.itemSkillRelations(70003,skills).every(row=>skills[row.id]?.learnable===false));
 const app=read('pandora-studio-app.js');
 assert.match(app,/wiki-special-skill-uses/);
 assert.match(app,/\[\[regular,false\],\[special,true\]\]/);
});
