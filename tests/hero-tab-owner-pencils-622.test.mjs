import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');
const styles=read('pandora-studio-owner-inline-ui.css');

test('Book owner tabs expose direct caption editing without sibling buttons',()=>{
 assert.match(book,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(book,/button\.replaceChildren\(caption\)/);
 assert.match(book,/root\.PandoraStudioCaptionActionGuard\?\.\(button,caption\)/);
 assert.match(book,/nav\.append\(button\)/);
 assert.doesNotMatch(book,/class:'stage-book-tab-pencil'/);
 assert.doesNotMatch(styles,/\.stage-attribute-tabs>\.stage-book-tab-owner>\.stage-book-tab-pencil/);
});
test('Path owner tabs retain original IDs and capture locale of D1 edit',()=>{
 assert.match(app,/const button=\$\(id\);if\(!button\)continue/);
 assert.ok((app.match(/const editLang=lang;/g)||[]).length>=2,
  'both path tabs and mastery legend labels must capture the editing language');
 assert.match(app,/node\.dataset\.ownerCopySection='path';node\.dataset\.ownerCopyId=key/);
 assert.match(app,/caption\.dataset\.ownerCopySection='path';caption\.dataset\.ownerCopyId=key/);
 assert.match(app,/if\(section==='path'\)\{/);
 assert.match(app,/node\.closest\('\.path-tab-owner-wrap'\)/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\('path',key\),\{\[editLang\]:next\}\)/);
 assert.match(app,/if\(button\.querySelector\('\.wiki-inline-input'\)\)continue/);
 assert.match(app,/if\(wrapper\)\{wrapper\.before\(button\);wrapper\.remove\(\)\}/);
 assert.match(app,/ownerCaptionActionGuard\(button,caption\)/);
 assert.match(app,/button\.replaceChildren\(h\('span',\{text:symbol\}\),caption\)/);
 assert.doesNotMatch(app,/wrapper=h\('span',\{class:'path-tab-owner-wrap'/);
 assert.doesNotMatch(styles,/\.path-sections>\.path-tab-owner-wrap>\.path-tab-pencil/);
});
