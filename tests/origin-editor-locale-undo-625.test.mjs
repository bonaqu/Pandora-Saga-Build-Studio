import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('Origin captures locale at editor open, not when a D1 save resolves',()=>{
 const from=app.indexOf('function editOriginCopyLabel('),to=app.indexOf('function renderOriginCopyLabels()',from);
 assert.ok(from>0&&to>from);
 const edit=app.slice(from,to);
 assert.match(edit,/const editLang=lang;/);
 assert.match(edit,/\{\[editLang\]:next\}/);
 assert.doesNotMatch(edit,/\{\[lang\]:next\}/);
 assert.match(edit,/const visible=lang===editLang\?next:originCopy\(key,ru,en\)/);
 assert.match(edit,/pencil\.dataset\.originEditFor===key/);
});
test('Origin Undo and reset update only existing copy, leaving the hero draft mounted',()=>{
 assert.match(app,/node\.dataset\.originCopyRu=ru;node\.dataset\.originCopyEn=en/);
 assert.match(app,/function refreshVisibleOriginCopy\(recordKey\)/);
 assert.match(app,/node\.dataset\.originEditing==='1'/);
 assert.match(app,/if\(originGuideKey\(key\)!==wanted\)/);
 assert.match(app,/if\(last\.key\.startsWith\('guideedit\.book\.origin\.'\)\)/);
 assert.match(app,/refreshVisibleOriginCopy\(last\.key\);saveView\(\)/);
 assert.match(app,/refreshVisibleOriginCopy\(record\.key\);saveView\(\)/);
});