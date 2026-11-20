import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book=read('pandora-studio-hero-book.js');
const app=read('pandora-studio-app.js');
const styles=read('pandora-studio-owner-inline-ui.css');

test('Hero Book tabs preserve navigation with direct RU/EN caption editing',()=>{
 assert.match(book,/button\.replaceChildren\(caption\)/);
 assert.match(book,/nav\.append\(button\)/);
 assert.match(book,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(book,/guardBookCaption\(button,caption\)/);
 assert.doesNotMatch(book,/stage-book-tab-pencil/);
 assert.match(book,/onTextEdit\(caption,'chapter\.'\+name/);
});
test('Path tabs keep original IDs, D1 locale capture and safe caption double-click',()=>{
 assert.match(app,/const button=\$\(id\);if\(!button\)continue/);
 assert.match(app,/const editLang=lang/);
 assert.match(app,/caption\.dataset\.ownerCopySection='path'/);
 assert.match(app,/onCommit:next=>saveGuidePatch\('book\.'\+ownerCopyKey\('path',key\),\{\[editLang\]:next\}\)/);
 assert.match(app,/ownerCaptionActionGuard\(button,caption\)/);
 assert.match(app,/button\.before\(wrapper\);wrapper\.append\(button\)/);
 assert.doesNotMatch(app,/class:'path-tab-pencil'/);
});
