import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const isolated=file=>{
 const context={window:{}};
 vm.runInNewContext(source(file),context);
 return context.window;
};
const itemEditor=isolated('pandora-studio-item-owner-editor.js').PandoraStudioItemOwnerEditor;
const wikiOwner=isolated('pandora-studio-wiki-owner-data.js').PandoraWikiOwnerData;

test('equipment editors exclude non-equipment actions and bow range from melee items',()=>{
 const items={
  1:{id:1,slot:'weapon',kind:'1H_SWORD',effects:[{func:'EP_AGILITY_CONST',a:1}]},
  2:{id:2,slot:'weapon',kind:'BOW',effects:[{func:'EP_BOW_RANGE',a:10}]},
  3:{id:3,slot:null,kind:'TOY',effects:[{func:'EP_RANDOM_BOX',a:null}]}
 };
 const sword=itemEditor.effectOptions(items,items[1]).map(x=>x.value);
 const bow=itemEditor.effectOptions(items,items[2]).map(x=>x.value);
 assert.ok(sword.includes('EP_AGILITY_CONST'));
 assert.ok(sword.includes('EP_STRENGTH_CONST'));
 assert.ok(!sword.includes('EP_BOW_RANGE'));
 assert.ok(bow.includes('EP_BOW_RANGE'));
 for(const code of ['EP_RANDOM_BOX','EP_RESTART','EP_EXPERTISE_RESET','EP_BOW_CARRY'])
  assert.ok(!sword.includes(code),'Unexpected equipment effect '+code);
 assert.equal(itemEditor.effectOptions(items,items[3]).length,0);
});

test('game-stat names follow the verified Spata and Gladius catalogue descriptions',()=>{
 const choices=itemEditor.effectOptions({1:{slot:'weapon',kind:'1H_SWORD'}});
 const names=new Map(choices.map(x=>[x.value,x.label]));
 assert.equal(names.get('EP_AGILITY_CONST'),'Проворство');
 assert.equal(names.get('EP_DEXTERITY_CONST'),'Ловкость');
 assert.equal(names.get('EP_STRENGTH_CONST'),'Сила');
});

test('skill requirements, prerequisite and classes survive immutable owner overlay',()=>{
 const original={skills:{77:{id:77,reqs:[],prereq:null,classes:{}}},
  maps:{},monsters:{},instances:[],souls:{},trades:{npcs:{}},items:{},drops:{},chests:{boxes:[]}};
 const patch={reqs:[{branch:'slash',amount:30}],prereq:78,classes:{WARRIOR:1}};
 assert.equal(wikiOwner.validPatch('skill',patch),true);
 assert.equal(wikiOwner.validPatch('skill',{reqs:[{branch:'slash',amount:-1}]}),false);
 assert.equal(wikiOwner.validPatch('skill',{classes:{WARRIOR:0}}),false);
 const merged=wikiOwner.apply(original,{'wikiedit.skill.77':JSON.stringify(patch)});
 assert.equal(merged.skills[77].reqs[0].amount,30);
 assert.equal(merged.skills[77].prereq,78);
 assert.equal(merged.skills[77].classes.WARRIOR,1);
 assert.equal(original.skills[77].prereq,null);
});

test('Worker checks owner skill patch structure before persisting',async()=>{
 const db={writes:[],prepare(sql){
  const args=[];return{
   bind(...x){args.push(...x);return this},
   first:async()=>({id:1}),
   run:async()=>{db.writes.push({sql,args});return{meta:{changes:1}}}
  };
 }};
 const request=patch=>new Request('https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
  method:'POST',headers:{Origin:'https://bonaqu.github.io',Authorization:'Bearer '+'a'.repeat(43)},
  body:JSON.stringify({key:'wikiedit.skill.77',value:JSON.stringify(patch)})
 });
 const env={DB:db};
 const valid={reqs:[{branch:'slash',amount:30}],prereq:null,classes:{WARRIOR:1}};
 const saved=await worker.fetch(request(valid),env);
 assert.equal(saved.status,200,await saved.text().catch(()=>''));
 const invalid=await worker.fetch(request({reqs:[{branch:'slash',amount:-2}]}),env);
 assert.equal(invalid.status,400);
});

test('player UI avoids internal IDs and editing retains selected wiki detail container',()=>{
 const app=source('pandora-studio-app.js');
 const tooltip=source('pandora-studio-equipment-ui.js');
 const style=source('pandora-studio-item-owner-editor.css');
 assert.doesNotMatch(tooltip,/rows\.push\(\['ID'/);
 assert.match(app,/wikiRenderSelected\?\.\(\)/);
 assert.match(app,/appendAcquisitionEditor\(id\)/);
 assert.match(app,/wiki-chest-groups wiki-chest-flat/);
 assert.match(app,/const existingIndex=overwriteId\?builds\.findIndex/);
 assert.match(style,/\.wiki-soul-price/);
 assert.match(style,/\.wiki-chest-flat/);
});
