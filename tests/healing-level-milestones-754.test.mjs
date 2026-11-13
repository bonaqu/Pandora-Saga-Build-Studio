import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const source=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const model=(level,{jobKey='CLERIC',int=70,spi=95,mastery=41,skills=source}={})=>
 C.healingSpellsPreview({jobKey,level,int,spi,benevolence:mastery,
  healingPercent:100,skillCatalog:skills,
  benevolenceCap:classes[jobKey].branchCaps.benevolence});
const find=(m,id)=>m.rows.find(row=>row.id===id);
test('Actual level gain for direct healing uses current OS coefficient and final floor',()=>{
 const current=model(45);
 for(const row of current.rows.filter(r=>r.available&&r.id!=='restoration')){
  if(!row.nextLevel)continue;
  const next=model(row.nextLevel.value).rows.find(r=>r.id===row.id);
  assert.equal(next.skillId,row.skillId,'preview stays within the exact source variant');
  assert.equal(next.amount,row.amount+row.nextLevel.gain);
  for(let level=46;level<row.nextLevel.value;level++)
   assert.equal(find(model(level),row.id).amount,row.amount);
 }
 const aid=find(current,'firstAid');
 assert.equal(aid.skillId,310001001);
 assert.deepEqual(aid.nextLevel,{value:46,remaining:1,gain:3});
 assert.equal(find(current,'sanctuary').nextLevel,null,
  'Sanctuary linked healing action has no level coefficient');
});
test('Periodic Restoration now has its missing next-level milestone in the Book row',()=>{
 const row=find(model(39),'restoration');
 assert.equal(row.available,true);
 assert.equal(row.amount,27);
 assert.deepEqual(row.nextLevel,{value:40,remaining:1,gain:1});
 assert.equal(find(model(40),'restoration').amount,28);
 assert.equal(find(model(45),'restoration').nextLevel,null,
  'No fake mastery-independent increase before the Lv55 calculation cap');
});
test('CLERIC level-50 skill variant boundary is not calculated with stale coefficients',()=>{
 const before=model(49),after=model(50);
 const aid49=find(before,'firstAid'),aid50=find(after,'firstAid');
 assert.equal(aid49.skillId,310001001);
 assert.equal(aid49.nextLevel,null);
 assert.equal(aid50.skillId,310001002);
 assert.equal(aid50.nextLevel.value,51);
 assert.ok(aid50.amount>aid49.amount,
  'Level-50 version change is separate from old-variant level scaling');
});
test('Unavailable and altered game records cannot gain source-trusted milestones',()=>{
 const forged=structuredClone(source);
 forged['310022001'].funcs[0].fv2[3]=99;
 const row=find(model(39,{skills:forged}),'restoration');
 assert.equal(row.available,false);
 assert.equal(row.nextLevel,null);
});
test('Book distinguishes improvement per cast versus per recovery pulse in both languages',()=>{
 const ui=read('pandora-studio-hero-book.js');
 assert.match(ui,/Следующий прирост /);
 assert.match(ui,/за срабатывание':'за применение/);
 assert.match(ui,/pulse\?' per pulse':' per cast'/);
 assert.match(ui,/row\.kind==='mp'\?'ОМ':'ОЗ'/);
});
