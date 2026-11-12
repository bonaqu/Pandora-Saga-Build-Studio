import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator, skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const preview=(job,mastery={},int=80,catalog=skills,level=55)=>
 C.elementalSpellCoefficientPreview({skillCatalog:catalog,jobKey:job,level,
  branchMasteries:mastery,branchCaps:classes[job].branchCaps,
  stats:{int}});
const find=(arr,id)=>arr.find(x=>x.id===id);
const val=(arr,id)=>find(arr,id)?.coefficientModels?.[0]?.amount;
test('only six supported zero-secondary OS learnable spells get provisional models',()=>{
 const ids=[410001001,410002001,410004001,430001001,430052001,430053001];
 const list=[...preview('WARLOCK',{element:90,darkness:30}),
  ...preview('DARKROAR',{element:30,darkness:55})];
 for(const id of ids)assert.ok(list.some(x=>x.id===id),id);
 const unique=new Set(list.map(x=>x.id));
 assert.deepEqual([...unique].sort((a,b)=>a-b),ids.slice().sort((a,b)=>a-b));
 const unsupported=[330001001,410011001,410012001,410021001,410023001,420003001];
 for(const id of unsupported)assert.equal(find(list,id),undefined,
  'nonzero secondary coefficient must not be guessed for '+id);
});
test('current OS parameters generate explicit INT/mastery model components, not real damage',()=>{
 const element=preview('WARLOCK',{element:50,darkness:20});
 assert.equal(val(element,410001001),150);
 assert.equal(val(element,410002001),180);
 assert.equal(val(element,410004001),191);
 assert.equal(val(element,430001001),200);
 assert.equal(val(element,430052001),20);
 assert.equal(val(element,430053001),66);
 for(const row of element){
  assert.equal(row.amount,null);
  assert.equal(row.uncertain,true);
  assert.equal(row.coefficientModels[0].confidence,'coefficient-model');
  assert.match(row.detailRu,/Предположение/);
 }
});
test('250 synthetic coefficient scenarios monotone and no combat/source mutation',()=>{
 const spec=[['WARLOCK','element',410001001],
  ['WARLOCK','element',410002001],
  ['WARLOCK','element',410004001],
  ['DARKROAR','darkness',430001001],
  ['DARKROAR','darkness',430053001]];
 const prior=JSON.stringify(skills);
 let total=0;
 for(const [job,branch,id] of spec)for(let rank=0;rank<50;rank++){
  const a=preview(job,{[branch]:rank},80);
  const b=preview(job,{[branch]:rank+1},80);
  assert.ok(find(a,id)&&find(b,id),job+' '+id+' '+rank);
  assert.ok(val(b,id)>=val(a,id));
  assert.equal(find(a,id).amount,null);
  total++;
 }
 assert.equal(total,250);
 assert.equal(JSON.stringify(skills),prior);
});
test('OS vector changes update source-derived model; unsupported vector safely omits only that spell',()=>{
 const v=structuredClone(skills);
 v['410001001'].funcs.find(f=>f.ep==='EP_ELEMENT_DAMAGE').fv1[3]+=7;
 const modified=preview('WARLOCK',{element:50},80,v);
 assert.equal(val(modified,410001001),157);
 assert.equal(val(modified,410002001),180);
 v['410001001'].funcs.find(f=>f.ep==='EP_ELEMENT_DAMAGE').fv1[1]=50;
 const omitted=preview('WARLOCK',{element:50},80,v);
 assert.equal(find(omitted,410001001),undefined);
 assert.ok(find(omitted,410002001));
});
test('gates level, class, rank and INT; source previews remain read-only',()=>{
 const req=preview('MAGE',{element:20},80);
 assert.equal(find(req,410004001),undefined,'mage cap below 61 excludes skill');
 assert.equal(find(preview('WARLOCK',{element:60},80),410004001)?.available,false);
 assert.equal(find(preview('WARLOCK',{element:61},80),410004001)?.available,true);
 assert.equal(preview('WARLOCK',{element:91},80).length,0);
 assert.equal(preview('WARLOCK',{element:20},-1).length,0);
 assert.equal(preview('WARLOCK',{element:20},80,skills,0).length,0);
 const changed=structuredClone(skills);
 changed['410001001'].id=1;
 assert.equal(find(preview('WARLOCK',{element:20},80,changed),410001001),undefined);
});
test('models reuse Hero Book skill effects UI without changing stored character',()=>{
 const engine=read('pandora-os-character-calculator.js');
 const book=read('pandora-studio-hero-book.js');
 assert.match(engine,/elementalSpellCoefficientPreview\(\{/);
 assert.match(engine,/result\.offense\.push\(spell\)/);
 assert.match(book,/skill\.coefficientModels/);
 assert.match(book,/Модель по коэффициентам OS/);
});
