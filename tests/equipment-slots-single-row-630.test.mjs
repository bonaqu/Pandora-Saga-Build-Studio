import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const mockDom=()=>{
 const el=(tag)=>({
  tagName:tag.toUpperCase(),children:[],dataset:{},attributes:{},
  append(...children){this.children.push(...children);return this},
  replaceWith(){},remove(){},setAttribute(key,value){this.attributes[key]=value},
  set textContent(v){this.text=v},
  get textContent(){return this.text??''},
  get className(){return this.attributes.class||''},
  set className(v){this.attributes.class=v}
 });
 const document={documentElement:{lang:'ru'},createElement:el,
  createTextNode:text=>({textContent:text})};
 return {document,el};
};
const slots=(capacity,filled,locale='ru')=>{
 const {document}=mockDom();document.documentElement.lang=locale;
 const ctx={document};
 ctx.window=ctx;
 ctx.PandoraEquipmentPlan={supportsSoulSlot:()=>true};
 ctx.PandoraItemPresentation={displayName:item=>item.name,kind:()=>''};
 ctx.PandoraUIPlanner={outfitWearers:()=>[]};
 runInNewContext(read('pandora-studio-equipment-ui.js'),ctx);
 const record={id:11,name:'Тест',slot:'pants',soulslot:capacity,level:1};
 const wrap=ctx.PandoraStageItemUI.summary(record,()=>null,'item',
  {slot:'pants',capacity,socketedCount:filled,copyLabel:(k,ru,en)=>locale==='en'?en:ru});
 const field=wrap.children.find(el=>el.tagName==='DL');
 const fields=[];
 for(let i=0;i<field.children.length;i+=2)fields.push([
  field.children[i].textContent,field.children[i+1].textContent]);
 const name=locale==='en'?'Slots':'Слоты';
 return {slots:fields.filter(([n])=>n===name).map(([_,v])=>v),
  duplicate:fields.filter(([n])=>n==='Вставлено душ'||n==='Socketed Souls')};
};
test('one slots row displays 0/2, 1/2, 2/2 and never 0/0',()=>{
 for(const [max,filled,expected] of [[2,0,'0/2'],[2,1,'1/2'],
  [2,2,'2/2'],[0,0,'0'],[1,0,'0/1']]){
  const o=slots(max,filled);
  assert.deepEqual(o.slots,[expected]);assert.deepEqual(o.duplicate,[]);
 }
 assert.deepEqual(slots(2,1,'en').slots,['1/2']);
});
