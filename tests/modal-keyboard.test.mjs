import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
const from=app.indexOf('function modal(title,content){'),to=app.indexOf('async function apiRequest(',from);
assert.ok(from>=0&&to>from,'UI modal must be present');
const modal=app.slice(from,to);

test('dialog starts on an inert heading, not a destructive submit button',()=>{
 assert.match(modal,/const heading=h\('h2',\{text:title,tabindex:'-1'\}\)/);
 assert.match(modal,/heading\.focus\(\{preventScroll:true\}\)/);
 assert.match(modal,/role:'dialog','aria-modal':'true'/);
 assert.match(css,/\.modal h2:focus-visible/);
});
test('Escape closes the dialog and returns focus to connected opener',()=>{
 assert.match(modal,/if\(event\.key==='Escape'\)/);
 assert.match(modal,/event\.preventDefault\(\);event\.stopPropagation\(\);close\(\)/);
 assert.match(modal,/if\(origin\?\.isConnected&&typeof origin\.focus==='function'\)/);
 assert.match(modal,/origin\.focus\(\{preventScroll:true\}\)/);
});
test('Tab and Shift Tab remain inside enabled visible dialog controls',()=>{
 assert.match(modal,/if\(event\.key!=='Tab'\)return/);
 assert.match(modal,/node\.getClientRects\(\)\.length>0/);
 assert.match(modal,/event\.shiftKey&&\(active===first\|\|active===heading\)/);
 assert.match(modal,/!event\.shiftKey&&\(active===last\|\|active===heading\)/);
});
