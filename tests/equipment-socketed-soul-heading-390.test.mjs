import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

function fakeDom(lang){
 const document={
  documentElement:{lang},
  createElement(tag){
   return {tag,children:[],dataset:{},attributes:{},className:'',textContent:'',
    append(...nodes){this.children.push(...nodes);},
    appendChild(node){this.children.push(node);return node;},
    replaceChildren(...nodes){this.children=nodes;},
    setAttribute(key,value){this.attributes[key]=String(value);},
    addEventListener(){}};
  },
  createTextNode(value){return {textContent:String(value),children:[]};}
 };
 const window={
  PandoraItemPresentation:{
   displayName:(item)=>item.name||'Soul',kind:()=> 'Armor',
   description:value=>value,slotLabel:key=>key
  },
  PandoraEquipmentPlan:{supportsSoulSlot:()=>false},
  PandoraUIPlanner:{outfitWearers:()=>[]}
 };
 runInNewContext(read('pandora-studio-equipment-ui.js'),{window,document});
 return window;
}
const labels=element=>[element,...(element.children||[]).flatMap(labels)];
const record={id:13041,name:'Железные поножи',level:45,slot:'legs',
 AC:12,W:0,atkspeed:0,range:0,desc:'',soulslot:2};
const selectedSoul={id:999,name:'Тестовая душа',desc:'Оригинальное описание'};

test('equipped Soul section keeps a stable bilingual copy key, not Soul content',()=>{
 for(const [lang,translation,expected] of [
  ['ru','Вставленные души владельца','Вставленные души'],
  ['en','Owner Socketed Souls','Socketed Souls']
 ]){
  const root=fakeDom(lang),edits=[],calls=[];
  const context={slot:'legs',capacity:2,souls:[selectedSoul],
   copyLabel:(key,ru,en)=>{
    calls.push(key);
    return key==='socketedSoulHeading'?translation:lang==='en'?en:ru;
   },
   editLabel:(_node,key,ru,en)=>edits.push({key,ru,en})
  };
  const tree=root.PandoraStageItemUI.summary(record,()=>null,'item',context);
  const strong=labels(tree).filter(x=>x.tag==='strong');
  assert.ok(strong.some(x=>x.textContent===translation));
  assert.ok(strong.some(x=>x.textContent===record.name));
  assert.ok(strong.some(x=>x.textContent===selectedSoul.name)===false,
   'Soul record uses its own b tag rather than editorial strong text');
  assert.ok(labels(tree).some(x=>x.tag==='b'&&x.textContent===selectedSoul.name));
  assert.ok(calls.includes('socketedSoulHeading'));
  assert.deepEqual(edits.filter(x=>x.key==='socketedSoulHeading'),
   [{key:'socketedSoulHeading',ru:expected==='Вставленные души'?
    'Вставленные души':'Вставленные души',en:'Socketed Souls'}]);
  assert.equal(selectedSoul.name,'Тестовая душа','render must not rewrite gameplay data');
 }
});

test('non-owner preview keeps a localized static heading without an editor',()=>{
 for(const [locale,label] of [['ru','Вставленные души'],['en','Socketed Souls']]){
  const root=fakeDom(locale);
  const tree=root.PandoraStageItemUI.summary(record,()=>null,'item',{
   slot:'legs',souls:[selectedSoul],capacity:2
  });
  assert.ok(labels(tree).some(x=>x.tag==='strong'&&x.textContent===label));
 }
});

test('equipment copy is supported by the established CAS-validated guide key',()=>{
 const root={};root.window=root;
 runInNewContext(read('pandora-studio-honor-guide.js'),root);
 assert.equal(root.PandoraHonorGuide.validOverride(
  'book.equipment.socketed-soul-heading',
  JSON.stringify({ru:'Вставленные души владельца',en:'Owner Socketed Souls'})),true);
 const app=read('pandora-studio-app.js');
 assert.match(app,/const equipmentCopy=\(key,ru,en\)=>ownerCopy\('equipment',key,ru,en\)/);
 assert.match(app,/const equipmentCopyLabel=\(node,key,ru,en,options\)=>/);
 assert.match(app,/refreshVisibleOwnerCopy\('guideedit\.'\+key\)/);
});
