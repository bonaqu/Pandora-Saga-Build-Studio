import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

function makeFixture(language,editable){
 const document={
  documentElement:{lang:language},
  createTextNode(text){return {tag:'#text',textContent:String(text),children:[]}},
  createElementNS(_namespace,tag){return this.createElement(tag)},
  createElement(tag){
   return {tag,children:[],className:'',dataset:{},attrs:{},textContent:'',
    append(...nodes){this.children.push(...nodes)},
    replaceChildren(...nodes){this.children=[...nodes]},
    setAttribute(key,value){this.attrs[key]=String(value);
     if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value)},
    addEventListener(){}
   };
  }
 };
 const window={PandoraEquipmentPlan:{
  canRefine:()=>false,socketCapacity:()=>0,canSocket:()=>false,
  supportsSoulSlot:slot=>['weapon','shield','head','body','gloves','legs','feet','belt'].includes(slot)
 }};
 runInNewContext(read('pandora-studio-equipment-ui.js'),{
  window,document,PandoraEquipmentPlan:window.PandoraEquipmentPlan,MouseEvent:class{}
 });
 const tree=document.createElement('section'),edits=[];
 const ru='Ячейка',en='Socket position';
 window.PandoraStageItemUI.render(tree,{
  record:null,slot:'legs',slotName:language==='en'?'Leg armor':'Штаны',
  mode:'choose',capacity:0,canEdit:editable,close:()=>{},
  copyLabel:(key,r,e)=>key==='pickerSlotHeading'?(language==='en'?en:ru):language==='en'?e:r,
  editLabel:editable?(node,key,sourceRu,sourceEn)=>edits.push({node,key,sourceRu,sourceEn}):undefined
 });
 const all=(node)=>[node,...(node.children||[]).flatMap(all)];
 return {nodes:all(tree),edits,ru,en};
}
test('player gets localized editable default without owner controls or IDs',()=>{
 for(const language of ['ru','en']){
  const data=makeFixture(language,false);
  const prefix=data.nodes.find(n=>n.className==='stage-picker-slot-prefix');
  assert.equal(prefix?.textContent,language==='en'?data.en:data.ru);
  const slot=data.nodes.find(n=>n.tag==='span'&&n.textContent===': '+(language==='en'?'Leg armor':'Штаны'));
  assert.ok(slot,'source-backed game slot remains a separate text node');
  assert.equal(data.nodes.some(n=>n.className?.includes('stage-picker-slot-pencil')),false);
  assert.equal(data.edits.length,0);
 }
});
test('owner edits just one fixed prefix; source-backed slot cannot be saved',()=>{
 const data=makeFixture('ru',true);
 const headingEdits=data.edits.filter(x=>x.key==='pickerSlotHeading');
 assert.deepEqual(headingEdits.map(x=>[x.key,x.sourceRu,x.sourceEn]),
  [['pickerSlotHeading','Слот','Slot']]);
 const prefix=headingEdits[0].node;
 assert.equal(prefix.textContent,'Ячейка');
 assert.equal(data.nodes.find(n=>n.className==='stage-picker-slot-title')
  ?.children[1].textContent,': Штаны');
 assert.ok(data.nodes.some(n=>n.className?.includes('stage-picker-slot-pencil')));
 const host={};host.window=host;
 runInNewContext(read('pandora-studio-honor-guide.js'),host);
 assert.equal(host.PandoraHonorGuide.validOverride(
  'book.equipment.picker-slot-heading',JSON.stringify({ru:'Ячейка',en:'Socket position'})),true);
});
test('app passes localized game slot independently and refreshes owner pencil after Undo',()=>{
 const app=read('pandora-studio-app.js');
 const equip=read('pandora-studio-equipment-ui.js');
 assert.match(app,/slotName:gearSlotName\(selectedSlot\)/);
 assert.match(equip,/const currentSlotName=api\.slotName\|\|/);
 assert.match(equip,/const titlePrefix=editable\(el\('span'/);
 assert.match(equip,/'pickerSlotHeading','Слот','Slot'\)/);
 assert.match(app,/section==='equipment'&&id==='pickerSlotHeading'/);
 assert.match(app,/querySelector\('\.stage-picker-slot-pencil'\)/);
 assert.doesNotMatch(equip,/data-edit-key=['"]slotName/);
});
