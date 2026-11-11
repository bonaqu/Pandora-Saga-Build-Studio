import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('production admin QA only creates isolated disposable session and owner copy',()=>{
 const script=read('scripts/check-production-admin-edit.mjs');
 const flow=read('.github/workflows/production-admin-d1-qa.yml');
 assert.match(script,/--isolated-authorized/);
 assert.match(script,/guideedit\.book\.qa\.owner-copy-/);
 assert.match(script,/randomBytes\(32\)/);
 assert.match(script,/token_hash,expires/);
 assert.match(script,/\/api\/admin\/override/);
 assert.match(script,/\/api\/admin\/reset/);
 assert.match(script,/expectedValue:null/);
 assert.match(script,/expectedValue:first/);
 assert.match(script,/secondBearer/);
 assert.match(script,/Promise\.all\(\[/);
 assert.match(script,/contenders\.map\(result=>result\.status\)/);
 assert.match(script,/assertConflict\(losing/);
 assert.match(script,/expectedValue:winner/);
 assert.match(script,/expectedValue:peer/);
 assert.match(script,/Repeated stale Undo/);
 assert.match(script,/qaCount\(\),0/);
 assert.match(script,/secondSessionHash/);
 assert.match(script,/finally\s*\{/);
 assert.match(script,/DELETE FROM overrides WHERE key=/);
 assert.match(script,/DELETE FROM sessions WHERE token_hash=/);
 assert.doesNotMatch(script,/SELECT \* FROM (?:user_accounts|private_builds|shared_builds|admins)/);
 assert.match(flow,/CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
 assert.match(flow,/branches: \[bonaqu_projects\]/);
 assert.match(flow,/working-directory: worker/);
 assert.doesNotMatch(flow,/schedule:|cron:/);
});

test('production QA script parses without starting any remote process',()=>{
 const result=spawnSync(process.execPath,['--check','scripts/check-production-admin-edit.mjs'],{
  cwd:new URL('../',import.meta.url),encoding:'utf8'
 });
 assert.equal(result.status,0,result.stderr||'Unexpected JS syntax error');
});

test('Book editing keeps stable stat and header tracks, not overlay pencils',()=>{
 const book=read('pandora-studio-hero-book.js');
 const theme=read('pandora-studio-theme.css');
 const owner=read('pandora-studio-owner-inline-ui.css');
 const wiki=read('pandora-studio-wiki-polish.css');
 const app=read('pandora-studio-app.js');
 assert.match(book,/const actions=make\('span',\{class:'stage-guide-actions'/);
 assert.match(book,/const heading=make\('div',\{class:'stage-chapter-heading'/);
 assert.match(book,/const labelSlot=make\('div',\{class:'stage-chapter-label'/);
 assert.match(theme,/\.stage-result-section\[open\]/);
 assert.match(theme,/\.stage-result-section-head:focus-visible/);
 assert.match(owner,/\.stage-result-tile>\.stage-guide-actions/);
 assert.doesNotMatch(owner,/position:absolute;top:5px;right/);
 assert.match(wiki,/\.wiki-item-field-inline-editor/);
 assert.match(app,/dd\.after\(editorHost\)/);
 assert.match(app,/onCommitted:\(\)=>\{if\(stageAttributesPage/);
 assert.match(app,/else if\(key\.startsWith\('book\.'\)\)saveView\(\)/);
});
