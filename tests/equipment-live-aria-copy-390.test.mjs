import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const equipment=read('pandora-studio-equipment-ui.js');
const app=read('pandora-studio-app.js');

test('Soul capacity controls use the same bilingual D1 source as the visible legend',()=>{
 assert.match(equipment,/copy\('socketCapacityHeading',\s*'Слоты душ','Soul slots'\)/);
 assert.match(equipment,/const btn=bind\(el\('button',\{type:'button',text:String\(n\)/);
 assert.match(equipment,/onclick:\(\)=>api\.updateSocketCapacity\(n\)\}\),\s*'socketCapacityHeading','Слоты душ','Soul slots','aria-label',': '\+n\)/);
 assert.doesNotMatch(equipment,/'aria-label':tr\('Слоты душ: ','Soul slots: '\)\+n/);
});

test('gem option aria prefixes follow edited type/element headings, not old hardcoded names',()=>{
 const start=equipment.indexOf('const group=(label,entries,key)=>');
 const end=equipment.indexOf('if(slot===\'weapon\')body.append(group(',start);
 const group=equipment.slice(start,end);
 assert.ok(group.length>500,'gem group must exist');
 assert.match(group,/const editKey=key==='type'\?'gemTypeLabel':'gemElementLabel'/);
 assert.match(group,/bind\(button,editKey,baseRu,baseEn,'aria-label',': '\+name\)/);
 assert.doesNotMatch(group,/'aria-label':label\+': '\+name/);
 assert.match(group,/line\.append\(labeledAction\(button,captionKey,option.ru,option.en,iconText\)\)/);
});

test('shared admin binding recalculates accessible labels on save and undo without reselecting gear',()=>{
 assert.match(equipment,/if\(api\.bindInterfaceText\)return api\.bindInterfaceText\(node,key,ru,en,attribute,suffix\)/);
 assert.match(app,/function bindOwnerInterfaceText\(node,section,key,ru,en,attribute='text',suffix=''\)/);
 assert.match(app,/bindings\[attribute\]=\{section,key,ru,en,suffix\}/);
 assert.match(app,/function applyOwnerInterfaceEditedValue\(section,key,visible\)/);
 assert.match(app,/const value=ownerCopy\(section,id,ru,en\)\+\(suffix\|\|''\)/);
 assert.match(app,/refreshVisibleOwnerCopy\('guideedit\.'\+key\)/);
 assert.match(equipment,/'data-socket-capacity':String\(n\)/);
});
