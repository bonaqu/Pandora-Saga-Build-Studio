import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('origin has four local tabs instead of a long column',()=>{
 const html=get('index.html'),code=get('app.js');
 for(const section of ['race','class','passive','level'])assert.match(html,new RegExp('data-origin-section="'+section+'"'));
 assert.match(code,/function renderOriginTabs\(/);
});
test('class wizard traverses parent genealogy with back button',()=>{
 const app=get('app.js');
 assert.match(app,/jobPathKey=parentOf\(jobPathKey\)/);
 assert.match(app,/const next=records.filter\(x=>x.parent===\(jobPathKey\|\|null\)\)/);
 assert.match(app,/state.job=node.i/);
});
test('race can be activated from image or button, no disabled selection',()=>{
 const app=get('app.js');
 assert.match(app,/img.addEventListener\('click',chooseRace\)/);
 assert.doesNotMatch(app,/disabled:chosen/);
});
