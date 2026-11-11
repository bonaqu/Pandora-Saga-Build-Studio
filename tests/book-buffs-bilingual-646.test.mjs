import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);
const guide=root.PandoraHonorGuide;

test('Buff section and select guide editors receive independent RU/EN default fields',()=>{
 const source=read('pandora-studio-hero-book.js');
 assert.match(source,/const section=\(ru,en,stableId=null\)=>/);
 assert.match(source,/const select=\(parent,ru,en,key,levels,vital=false,compact=false\)=>/);
 assert.match(source,/section\('Боевые умения','Combat skills'\)/);
 assert.match(source,/section\('ОЗ и ОМ','Vitals'\)/);
 assert.match(source,/select\(guild,'Гильдейское ОЗ','Guild HP','guildHp'/);
 assert.match(source,/select\(guild,'Гильдейское ОМ','Guild MP','guildMp'/);
 assert.match(source,/guideLabel\(field.firstChild,'buffs.setting.'\+key,\s*ru,en,options\)/);
 assert.match(source,/\'buffs.section.\'\+\(stableId\|\|sectionIndex\+\+\),ru,en,options/);
 assert.doesNotMatch(source,/name,name,options/);
});

test('D1 guide fallback and explicit overrides keep the two languages isolated',()=>{
 const key='buffs.setting.guildHp';
 assert.equal(guide.validOverride('book.'+key,JSON.stringify({ru:'ОЗ гильдии',en:'Guild vitality'})),true);
 const initial=guide.field({},key,'Гильдейское ОЗ','Guild HP');
 assert.equal(initial.ru,'Гильдейское ОЗ');
 assert.equal(initial.en,'Guild HP');
 const edited=guide.field({['guideedit.book.'+key]:JSON.stringify({ru:'ОЗ гильдии',en:'Guild vitality'})},
  key,'Гильдейское ОЗ','Guild HP');
 assert.equal(edited.ru,'ОЗ гильдии');
 assert.equal(edited.en,'Guild vitality');
 const rejected=guide.field({['guideedit.book.'+key]:'{bad JSON'},
  key,'Гильдейское ОЗ','Guild HP');
 assert.equal(rejected.ru,'Гильдейское ОЗ');
 assert.equal(rejected.en,'Guild HP');
});
