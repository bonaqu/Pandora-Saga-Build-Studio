import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('source calculator uses half to even, not Math.round',()=>{
 const src=get('os-calculator.js');
 assert.match(src,/function halfToEven\(/);
 assert.doesNotMatch(src,/Math.round\(/);
 assert.match(src,/hp.base\+level\*hp.lv\+stats.vit\*hp.vit/);
 assert.match(src,/mp.base\+level\*mp.lv\+stats.spi\*mp.spi/);
});
test('OS known ability and life effects are applied once with trace',()=>{
 const s=get('os-calculator.js');
 assert.match(s,/EP_VITARITY_CONST/);
 assert.match(s,/EP_MAXMANA_CONST/);
 assert.match(s,/trace.push/);
 assert.match(s,/verified:false/);
});
