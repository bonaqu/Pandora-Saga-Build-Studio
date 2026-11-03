import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('OS class base uses exact integer-cents floor, not the old half-to-even total',()=>{
 const src=get('pandora-os-character-calculator.js');
 assert.match(src,/function halfToEven\(/);
 assert.match(src,/function classBase\(/);
 const host={};Function('window',src)(host);
 const C=host.PandoraOSCalculator;
 assert.equal(C.classBase({base:7.5,lv:0,vit:0},1,0,'vit'),7,
  '7.5 is rounded down, not half to even or nearest integer');
 assert.equal(C.classBaseComponents({base:7.5,lv:0,vit:0},1,0,'vit').rawCents,750);
 assert.equal(C.classBase({base:7.01,lv:0.12,vit:0.03},3,5,'vit'),7);
 assert.match(src,/hp:hpBase\+hpBonus.total/);
});
test('OS known ability and life effects are applied once with trace',()=>{
 const s=get('pandora-os-character-calculator.js');
 assert.match(s,/EP_VITARITY_CONST/);
 assert.match(s,/EP_MAXMANA_CONST/);
 assert.match(s,/trace.push/);
 assert.match(s,/verified:false/);
});
