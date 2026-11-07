import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const tables=JSON.parse(source('data/os/tables.json'));
const expected=[0,1,2,3,4,6,7,8,9,10,12];

function renderItem({slot='legs',grade=0,lang='ru',gem=null,AC=12,W=67}={}){
 const labels=[];
 class Node {
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.className='';this.textContent='';}
  append(...nodes){this.children.push(...nodes)}
  addEventListener(){}
  setAttribute(key,value){this[key]=String(value)}
  replaceWith(){}
  remove(){}
 }
 const document={
  documentElement:{lang},
  createElement:tag=>new Node(tag),
  createTextNode:text=>({tag:'#text',textContent:String(text)})
 };
 const ctx={document};ctx.window=ctx;
 vm.runInNewContext(source('pandora-studio-equipment-plan.js'),ctx);
 vm.runInNewContext(source('pandora-studio-enchantment.js'),ctx);
 ctx.PandoraItemPresentation={
  displayName:rec=>rec.name,
  kind:()=>lang==='en'?'Equipment':'Снаряжение',
  description:text=>text
 };
 vm.runInNewContext(source('pandora-studio-equipment-ui.js'),ctx);
 const rec={id:13041,slot,name:'Железные поножи',AC,W,level:1,soulslot:2,atkspeed:1,range:2};
 const tree=ctx.PandoraStageItemUI.summary(rec,()=>null,'item',{
  slot,refinement:grade,gem,tables,copyLabel:(key,ru,en)=>{
   labels.push({key,ru,en});return lang==='en'?en:ru;
  },editLabel:()=>{}
 });
 const dl=tree.children.find(child=>child.tag==='dl');
 assert.ok(dl,'Summary must contain a description list');
 const rows=[];
 for(let i=0;i<dl.children.length;i+=2){
  const [dt,dd]=dl.children.slice(i,i+2);
  rows.push([dt.textContent,dd.textContent,dd.dataset]);
 }
 return {rows,labels,tree};
}
const get=(rows,label)=>rows.find(([name])=>name===label)?.[1];

test('the actual item tooltip uses floor(grade×1.2), not the grade itself, in RU and EN',()=>{
 for(const lang of ['ru','en']){
  for(let grade=0;grade<=10;grade++){
   const {rows}=renderItem({lang,grade});
   const def=get(rows,lang==='ru'?'Защита':'Defense');
   assert.equal(def,grade===0?'12':'12+'+expected[grade],
    'Iron Leggings +'+grade+' / '+lang);
  }
 }
});
test('all six armor and shield categories show the common refinement bonus, jewelry does not',()=>{
 for(const slot of ['shield','head','body','gloves','legs','feet']){
  assert.equal(get(renderItem({slot,grade:5}).rows,'Защита'),'12+6',slot);
 }
 for(const slot of ['weapon','ear','cloak','ring','neck','belt'])
  assert.equal(get(renderItem({slot,grade:5}).rows,'Защита'),'12',slot);
});
test('weapon tooltip uses current physical and magical tables without double counting',()=>{
 for(const lang of ['ru','en']){
  const attack=lang==='ru'?'Атака':'Attack',magic=lang==='ru'?'Магическая атака':'Magic attack';
  const physical=renderItem({slot:'weapon',grade:8,lang,gem:{type:'physical',element:'fire'}}).rows;
  const magical=renderItem({slot:'weapon',grade:8,lang,gem:{type:'magical',element:'fire'}}).rows;
  const legacy=renderItem({slot:'weapon',grade:8,lang}).rows;
  assert.equal(get(physical,attack),'67+35');
  assert.equal(get(physical,magic),undefined);
  assert.equal(get(magical,attack),'67');
  assert.equal(get(magical,magic),'+23%');
  assert.equal(get(legacy,attack),'67+35',
   'An older equipped +8 weapon with no saved gem must match the calculator fallback');
 }
});
test('editable field names follow conditional rows in both languages and without Soul slots',()=>{
 for(const lang of ['ru','en']){
  for(const [slot,gem] of [['weapon',{type:'magical',element:'fire'}],['ring',null],['legs',null]]){
   const rendered=renderItem({slot,grade:8,lang,gem});
   const names=rendered.rows.map(r=>r[0]);
   const copyKeys=rendered.labels.map(row=>row.key);
   assert.equal(names.length,copyKeys.filter(key=>key.startsWith('field.')).length,
    'Every stat row must have its corresponding translated/editable caption for '+slot);
   assert.equal(copyKeys[names.indexOf(lang==='en'?'Defense':'Защита')],'field.defense');
   const speedIndex=names.indexOf(lang==='en'?'Speed':'Скорость');
   assert.equal(copyKeys[speedIndex],'field.speed');
   if(slot==='weapon'){
    const magicIndex=names.indexOf(lang==='en'?'Magic attack':'Магическая атака');
    assert.equal(copyKeys[magicIndex],'field.magicAttack');
   }
   if(slot==='ring')assert.equal(copyKeys.includes('field.slots'),false);
  }
 }
});
