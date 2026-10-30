import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
test('center portrait has balanced width and large desktop side columns',()=>{
 assert.match(css,/grid-template-columns:minmax\(240px,280px\) minmax\(560px,1fr\) minmax\(335px,410px\)/);
 assert.match(css,/width:clamp\(395px,68%,495px\)/);assert.match(css,/margin-inline:auto/);
});
