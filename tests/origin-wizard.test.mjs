import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('three origin tabs group race+racial passive, class, level+stats',()=>{
 const html=get('index.html'),code=get('app.js');
 for(const section of ['race','class','stats'])
  assert.match(html,new RegExp('data-origin-section="'+section+'"'));
 assert.doesNotMatch(html,/data-origin-section="passive"/);
 assert.doesNotMatch(html,/data-origin-section="level"/);
 assert.match(html,/id="originPassives"/);
 assert.match(html,/id="originStats"/);
 assert.match(code,/function renderOriginTabs\(/);
});
test('class wizard traverses parent genealogy with back button',()=>{
 const app=get('app.js');
 assert.match(app,/jobPathKey=parentOf\(jobPathKey\)/);
 assert.match(app,/const next=records.filter\(x=>x.parent===\(jobPathKey\|\|null\)\)/);
 assert.match(app,/jobPathKey=node.key;selectJob\(node.i\)/);
});
test('race can be activated from image or button, no disabled selection',()=>{
 const app=get('app.js');
 assert.match(app,/img.addEventListener\('click',chooseRace\)/);
 assert.doesNotMatch(app,/disabled:chosen/);
});
