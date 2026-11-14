import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=load('pandora-studio-app.js');
const dock=load('pandora-studio-owner-dock.css');
const editor=load('pandora-studio-owner-inline-ui.css');

test('owner commands are reorganized without rebuilding the action buttons',()=>{
 assert.match(app,/const actionSlots=new Map\(\[\.\.\.actions\.querySelectorAll\('\.owner-dock-action-slot'\)\]/);
 assert.match(app,/\['openWiki','undo','history'\]/);
 assert.match(app,/\['catalog','translations'\]/);
 assert.match(app,/\['testD1','githubExport'\]/);
 assert.match(app,/actions\.replaceChildren\(editGroup,gameGroup,toolsGroup\)/);
 assert.match(app,/actionSlots\.get\('finish'\)/);
 assert.match(app,/\[head,body,footer\]/);
 assert.match(app,/\[health,actions,guide\]/);
 assert.match(app,/decorateOwnerDockActions\(actions\)/);
 assert.match(app,/toolsGroup\.querySelector\('\.owner-dock-group-title'\)\.replaceWith\(extra\)/);
});
test('save status, pinned finish, and editable labels retain their safety behavior',()=>{
 assert.match(app,/visibleSaveState=\(ownerSaveState==='saving'/);
 assert.match(app,/state\.dataset\.state=visibleSaveState/);
 assert.match(app,/root\.dataset\.saveState=visibleSaveState/);
 assert.match(app,/if\(ownerSaveState==='error'\)/);
 assert.match(app,/if\(ownerSaveState==='saving'\|\|editIsSaving\|\|wikiLabelPendingWrites>0\)/);
 assert.match(app,/saveGuidePatch\('book\.'\+ownerCopyKey\('owner-dock',key\)/);
 assert.match(app,/ownerDockCollapsed=true/);
 assert.match(dock,/#ownerDock \.owner-dock-footer\{/);
 assert.match(dock,/#ownerDock \.owner-dock-footer \.owner-dock-finish\{/);
 assert.match(dock,/#ownerDock \.owner-dock-action-slot>button:not\(\.owner-dock-action-pencil\)\{\s*grid-column:1/);
 assert.match(dock,/#ownerDock \.owner-dock-action-slot>\.owner-dock-action-pencil\{\s*grid-column:2/);
});
test('new visual design keeps meaningful responsive actions, visible editor pens and one scroll area',()=>{
 assert.match(dock,/#ownerDock \.owner-dock-body\{[\s\S]*?overflow-y:auto/);
 assert.match(dock,/#ownerDock \.owner-dock-action-grid\{/);
 assert.match(dock,/#ownerDock \.owner-dock-group-heading\{/);
 assert.match(dock,/#ownerDock \.owner-workflow-guide>summary\{/);
 assert.match(dock,/@media\(max-width:480px\)/);
 assert.match(dock,/prefers-reduced-motion:reduce/);
 assert.match(dock,/#ownerDock \.owner-dock-action-slot:hover>\.owner-dock-action-pencil/);
 assert.match(app,/root\.setAttribute\('aria-label',lang==='en'/);
});
test('manual edit history and all admin dialogs use the improved controls',()=>{
 assert.match(app,/class:'button-action owner-manager-search-clear'/);
 assert.match(app,/clearSearch\.disabled=!q/);
 assert.match(app,/search\.value='';draw\(\);search\.focus/);
 assert.match(app,/class:'owner-manager-search-row'/);
 assert.match(editor,/\.modal:has\(\.owner-manager\)/);
 assert.match(editor,/\.owner-manager-search-row\{/);
 assert.match(editor,/\.owner-manager \.owner-review-actions \.owner-review-reset/);
 assert.match(editor,/\.owner-github-review \.button-action\.primary/);
 assert.match(editor,/\.modal:has\(\.os-sync\)/);
});
