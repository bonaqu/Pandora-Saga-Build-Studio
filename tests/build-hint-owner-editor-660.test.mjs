import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('owner hint copy uses the existing inline CAS editor, not a new modal',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-build-comparison.css');
 const start=app.indexOf('function renderBuilds(root){');
 const end=app.indexOf('function newId(){',start);
 const render=app.slice(start,end);
 assert.match(app,/let buildHintEditorExpanded=false/);
 assert.match(render,/if\(adminEditing&&adminToken\)\{/);
 assert.match(render,/class:'build-hint-owner-panel'/);
 assert.match(render,/editor\.open=buildHintEditorExpanded/);
 assert.match(render,/buildHintEditorExpanded=editor\.open/);
 assert.match(render,/rows\.append\(h\('div',\{class:'build-hint-owner-row'\}/);
 for(const key of ['libraryHintOpen','libraryHintOverwrite',
  'libraryHintShare','libraryHintDelete','libraryHintDeleteLocal'])
  assert.match(render,new RegExp("\\['"+key+"','"));
 assert.match(render,/'data-owner-copy-key':key,text:libraryText\(key\)/);
 assert.match(app,/for\(const node of panel\.querySelectorAll\('\[data-owner-copy-key\]'\)\)/);
 assert.match(app,/return saveGuidePatch\('book\.'\+id,\{\[editLang\]:next\}\)/);
 assert.match(app,/if\(locale\.fieldKey\(button\.dataset\.buildActionHint\)===id\)/);
 assert.match(app,/button\.dataset\.guideHint=locale\.text\(button\.dataset\.buildActionHint,lang\)/);
 assert.match(css,/\.build-hint-owner-panel\{min-width:0/);
 assert.match(css,/\.build-hint-owner-row\{display:grid/);
 // A player still sees exactly four direct button actions in each card.
 assert.match(render,/const cardActions=h\('div',\{class:'build-card-actions'\}/);
 assert.doesNotMatch(render,/cardAction\([^)]*ownerCopy/);
});

test('the owner panel does not enumerate or expose user-owned identities',()=>{
 const app=read('pandora-studio-app.js');
 const a=app.indexOf("const editor=h('details',{class:'build-hint-owner-panel'})");
 const b=app.indexOf("const comparisonSlot=h('section',",a);
 assert.ok(a>0&&b>a);
 const body=app.slice(a,b);
 assert.doesNotMatch(body,/\bb\.name\b|state\.name|token|sharedUrl|password|\.id\b/);
 assert.match(body,/'Подсказки кнопок','Button hints'/);
 assert.match(body,/'Локальная копия','Local copy'/);
});
