import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),s=p=>readFileSync(new URL(p,root),'utf8');
const scope={};Function('window',s('os-calculator.js'))(scope);
test('resistance and accuracy stats map to source effect codes',()=>{
 const summary=scope.PandoraOSCalculator.gatherEffects([
  ['weapon',{effects:[{func:'EP_FIRE_RESISTANCE_CONST',a:10},{func:'EP_TOHIT_CONST',a:7},
    {func:'EP_IMMUNE_BURN',a:1}]},0],
  ['soul',{effects:[{func:'EP_FIRE_RESISTANCE_CONST',a:5}]},0]
 ]);
 assert.equal(summary.bonuses.fire,15);
 assert.equal(summary.bonuses.accuracy,7);
 assert.equal(summary.bonuses.burn,1);
 assert.deepEqual(summary.ignored,[]);
 assert.equal(summary.trace.length,4);
});
test('stage renderer labels source bonuses rather than pretending to know final stats',()=>{
 const view=s('stage-attributes.js');
 assert.match(view,/Известные бонусы снаряжения и душ/);
 assert.doesNotMatch(view,/частичный расчёт/);
});
