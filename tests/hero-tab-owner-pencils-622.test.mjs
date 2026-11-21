import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');
const styles=read('pandora-studio-owner-inline-ui.css');

test('Hero Book tabs keep their real buttons and edit text with dblclick or F2',()=>{
 assert.match(book,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(book,/caption\.setAttribute\('aria-keyshortcuts','F2'\)/);
 assert.match(book,/button\.replaceChildren\(caption\)/);
 assert.match(book,/nav\.append\(button\)/);
 assert.match(book,/onTextEdit\(caption,'chapter\.'\+name/);
 assert.doesNotMatch(book,/class:'stage-book-tab-pencil'/);
 assert.doesNotMatch(book,/wrapper\.append\(button,pencil\)/);
});


test('Path owner tabs keep stable IDs, language snapshots and direct caption editing',()=>{
 assert.match(app,/const button=\$\(id\);if\(!button\)continue/);
 assert.match(app,/caption\.dataset\.ownerCopySection='path';caption\.dataset\.ownerCopyId=key/);
 assert.match(app,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(app,/caption\.setAttribute\('aria-keyshortcuts','F2'\)/);
 assert.match(app,/const editLang=lang/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\('path',key\),\{\[editLang\]:next\}\)/);
 assert.match(app,/button\.before\(wrapper\);wrapper\.append\(button\)/);
 assert.doesNotMatch(app,/class:'path-tab-pencil',text:'✎'/);
});

