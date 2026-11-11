import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const mockDom=()=>{
 const el=(tag)=>({
  tagName:tag.toUpperCase(),children:[],dataset:{},attributes:{},
  append(...children){this.children.push(...children);return this},
  replaceWith(){},remove(){},
  replaceChildren(...children){this.text='';this.children=children},
  setAttribute(key,value){this.attributes[key]=value},
  set textContent(v){this.text=v},
  get textContent(){return (this.text??'')+
   this.children.map(child=>child.textContent??'').join('')},
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
  field.children[i].textContent,field.children[i+1].textContent,
  field.children[i+1]]);
 const name=locale==='en'?'Soul slots':'Слоты душ';
 return {slots:fields.filter(([n])=>n===name).map(([_,v])=>v),
  state:fields.find(([n])=>n===name)?.[2]?.dataset.soulFill,
  numerator:fields.find(([n])=>n===name)?.[2]?.children?.[0]?.textContent,
  aria:fields.find(([n])=>n===name)?.[2]?.attributes?.['aria-label'],
  duplicate:fields.filter(([n])=>n==='Вставлено душ'||n==='Socketed Souls')};
};
test('one slots row displays 0/2, 1/2, 2/2 and never 0/0',()=>{
 for(const [max,filled,expected] of [[2,0,'0/2'],[2,1,'1/2'],
  [2,2,'2/2'],[0,0,'0'],[1,0,'0/1']]){
  const o=slots(max,filled);
  assert.deepEqual(o.slots,[expected]);assert.deepEqual(o.duplicate,[]);
  assert.equal(o.state,max===0?undefined:filled===0?'empty':
   filled===max?'full':'partial');
  assert.equal(o.numerator,max===0?undefined:String(filled));
  assert.equal(o.aria,max===0?undefined:
   filled+' из '+max+' слотов душ занято');
 }
 const english=slots(2,1,'en');
 assert.deepEqual(english.slots,['1/2']);
 assert.equal(english.aria,'1 of 2 Soul slots occupied');
});
test('Soul slot status styles only the inserted number, never the whole row',()=>{
 const css=read('pandora-studio-equipment-tooltip.css');
 assert.match(css,/\.stage-soul-slot-count\[data-soul-fill="partial"\] \.stage-soul-count-used\{color:#d6bb86\}/);
 assert.match(css,/\.stage-soul-slot-count\[data-soul-fill="full"\] \.stage-soul-count-used\{color:#a6c39a\}/);
 assert.doesNotMatch(css,/\.stage-soul-slot-count\[data-soul-fill="empty"\] \.stage-soul-count-used\{color:/);
});
