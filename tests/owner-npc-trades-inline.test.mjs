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
