import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cls=JSON.parse(read('data/os/classes.json'));
const scope={};Function('window',read('os-calculator.js'))(scope);
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const build=level=>scope.PandoraOSCalculator.base({
 classData:cls.CLERIC,
 raceData:{...zero,vit:49,spi:53},jobData:zero,allocation:zero,level
});
test('full class formula accepts planned 55 even though live server may temporarily cap at 45',()=>{
 const last=build(55),current=build(45);
 assert.ok(last&&current);
 assert.equal(last.hpBase>=current.hpBase,true);
 assert.equal(last.mpBase>=current.mpBase,true);
});
test('the actual build calculator rejects levels outside the 1–55 planning contract',()=>{
 assert.equal(build(0),null);
 assert.equal(build(-1),null);
 assert.equal(build(56),null);
 assert.equal(build(99),null);
 assert.equal(build(1.5),null);
 assert.ok(build(1));
});
test('live readiness checks separately require cloud build-library D1 migration',()=>{
 const script=read('scripts/check-live-connections.mjs');
 assert.match(script,/features\?\.library===true/);
 assert.match(script,/D1 cloud build library/);
 assert.match(script,/connection diagnostics/i);
});
