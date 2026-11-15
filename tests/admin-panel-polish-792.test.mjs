import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=source('pandora-studio-app.js');
const catalog=source('pandora-os-catalog-workbench.js');
const historyCss=source('pandora-studio-owner-inline-ui.css');
const catalogCss=source('pandora-os-catalog-workbench.css');
const dockCss=source('pandora-studio-owner-dock.css');
const browser=source('tests/browser-admin-entry.mjs');

test('all cross-window admin actions respect the same pending D1 writes',()=>{
 assert.match(app,/function ownerSaveInFlight\(\)\{[\s\S]*?ownerWritePendingCount>0[\s\S]*?wikiRecordWriteQueue\.size>0/);
 assert.match(app,/function ownerCanStartAdminOperation\(\)/);
 assert.match(app,/function showOwnerEnglishReview\(\)\{[\s\S]*?if\(!ownerCanStartAdminOperation\(\)\)return/);
 assert.match(app,/async function showOwnerGitHubExport\(\)\{[\s\S]*?if\(!ownerCanStartAdminOperation\(\)\)return/);
 assert.match(app,/async function showCatalogImport\(\)\{[\s\S]*?ownerCanStartAdminOperation\(\)/);
 assert.match(app,/canCommit:ownerCanStartAdminOperation/);
 assert.match(app,/const resetButton=event\.currentTarget;[\s\S]*?resetButton\.disabled=true;refreshOwnerUI\(\)/);
});
test('manual history has section/session filters and compact expandable comparisons',()=>{
 assert.match(app,/class:'owner-manager-section'/);
 assert.match(app,/class:'owner-manager-session'/);
 assert.match(app,/const recentKeys=new Set\(ownerEdits\.map\(edit=>edit\.key\)\)/);
 assert.match(app,/const row=h\('details',\{class:'owner-manager-row owner-review-row'\}\)/);
 assert.match(app,/const head=h\('summary',\{class:'owner-review-heading'\}/);
 assert.match(historyCss,/\.owner-manager-filters\{/);
 assert.match(historyCss,/\.owner-manager \.owner-review-row\[open\]/);
 assert.match(browser,/Session filter cannot add unrelated D1 edits/);
});
test('catalog review search and mutating actions never bypass pending edits',()=>{
 assert.match(catalog,/const permitMutation=\(\)=>typeof canCommit/);
 assert.match(catalog,/publish\.onclick=async\(\)=>\{\s*if\(busy\|\|publish\.disabled\|\|!permitMutation\(\)\)return/);
 assert.match(catalog,/testWrite\.onclick=async\(\)=>\{\s*if\(busy\|\|!permitMutation\(\)\)return/);
 assert.match(catalog,/testCAS\.onclick=async\(\)=>\{\s*if\(busy\|\|!permitMutation\(\)\)return/);
 assert.match(catalog,/testCAS\.disabled = busy/);
 assert.match(catalog,/class:'os-sync-search-clear'/);
 assert.match(catalog,/sourceBanner\.dataset\.source=from/);
 assert.match(catalogCss,/\.os-sync-source-banner\[data-source="archive"\]/);
 assert.match(browser,/Clearing catalog search must restore the review/);
});
test('small-screen and keyboard polish retains visible controls and no extra stat cards',()=>{
 assert.match(dockCss,/#ownerDock \.owner-dock-save-state\[data-state="saving"\]/);
 assert.match(dockCss,/@media\(max-width:350px\)/);
 assert.match(historyCss,/@media\(max-width:520px\)/);
 assert.match(catalogCss,/\.os-sync-search-clear:focus-visible/);
 assert.doesNotMatch(catalog,/class:'os-sync-stat'/);
});
