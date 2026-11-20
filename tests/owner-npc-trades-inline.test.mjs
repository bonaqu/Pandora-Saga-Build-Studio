import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const context={window:{}};
vm.runInNewContext(readFileSync(new URL('pandora-studio-trade-owner-data.js',root),'utf8'),context);
const overlay=context.window.PandoraStudioTradeOwnerData;
test('NPC recipe patch updates reverse item and seller indexes but not source records',()=>{
 const items={10:{name:'Iron'},11:{name:'Sword'},12:{name:'New sword'}};
 const base={trades:[{id:1,i:11,npc:[7],mats:[{i:10,n:3}],gold:100,honor:0,exp:0}],
  npcs:{7:{name:'Trader'},8:{name:'Smith'}}};
 const merged=overlay.apply(base,items,{'tradeedit.1':JSON.stringify({recipe:
  {id:1,i:12,npc:[8],mats:[{i:10,n:5}],gold:0,honor:2,exp:0}})});
 assert.equal(merged.trades[0].i,12);
 assert.equal(merged.trades[0].npc[0],8);
 assert.equal(base.trades[0].i,11);
 const del=overlay.apply(merged,items,{'tradeedit.1':JSON.stringify({deleted:true})});
 assert.equal(del.trades.length,0);
});
test('NPC overlay ignores corrupt/missing entities and allows valid new recipes',()=>{
 const items={10:{}},npcs={7:{}},base={npcs,trades:[]};
 const good={id:900000001,i:10,npc:[7],mats:[],gold:0,honor:0,exp:0};
 assert.equal(overlay.apply(base,items,{'tradeedit.900000001':JSON.stringify({recipe:good})}).trades.length,1);
 assert.equal(overlay.apply(base,items,{'tradeedit.900000001':JSON.stringify({recipe:{...good,i:999}})}).trades.length,0);
 assert.equal(overlay.apply(base,items,{'tradeedit.900000001':'not-json'}).trades.length,0);
 assert.equal(overlay.apply(base,items,{}),base);
});

test('source weekly/daily trade limits survive owner edits and are displayed in both languages',()=>{
 const items={10:{},11:{}},npcs={7:{}},base={npcs,trades:[{id:1,i:11,npc:[7],
  mats:[{i:10,n:3}],gold:0,honor:0,exp:0,limit:{n:3,period:'weekly'}}]};
 const patch={...base.trades[0],gold:50};
 const changed=overlay.apply(base,items,{'tradeedit.1':JSON.stringify({recipe:patch})});
 assert.equal(changed.trades[0].limit.n,3);
 assert.equal(changed.trades[0].limit.period,'weekly');
 assert.equal(base.trades[0].gold,0);
 assert.equal(overlay.limitLabel({n:3,period:'weekly'}),'3 раза в неделю');
 assert.equal(overlay.limitLabel({n:1,period:'daily'}),'1 раз в день');
 assert.equal(overlay.limitLabel({n:3,period:'weekly'},'en'),'3 per week');
 assert.equal(overlay.limitLabel(null),'Без ограничений');
 assert.equal(overlay.limitLabel(null,'en'),'No limit');
 assert.equal(overlay.limitLabel({n:-1,period:'daily'}),'Ограничение не подтверждено');
});
test('limits are validated per recipe, not inherited from its merchant',()=>{
 const items={10:{},11:{}},npcs={7:{}},base={npcs,trades:[]};
 const recipe={id:1,i:11,npc:[7],mats:[],gold:0,honor:0,exp:0,
  limit:{n:1,period:'daily'}};
 assert.equal(overlay.recipeValid(recipe,items,npcs),true);
 assert.equal(overlay.recipeValid({...recipe,limit:{n:3,period:'weekly'}},items,npcs),true);
 assert.equal(overlay.recipeValid({...recipe,limit:undefined},items,npcs),true);
 for(const bad of [{n:0,period:'daily'},{n:1,period:'monthly'},
  {n:1.5,period:'weekly'},{n:1,period:'weekly',debug:'x'}]){
  assert.equal(overlay.recipeValid({...recipe,limit:bad},items,npcs),false);
 }
 const display=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 assert.match(display,/PandoraStudioTradeOwnerData\.limitLabel\(limitData,lang\)/);
 assert.match(display,/entry\.append\(limitRow\)/);
 assert.match(display,/limit:nextLimit/);
});

test('NPC save normalization preserves a live limit even when another field is edited',()=>{
 const source=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 assert.match(source,/recipe\.limit!=null\?\{limit:\{n:Number\(recipe\.limit\.n\),period:recipe\.limit\.period\}\}/);
});

test('40 NPC trade copy captions use stable D1 RU/EN and preserve real limits',()=>{
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 const body=app.slice(app.indexOf('const wikiNpcTradeRows='),app.indexOf('const wikiChestDisplayRows='));
 const rows=[...body.matchAll(/^ \["([^"]+)","([^"]+)","([^"]+)"\],?$/gm)];
 assert.equal(rows.length,40);
 assert.equal(new Set(rows.map(x=>x[1])).size,rows.length);
 const env={window:{}};
 vm.runInNewContext(readFileSync(new URL('pandora-studio-honor-guide.js',root),'utf8'),env);
 const guide=env.window.PandoraHonorGuide;
 for(const [key,ru,en] of [
  ['searchPlaceholder','Найти предмет или материал…','Find an item or material…'],
  ['deleteTrade','Удалить обмен','Delete trade'],
  ['deleteConfirm','Подтвердить удаление','Confirm deletion'],
  ['counterOf','из','of'],
  ['tradeLimit','Лимит обмена','Trade limit']
 ]){
  const id='wiki.npc.trade.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  const overrides={['guideedit.book.'+id]:JSON.stringify({ru:'Изменено',en:'Edited'})};
  assert.equal(guide.field(overrides,id,ru,en).ru,'Изменено');
  assert.equal(guide.field(overrides,id,ru,en).en,'Edited');
  assert.equal(guide.field({},id,ru,en).ru,ru);
 }
 assert.match(app,/ownerInterfaceEditor\(\s*'wiki\.npc\.trade',wikiNpcTradeRows/);
 assert.match(app,/npcTradeBind\(counter,'counterOf','text',' '\+cards\.length,visible\+' '\)/);
 assert.match(app,/npcTradeBind\(recipeSearch,'searchPlaceholder','placeholder'\)/);
 assert.match(app,/npcTradeBind\(recipeSearch,'searchAria','aria-label'\)/);
 assert.match(app,/node\.dataset\.placeholder=value/);
 assert.match(app,/remove\.addEventListener\('blur',resetDelete\)/);
 assert.match(app,/event\.preventDefault\(\);event\.stopPropagation\(\);resetDelete\(\)/);
 assert.doesNotMatch(app,/remove\.textContent='Повторить, чтобы удалить'/);
 const src={npcs:{7:{}},trades:[{id:1,i:11,npc:[7],mats:[{i:10,n:3}],gold:55,
  honor:2,exp:0,limit:{n:3,period:'weekly'}}]};
 const before=JSON.stringify(src);
 const noTradeChanges=overlay.apply(src,{10:{},11:{}},{
  'guideedit.book.wiki.npc.trade.delete-trade':JSON.stringify({ru:'Изменено'})
 });
 assert.equal(JSON.stringify(noTradeChanges),before,
  'Editing a UI label cannot alter NPC recipes or their quota');
});

test('created-entity deletion copy uses four distinct safe RU/EN keys',()=>{
 const app=readFileSync(new URL('pandora-studio-app.js',root),'utf8');
 const begin=app.indexOf('const wikiNpcTradeRows=');
 const end=app.indexOf('const wikiNpcTradeByKey=',begin);
 const block=app.slice(begin,end);
 for(const key of ['deleteRecordButton','deleteRecordLinked','deleteRecordConfirm','deleteRecordFailure'])
  assert.ok(block.includes('['+JSON.stringify(key)+','),'Missing editable deletion copy '+key);
 assert.ok(app.includes("verifyUncertain:true"));
});
