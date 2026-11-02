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
