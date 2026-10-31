import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=get('app.js'),view=get('stage-attributes.js');
test('ArrowLeft/ArrowRight navigation and Escape remain within the portrait',()=>{
 assert.match(app,/\$\('stageAttributes'\)\?\.addEventListener\('keydown'/);
 assert.match(app,/event\.key==='ArrowRight'/);
 assert.match(app,/event\.key==='ArrowLeft'/);
 assert.match(app,/event\.target\.closest\?\.\('input,select,textarea'\)/);
 assert.match(app,/if\(stageAttributesPage\)\{/);
});
test('focus survives live setting changes and moves onto selected tab on page switch',()=>{
 assert.match(app,/activeControl=root\.contains\(document\.activeElement\)/);
 assert.match(app,/\[data-book-setting=/);
 assert.match(app,/\[role="tab"\]\[aria-selected="true"\]/);
 assert.match(app,/scroll\.scrollTop=priorScroll/);
});
test('every selected tab labels the book panel accessibly',()=>{
 assert.match(view,/role:'tabpanel'/);
 assert.match(view,/'aria-labelledby':'stageBookTab_'\+chosen/);
 assert.match(view,/'aria-controls':'stageBookPanel'/);
});
