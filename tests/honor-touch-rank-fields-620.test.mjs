import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const css=read('pandora-studio-honor.css');

test('owner Honor rank fields have a compact touch pencil without changing player markup',()=>{
 assert.match(view,/if\(!editable\)return target/);
 assert.match(view,/const wrap=make\('div',\{class:'wiki-honor-field-edit-row'/);
 assert.match(view,/wrap\.append\(target,directPencil\(start,kind\)\)/);
 assert.match(view,/isRequirement\?' is-rank-requirement'/);
 assert.match(view,/isBenefit\?' is-rank-benefit'/);
 assert.match(css,/\.wiki-honor-field-edit-row\{display:flex/);
 assert.match(css,/\.wiki-honor-rank>\.wiki-honor-field-edit-row\.is-rank-requirement\{/);
 assert.match(css,/\.wiki-honor-rank>\.wiki-honor-field-edit-row\.is-rank-benefit\{/);
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
});

test('owner save refreshes accessible captions of existing pencils in-place',()=>{
 assert.match(view,/editCopy\(target,key,ru,english,\{/);
 assert.match(view,/onCommitted:next=>pencil\.setAttribute\('aria-label'/);
 assert.match(view,/onCommitted:visible=>\{\s*caption\.textContent=visible;\s*pencil\.setAttribute\('aria-label'/);
 assert.match(view,/onFinished:restore/);
 assert.match(view,/button\.hidden=true;pencil\.hidden=true;host\.hidden=false/);
});
