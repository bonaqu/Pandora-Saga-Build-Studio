import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const globalCss=read('pandora-studio-item-owner-editor.css');
const ownerCss=read('pandora-studio-owner-inline-ui.css');

test('one plaintext editor underlies text and textarea admin editing',()=>{
 const from=app.indexOf('function ownerPlainTextField(attrs={}');
 const to=app.indexOf('function guardOwnerInput',from);
 const code=app.slice(from,to);
 assert.ok(from>=0&&to>from);
 assert.match(code,/contenteditable:'plaintext-only'/);
 assert.match(code,/'data-owner-text-field':'true'/);
 assert.match(code,/'aria-multiline':multiline\?'true':'false'/);
 assert.match(app,/class:'wiki-inline-input wiki-owner-plaintext owner-editor-unified'/);
 assert.match(app,/type==='textarea'\|\|type==='text'\?ownerPlainTextField/);
});
test('long labels and descriptions expand rather than hide or ellipsize text',()=>{
 assert.match(globalCss,/\[data-owner-text-field\]\[aria-multiline="false"\]:not\(\.wiki-owner-search\)/);
 assert.match(globalCss,/white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word/);
 assert.match(globalCss,/\.wiki-owner-plaintext\.wiki-inline-input\[data-owner-text-field\]/);
 assert.match(globalCss,/height:auto;max-height:none/);
 assert.match(ownerCss,/\.wiki-inline-input\[data-owner-text-field\]:not\(\.wiki-owner-search\)/);
 assert.match(ownerCss,/\.ui-content-edit-host\{display:inline-flex;flex:1 1 230px/);
 assert.match(ownerCss,/max-height:min\(65dvh,480px\)/);
 assert.match(ownerCss,/overflow-y:auto;overflow-x:hidden/);
});
test('a later locale switch does not remap the ongoing copy edit',()=>{
 const from=app.indexOf('function bindStaticUICopyEditors(){');
 const to=app.indexOf('// Edit only semantically keyed authored labels',from);
 const code=app.slice(from,to);
 assert.ok(from>=0&&to>from);
 assert.equal((code.match(/const editLang=lang,current=locale\.text\(key,editLang\)/g)||[]).length,2);
 assert.equal((code.match(/saveGuidePatch\('book\.'\+id,\{\[editLang\]:next\}\)/g)||[]).length,2);
 assert.doesNotMatch(code,/saveGuidePatch\('book\.'\+id,\{\[lang\]:next\}\)/);
 assert.match(code,/const syncPencil=\(pencil,key,hint=false\)=>/);
 assert.match(code,/node\.dataset\[datasetKey\]/);
 assert.doesNotMatch(code,/locale\.apply\(lang\)/);
});
