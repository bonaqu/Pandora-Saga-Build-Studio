import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),equipment=read('pandora-studio-equipment-ui.js');
const enchantHost={};
runInNewContext(read('pandora-studio-enchantment.js'),{window:enchantHost});

function harness({kind='type',id='physical',lang='en'}={}){
 const option=enchantHost.PandoraEnchantModel[kind==='type'?'types':'elements']
  .find(row=>row.id===id);
 assert.ok(option);
 const changed=new Map(),attributes={},pencilAttributes={};
 const pencil={
  getAttribute:key=>pencilAttributes[key]??null,
  setAttribute:(key,value)=>pencilAttributes[key]=value
 };
 const headingKey=kind==='type'?'gemTypeLabel':'gemElementLabel';
 const headline=kind==='type'?['Тип','Type']:['Стихия','Element'];
 const optionKey='gem.'+kind+'.'+id;
 const bound={
  'aria-label':{section:'equipment',key:headingKey,
   ru:headline[0],en:headline[1],
   suffix:': '+(lang==='en'?option.en:option.ru)}
 };
 const button={
  dataset:{enchantKey:kind,enchantValue:id,ownerInterfaceBindings:JSON.stringify(bound)},
  parentElement:{querySelector:()=>pencil},
  querySelector(){return null},
  getAttribute(key){return attributes[key]??null},
  setAttribute(key,value){attributes[key]=String(value)}
 };
 const document={querySelectorAll(selector){
  if(selector==='[data-owner-copy-section][data-owner-copy-id]')return [];
  if(selector==='[data-owner-interface-bindings]')return [button];
  if(selector==='#stagePicker [data-enchant-key][data-enchant-value]')return [button];
  return [];
 }};
 const ownerCopyKey=(section,key)=>section+'.'+String(key)
  .replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
 const ownerCopy=(section,key,ru,en)=>
  changed.get(key)??(lang==='en'?en:ru);
 const section=app.slice(app.indexOf('function refreshVisibleOwnerCopy('),
  app.indexOf('function refreshVisibleProfileCopy('));
 assert.match(section,/bindings\['aria-label'\]\.suffix=suffix/);
 // Extract the SAME idempotent helpers used by the production drawer.
 // An isolated function test must include its dependencies, not copy stubs.
 const helpers=app.slice(app.indexOf('function ownerDockPatchText(node,value){'),
  app.indexOf('function refreshOwnerUI(){'));
 assert.match(helpers,/function ownerDockPatchData\(node,key,value\)/);
 const patches=runInNewContext(helpers+
  '\n({ownerDockPatchText,ownerDockPatchAttr,ownerDockPatchData});',{});
 const context={document,window:enchantHost,lang,ownerCopyKey,ownerCopy,...patches};
 const refresh=runInNewContext(section+'\nrefreshVisibleOwnerCopy;',context);
 return {button,attributes,pencilAttributes,changed,refresh,optionKey,headingKey,option,heading:headline};
}

test('type option aria reflects its own D1 rename, heading rename and both Undo operations',()=>{
 const h=harness();
 h.changed.set(h.optionKey,'Sleek Physical');
 h.refresh('guideedit.book.equipment.gem.type.physical');
 assert.equal(h.attributes['aria-label'],'Type: Sleek Physical');
 assert.equal(h.pencilAttributes['aria-label'],'Edit caption: Sleek Physical');
 assert.equal(JSON.parse(h.button.dataset.ownerInterfaceBindings)['aria-label'].suffix,
  ': Sleek Physical');
 h.changed.set(h.headingKey,'Weapon enhancement');
 h.refresh('guideedit.book.equipment.gem-type-label');
 assert.equal(h.attributes['aria-label'],'Weapon enhancement: Sleek Physical');
 h.changed.delete(h.optionKey);
 h.refresh('guideedit.book.equipment.gem.type.physical');
 assert.equal(h.attributes['aria-label'],'Weapon enhancement: Nor');
 h.changed.delete(h.headingKey);
 h.refresh('guideedit.book.equipment.gem-type-label');
 assert.equal(h.attributes['aria-label'],'Type: Nor');
});
test('element option supports RU editing without replacing selected gem or root button',()=>{
 const h=harness({kind:'element',id:'ice',lang:'ru'});
 const originalButton=h.button;
 h.changed.set(h.optionKey,'Мороз');
 h.refresh('guideedit.book.equipment.gem.element.ice');
 assert.equal(h.attributes['aria-label'],'Стихия: Мороз');
 assert.equal(h.pencilAttributes['aria-label'],'Изменить надпись: Мороз');
 h.changed.set(h.headingKey,'Элемент');
 h.refresh('guideedit.book.equipment.gem-element-label');
 assert.equal(h.attributes['aria-label'],'Элемент: Мороз');
 h.changed.delete(h.optionKey);
 h.refresh('guideedit.book.equipment.gem.element.ice');
 assert.equal(h.attributes['aria-label'],'Элемент: Лёд');
 assert.equal(h.button,originalButton);
 assert.equal(h.button.dataset.enchantKey,'element');
 assert.equal(h.button.dataset.enchantValue,'ice');
});
test('unrelated D1 copy changes do not rewrite current gem option accessible names',()=>{
 const h=harness();
 h.refresh('guideedit.book.equipment.socket-capacity-heading');
 assert.deepEqual(h.attributes,{});
 assert.deepEqual(h.pencilAttributes,{});
});
test('live default option aria derives from exactly the same owner-edited copy as visible title',()=>{
 assert.match(equipment,/const name=copy\(captionKey,option.ru,option.en\)/);
 assert.match(equipment,/bind\(button,editKey,baseRu,baseEn,'aria-label',': '\+name\)/);
 assert.match(app,/const suffix=': '\+ownerCopy\('equipment','gem.'\+kind\+'.'\+id,option.ru,option.en\)/);
 assert.match(app,/ownerDockPatchData\(button,'ownerInterfaceBindings',JSON\.stringify\(bindings\)\)/);
});
