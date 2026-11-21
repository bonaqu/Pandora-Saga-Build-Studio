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
 assert.match(app,/ownerGuidePendingWrites>0\|\|wikiRecordWriteQueue\.size>0/);
 assert.match(app,/if\(ownerSaveInFlight\(\)\)/);
 assert.match(app,/const visibleSaveState=saving\?'saving':ownerSaveState/);
});
test('editor keyboard navigation and contextual Escape are predictable',()=>{
 assert.match(app,/if\(opening\)panel\.querySelector\('\.owner-dock-primary'\)\?\.focus/);
 assert.match(app,/else toggle\.focus\(\{preventScroll:true\}\)/);
 assert.match(app,/event\.target\.closest\?\.\('input,textarea,select,\[contenteditable\]'\)/);
 assert.match(browser,/Opening the drawer should focus its first action/);
 assert.match(browser,/Closing with Escape should restore launcher focus/);
});
test('owner help captions edit directly and retain keyboard access',()=>{
 assert.match(app,/guide\.querySelectorAll\('\[data-owner-dock-static\]'\)/);
 assert.match(app,/ownerCopyLabel\(node,'owner-dock',key,pair\[0\],pair\[1\]\)/);
 assert.doesNotMatch(app,/class:'owner-workflow-copy-pencil'/);
 assert.match(app,/ownerCopyLabel\(node,'owner-dock',key,pair\[0\],pair\[1\]\)/);
 assert.match(style,/@media\(forced-colors:active\)/);
 assert.match(browser,/Control\+Alt\+Shift\+P/);
 assert.doesNotMatch(app,/owner-workflow-copy-pencil|owner-dock-action-pencil/);
 assert.doesNotMatch(style,/owner-workflow-copy-pencil|owner-dock-action-pencil|owner-dock-group-pencil/);
});
