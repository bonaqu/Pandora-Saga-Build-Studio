import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const styles=read('pandora-studio-honor.css');

test('Honor touch edit controls are independent of headings, navigation, and game data',()=>{
 assert.match(view,/const directPencil=\(action,caption\)=>/);
 assert.match(view,/class:'wiki-honor-copy-pencil wiki-honor-direct-pencil'/);
 assert.match(view,/pencil\.addEventListener\('click',event=>/);
 assert.match(view,/event\.preventDefault\(\);event\.stopPropagation\(\);action\(\)/);
 assert.match(view,/headingRow\.append\(heading\)/);
 assert.match(view,/headingRow\.append\(directPencil\(change,name\)\)/);
 assert.match(view,/titleRow\.append\(directPencil\(change,honorTitle\)\)/);
 assert.match(view,/titleRow\.append\(directPencil\(edit,name\)\)/);
 assert.match(view,/contentRow\.append\(directPencil\(startEdit,name\)\)/);
 assert.match(view,/if\(!editable\)return target/);
 assert.doesNotMatch(view,/button\.append\(directPencil/);
 assert.match(styles,/\.wiki-honor-heading-row\{display:flex/);
 assert.match(styles,/\.wiki-honor-cloak-edit-row\{display:flex/);
});

test('Honor F2 opens multiline and list text editing without replacing Enter semantics',()=>{
 assert.match(view,/event\.key==='F2'\|\|\(event\.key==='Enter'&&!multiline\)/);
 assert.match(view,/event\.key==='Enter'\|\|event\.key==='F2'/);
 assert.match(view,/event\.key==='F2'\|\|event\.key==='Enter'/);
 assert.match(view,/content\.addEventListener\('keydown',event=>/);
 assert.match(view,/if\(event\.key==='F2'\)\{event\.preventDefault\(\);startEdit\(\)\}/);
});
