import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');
const styles=read('pandora-studio-owner-inline-ui.css');

test('Hero Book owner tab pencils are native sibling actions, not nested in tabs',()=>{
 assert.match(book,/const pencil=make\('button',\{type:'button',class:'stage-book-tab-pencil'/);
 assert.match(book,/const wrapper=make\('span',\{class:'stage-book-tab-owner',role:'presentation'\}\)/);
 assert.match(book,/button\.replaceChildren\(caption\)/);
 assert.match(book,/wrapper\.append\(button,pencil\)/);
 assert.match(book,/nav\.append\(wrapper\)/);
 assert.match(book,/else nav\.append\(button\)/);
 assert.doesNotMatch(book,/button\.replaceChildren\(caption,pencil\)/);
 assert.match(styles,/\.stage-attribute-tabs>\.stage-book-tab-owner>\.stage-book-tab-pencil/);
});
test('Path owner tabs retain original IDs and capture locale of D1 edit',()=>{
 assert.match(app,/const button=\$\(id\);if\(!button\)continue/);
 assert.match(app,/const editLang=lang;/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\('path',key\),\{\[editLang\]:next\}\)/);
 assert.match(app,/if\(button\.querySelector\('\.wiki-inline-input'\)\)continue/);
 assert.match(app,/if\(wrapper\)\{wrapper\.before\(button\);wrapper\.remove\(\)\}/);
 assert.match(app,/wrapper=h\('span',\{class:'path-tab-owner-wrap',role:'presentation'\}\)/);
 assert.match(app,/button\.before\(wrapper\);wrapper\.append\(button\)/);
 assert.match(app,/wrapper\.append\(pencil\)/);
 assert.doesNotMatch(app,/button\.replaceChildren\(h\('span',\{text:symbol\}\),caption,pencil\)/);
 assert.match(styles,/\.path-sections>\.path-tab-owner-wrap>\.path-tab-pencil/);
});
