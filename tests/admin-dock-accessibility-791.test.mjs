import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const style=readFileSync(new URL('../pandora-studio-owner-dock.css',import.meta.url),'utf8');
const browser=readFileSync(new URL('./browser-admin-entry.mjs',import.meta.url),'utf8');

test('collapsed editor launcher exposes saving and failure states',()=>{
 assert.match(app,/ownerDockCollapsed&&visibleSaveState==='error'/);
 assert.match(app,/ownerDockCollapsed&&visibleSaveState==='saving'/);
 assert.match(app,/Ошибка сохранения\. Открой редактор/);
 assert.match(app,/ownerDockPatchText\(state,saveText\)/);
 assert.match(app,/ownerDockPatchData\(state,'state',visibleSaveState\)/);
});
test('pending Wiki record writes block Finish, undo and D1 diagnostics',()=>{
 assert.match(app,/wikiRecordWriteQueue\.size>0\|\|ownerSaveState==='saving'/);
 assert.match(app,/if\(ownerSaveState==='saving'\|\|editIsSaving\|\|wikiLabelPendingWrites>0\|\|\s*wikiRecordWriteQueue\.size>0\)/);
 assert.match(app,/const visibleSaveState=\(ownerSaveState==='saving'\|\|editIsSaving/);
});
test('editor keyboard navigation and contextual Escape are predictable',()=>{
 assert.match(app,/if\(opening\)panel\.querySelector\('\.owner-dock-primary'\)\?\.focus/);
 assert.match(app,/else toggle\.focus\(\{preventScroll:true\}\)/);
 assert.match(app,/event\.target\.closest\?\.\('input,textarea,select,\[contenteditable\]'\)/);
 assert.match(browser,/Opening the drawer should focus its first action/);
 assert.match(browser,/Closing with Escape should restore launcher focus/);
});
test('editable help labels follow locale and pencils remain touch accessible',()=>{
 assert.match(app,/for\(const pencil of root\.querySelectorAll\('\.owner-workflow-copy-pencil'\)\)/);
 assert.match(style,/#ownerDock \.owner-workflow-copy-pencil\{\s*min-width:28px;min-height:28px/);
 assert.match(style,/@media\(forced-colors:active\)/);
 assert.match(browser,/Help-pencil accessibility label should follow English locale/);
});
