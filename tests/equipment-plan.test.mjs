import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL('../equipment-plan.js',import.meta.url),'utf8'),ctx);
const p=ctx.window.PandoraEquipmentPlan;
test('old one-soul build remains readable',()=>assert.equal(p.asSocketArray({id:101}).length,1));
test('actual 0,1,2,3 socket counts are respected',()=>{for(const n of [0,1,2,3])assert.equal(p.socketCapacity({soulslot:n}),n)});
test('changing to fewer sockets preserves but flags extra soul',()=>assert.equal(p.socketReport([{id:1},{id:2}],1).excess,1));
test('soul placement checks published compatible types',()=>{assert.equal(p.validSoul({slots:['weapon']},'weapon'),true);assert.equal(p.validSoul({slots:['weapon']},'head'),false)});
test('upgrade plans are bound to item ID, not slot alone',()=>{const plans={'0:22':6,'0:23':2};assert.equal(p.refinementValue(plans,0,{id:22}),6);assert.equal(p.refinementValue(plans,0,{id:23}),2)});

test('souls are available in belts but not other jewelry or cloaks',()=>{
 for(const slot of ['cloak','ring','neck','ear'])assert.equal(p.validSoul({slots:[slot]},slot),false);
 assert.equal(p.validSoul({slots:['belt']},'belt'),true);
 assert.equal(p.canSocket('cloak',{slot:'cloak',soulslot:3}),false);
 assert.equal(p.canSocket('belt',{slot:'belt',soulslot:2}),true);
});
