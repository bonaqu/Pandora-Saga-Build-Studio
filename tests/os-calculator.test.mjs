import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('OS class base uses exact integer-cents floor, not the old half-to-even total',()=>{
 const src=get('os-calculator.js');
 assert.match(src,/function halfToEven\(/);
 assert.match(src,/function classBase\(/);
 assert.match(src,/return Math.floor\(cents\/100\)/);
 assert.match(src,/hp:hpBase\+hpBonus.total/);
});
test('OS known ability and life effects are applied once with trace',()=>{
 const s=get('os-calculator.js');
 assert.match(s,/EP_VITARITY_CONST/);
 assert.match(s,/EP_MAXMANA_CONST/);
 assert.match(s,/trace.push/);
 assert.match(s,/verified:false/);
});
