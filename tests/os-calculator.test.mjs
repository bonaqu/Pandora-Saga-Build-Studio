import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('OS base maths uses source-backed class and race/job coefficients',()=>{
 const s=get('os-calculator.js');
 assert.match(s,/hp.base\+level\*hp.lv\+stats.vit\*hp.vit/);
 assert.match(s,/mp.base\+level\*mp.lv\+stats.spi\*mp.spi/);
 assert.match(s,/verified:false/);
 assert.match(s,/excluded:\['equipment'/);
});
test('calculator is loaded before main app and output is provisional',()=>{
 const html=get('index.html'),app=get('app.js');
 assert.ok(html.indexOf('os-calculator.js')<html.indexOf('src="app.js'));
 assert.match(app,/function previewBaseStats\(/);
 assert.match(app,/function renderHudEstimates\(/);
 assert.match(app,/Базовые ОЗ/);
 assert.match(app,/ОЗ ≈/);
});
