import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('admin actions have bilingual D1 guide keys, isolated pencil and no double-click action side effects',()=>{
 const app=get('pandora-studio-app.js');
 const from=app.indexOf('const ownerDockText=Object.freeze({');
 const end=app.indexOf('function refreshOwnerUI(){',from);
 assert.ok(from>0&&end>from);
 const source=app.slice(from,end);
 for(const key of ['openWiki','undo','history','catalog','translations','testD1',
  'githubExport','finish','extra','guide','title','online'])
  assert.match(source,new RegExp('\\b'+key+':\\['));
 assert.match(source,/ownerCopy\('owner-dock',key,pair\[0\],pair\[1\]\)/);
 assert.match(source,/function decorateOwnerDockActions\(actions\)/);
 assert.match(source,/button\.before\(slot\);slot\.append\(button,pencil,host\)/);
 assert.match(source,/pencil\.onclick=event=>\{/);
 assert.match(source,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.match(source,/const editLang=lang,before=ownerDockCopy\(key\)/);
 assert.match(source,/editWikiValue\(host,before,\{/);
 assert.match(source,/saveGuidePatch\('book\.'\+ownerCopyKey\('owner-dock',key\),\{\[editLang\]:next\}\)/);
 assert.match(source,/onFinished:\(\)=>\{/);
 assert.doesNotMatch(source,/button\.ondblclick|button\.addEventListener\('dblclick'/);
});

test('editor pencils stay in the button grid cell while the input expands',()=>{
 const css=get('pandora-studio-owner-dock.css');
 assert.match(css,/\.owner-dock-action-slot\{\s*display:grid;grid-template-columns:minmax\(0,1fr\) 23px/);
 assert.match(css,/\.owner-dock-action-slot:has\(>\.owner-en-sync\[hidden\]\)/);
 assert.match(css,/\.owner-dock-action-slot\.owner-dock-action-wide\{grid-column:1\/-1\}/);
 assert.match(css,/\.owner-dock-action-slot>\.owner-dock-action-pencil\{/);
 assert.match(css,/\.owner-dock-action-edit-host\[hidden\]\{display:none\}/);
 assert.match(css,/\.owner-dock-action-edit-host \.wiki-inline-input\{/);
});

test('admin copy Undo and reset update the existing drawer, not the game catalog',()=>{
 const app=get('pandora-studio-app.js');
 assert.match(app,/if\(key\.startsWith\('owner-dock\.'\)\)\{refreshOwnerUI\(\);return\}/);
 assert.match(app,/key\.startsWith\('book.owner-dock\.'\)/);
 assert.match(app,/guideedit\\\.book\\\.\(equipment\|path\|catalog-sync\|honor-view\|owner-dock\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\)/);
 assert.match(app,/record\.key\.startsWith\('guideedit.book.owner-dock\.'\)/);
 assert.match(app,/Saving to Cloudflare D1/);
 assert.match(app,/ownerDockCopy\('translations'\)/);
 assert.match(app,/data-owner-dock-static/);
});
