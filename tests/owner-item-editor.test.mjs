import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../worker/index.js';

const root=new URL('../',import.meta.url);
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-studio-item-owner-editor.js',root),'utf8'),ctx);
const editor=ctx.window.PandoraStudioItemOwnerEditor;
const api='https://ps-build-studio-cloud.bonaqu.workers.dev';
const auth='a'.repeat(43);
const request=(key,value,method='override',token=auth)=>
 new Request(api+'/api/admin/'+method,{method:'POST',
  headers:{Origin:'https://bonaqu.github.io',Authorization:'Bearer '+token},
  body:JSON.stringify({key,value})});
function mockDb(){
 const writes=[],values=new Map();
 return {values,writes,prepare(sql){
  const args=[];return{bind(...next){args.push(...next);return this},
   first:async()=>({id:1}),
   run:async()=>{writes.push({sql,args});
    if(sql.includes('INTO overrides'))values.set(args[0],args[1]);
    if(sql.includes('DELETE FROM overrides'))values.delete(args[0]);
    return {meta:{changes:1}}}
  };
 }};
}

test('item changes overlay source data without mutating the verified catalog',()=>{
 const base={'1':{id:1,name:'Спата',W:48,AC:null,classes:{WARRIOR:1},
  effects:[{func:'EP_AGILITY_CONST',dir:'TARGET',exclusive:null,a:1,b:null}]}};
 const edits={
  'itemedit.1':JSON.stringify({W:90,AC:15,classes:{MAGE:1},effects:[],
   sourceNote:'У торговца в стартовом городе'}),
  'item.1':'Название администратора','itemdesc.1':'Описание администратора'
 };
 const merged=editor.applyItems(base,edits);
 assert.equal(merged['1'].W,90);assert.equal(merged['1'].AC,15);
 assert.deepEqual(JSON.parse(JSON.stringify(merged['1'].classes)),{MAGE:1});
 assert.deepEqual(JSON.parse(JSON.stringify(merged['1'].effects)),[]);
 assert.equal(merged['1'].name,'Название администратора');
 assert.equal(merged['1'].sourceNote,'У торговца в стартовом городе');
 assert.equal(base['1'].W,48);
 assert.equal(base['1'].name,'Спата');
 assert.equal(base['1'].effects.length,1);
 assert.notEqual(merged['1'],base['1']);
});

test('bad owner keys or JSON never mutate source items',()=>{
 const base={'1':{id:1,W:8},'2':{id:2,W:17}};
 const changed=editor.applyItems(base,{'itemedit.1':'{"__proto__":{"danger":true}}',
  'itemedit.999':'{"W":123}','itemedit.2':'not JSON'});
 assert.equal(changed['1'].W,8);
 assert.equal(changed['2'].W,17);
 assert.equal({}.danger,undefined);
});

test('structured item overrides require authenticated requests and strict allowed property types',async()=>{
 const db=mockDb(),env={DB:db};
 const good={W:33,classes:{WARRIOR:1,CLERIC:1},
  effects:[{func:'EP_MAXLIFE_CONST',dir:'TARGET',exclusive:null,a:50,b:null}],
  sourceNote:'Ручная заметка'};
 const ok=await worker.fetch(request('itemedit.1',JSON.stringify(good)),env);
 assert.equal(ok.status,200,await ok.text().catch(()=>'')); 
 assert.equal(db.values.has('itemedit.1'),true);
 const invalid=[
  {unknown:1},
  {classes:Object.fromEntries([['__proto__',1]])},
  {effects:[{func:'javascript:alert(1)',dir:'TARGET',exclusive:null,a:1,b:null}]},
  {effects:[{func:'EP_MAXLIFE_CONST',dir:'TARGET',exclusive:null,a:'100',b:null}]},
  {sourceNote:'a'.repeat(501)},
  {W:-5},
  {classes:{MAGE:0}}
 ];
 for(const patch of invalid){
  const result=await worker.fetch(request('itemedit.1',JSON.stringify(patch)),env);
  assert.equal(result.status,400,JSON.stringify(patch).slice(0,70));
 }
 const anonymous=await worker.fetch(request('itemedit.1',JSON.stringify(good),'override','bad'),env);
 assert.equal(anonymous.status,401);
 const reset=await worker.fetch(request('itemedit.1',null,'reset'),env);
 assert.equal(reset.status,200);
 assert.equal(db.values.has('itemedit.1'),false);
});

test('all data-edit targets and runtime module loader are present',()=>{
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 const html=readFileSync(new URL('index.html',root),'utf8');
 assert.match(app,/function openWikiItemEditor/);
 assert.match(app,/PandoraStudioItemOwnerEditor\.applyItems/);
 assert.match(app,/data-lpignore/);
 assert.match(app,/data-edit-key.*item/);
 assert.match(html,/pandora-studio-item-owner-editor\.js\?v=/);
 assert.match(html,/pandora-studio-item-owner-editor\.css\?v=/);
});
