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
 assert.doesNotMatch(app,/function openWikiItemEditor/);
 assert.match(app,/const effectOptions=window\.PandoraStudioItemOwnerEditor\.effectOptions/);
 assert.match(app,/PandoraStudioItemOwnerEditor\.applyItems/);
 assert.match(app,/data-lpignore/);
 assert.match(app,/data-edit-key.*item/);
 assert.match(html,/pandora-studio-item-owner-editor\.js\?v=/);
 assert.match(html,/pandora-studio-item-owner-editor\.css\?v=/);
});

test('single visual item patch may edit name and description without touching source data',async()=>{
 const source={'1':{id:1,name:'Original item',desc:'Original description',W:8}};
 const merged=editor.applyItems(source,{
  'itemedit.1':JSON.stringify({name:'Новый предмет',desc:'Новое описание',W:12}),
  'item.1':'Old inline name','itemdesc.1':'Old inline description'
 });
 assert.equal(merged['1'].name,'Новый предмет');
 assert.equal(merged['1'].desc,'Новое описание');
 assert.equal(merged['1'].W,12);
 assert.equal(source['1'].name,'Original item');
 const db=mockDb();
 const ok=await worker.fetch(request('itemedit.1',
  JSON.stringify({name:'Название',desc:''})),{DB:db});
 assert.equal(ok.status,200);
 for(const patch of [{name:''},{name:'a'.repeat(241)},{desc:1},{desc:'a'.repeat(2001)}]){
  const failure=await worker.fetch(request('itemedit.1',JSON.stringify(patch)),{DB:db});
  assert.equal(failure.status,400);
 }
});
test('visible owner entry points and read-only-until-focus search guards are present',()=>{
 const source=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 assert.match(source,/class:'owner-race-passive-edit'/);
 assert.doesNotMatch(source,/class:'button-action wiki-owner-pencil'/);
  assert.match(source,/function guardOwnerInput/);
 assert.doesNotMatch(source,/class:'button-action wiki-owner-desc-edit'/);
  assert.match(source,/function inlineWikiText/);
 assert.match(source,/function guardEncyclopediaSearch/);
 assert.match(source,/input\.readOnly=true/);
 assert.match(source,/input\.addEventListener\('focus'/);
 assert.match(source,/input\.addEventListener\('blur'/);
});

test('in-page editor exposes every live item effect and no dead modal entry',()=>{
 const items=JSON.parse(readFileSync(new URL('data/os/items.json',root),'utf8'));
 const choices=editor.effectOptions(items);
 const used=new Set(Object.values(items).flatMap(item=>(item.effects||[]).map(x=>x.func)));
 assert.ok(used.size>=75,'verified source effects should not shrink silently');
 for(const code of used)assert.ok(choices.some(option=>option.value===code),code);
 assert.equal(new Set(choices.map(x=>x.value)).size,choices.length);
 assert.ok(choices.every(x=>x.label&&typeof x.label==='string'));
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 assert.match(app,/class:'wiki-owner-effects'/);
 assert.match(app,/saveWikiItemField\(id,'effects'/);
 assert.doesNotMatch(app,/openWikiItemEditor/);
 assert.doesNotMatch(app,/Дополнительные эффекты'/);
});

test('inline owner kind is strictly validated and source item stays immutable',async()=>{
 const base={'17':{id:17,name:'Палаш',kind:'1H_SWORD',soulslot:0}};
 const updated=editor.applyItems(base,{'itemedit.17':JSON.stringify({kind:'2H_SWORD',twoHanded:true,soulslot:3})});
 assert.equal(updated['17'].kind,'2H_SWORD');
 assert.equal(updated['17'].twoHanded,true);
 assert.equal(updated['17'].soulslot,3);
 assert.equal(base['17'].kind,'1H_SWORD');
 const env={DB:mockDb()};
 for(const value of [{kind:'2H_SWORD'},{soulslot:3},{soulslot:0}]){
  assert.equal((await worker.fetch(request('itemedit.17',JSON.stringify(value)),env)).status,200);
 }
 for(const value of [{kind:'MY_CUSTOM_KIND'},{soulslot:4},{soulslot:1.5},{soulslot:-1}]){
  assert.equal((await worker.fetch(request('itemedit.17',JSON.stringify(value)),env)).status,400);
 }
});
test('visible encyclopedia values use in-place controls, no save-confirm buttons',()=>{
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 assert.match(app,/function editWikiValue/);
 assert.match(app,/function saveWikiItemField/);
 assert.match(app,/dd\.ondblclick=/);
 assert.match(app,/control\.onblur=/);
 assert.match(app,/wiki-owner-remove/);
 assert.match(app,/wiki-owner-plus/);
 assert.match(app,/inlineWikiText\(editable\)/);
 assert.match(app,/PandoraItemPresentation\.kindOptions/);
});

test('owner acquisition endpoints reject malformed, duplicate, or unauthorized relations',async()=>{
 const env={DB:mockDb()},key='acquireedit.101';
 for(const rows of [
  [{type:'monster',id:'20'}],[{type:'npc',id:'7'}],
  [{type:'monster',id:'20'},{type:'npc',id:'7'}]]){
  assert.equal((await worker.fetch(request(key,JSON.stringify(rows)),env)).status,200);
 }
 for(const rows of [
  [{type:'monster',id:'0'}],[{type:'zone',id:'20'}],
  [{type:'npc',id:'7',untrusted:true}],[{type:'npc',id:'7'},{type:'npc',id:'7'}],
  [{type:'monster',id:5}],Array(25).fill({type:'npc',id:'7'})]){
  assert.equal((await worker.fetch(request(key,JSON.stringify(rows)),env)).status,400);
 }
 assert.equal((await worker.fetch(request(key,'[]','override','bad'),env)).status,401);
 assert.equal((await worker.fetch(request(key,null,'reset'),env)).status,200);
});

test('NPC trade writes require valid relations and authenticated admin',async()=>{
 const env={DB:mockDb()},key='tradeedit.900000001';
 const recipe={id:900000001,i:11,npc:[7],mats:[{i:10,n:4}],
  gold:25,honor:0,exp:0};
 const value=JSON.stringify({recipe});
 assert.equal((await worker.fetch(request(key,value),env)).status,200);
 for(const wrong of [
  {recipe:{...recipe,npc:[]}},{recipe:{...recipe,i:0}},
  {recipe:{...recipe,mats:[{i:10,n:-1}]}},
  {recipe:{...recipe,npc:[7,7]}},{recipe:{...recipe,id:5}},
  {recipe:{...recipe,gold:1.3}},
  {recipe:{...recipe,password:'sneaky'}},
  {deleted:true,other:'extra'}
 ]){
  assert.equal((await worker.fetch(request(key,JSON.stringify(wrong)),env)).status,400);
 }
 assert.equal((await worker.fetch(request(key,value,'override','bad'),env)).status,401);
 assert.equal((await worker.fetch(request(key,JSON.stringify({deleted:true})),env)).status,200);
});
