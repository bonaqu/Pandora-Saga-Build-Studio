import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const view=read('pandora-os-catalog-workbench.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-os-catalog-workbench.css');
const guideRoot={};guideRoot.window=guideRoot;
runInNewContext(read('pandora-studio-honor-guide.js'),guideRoot);

test('catalog workbench labels have stable RU/EN D1 identifiers',()=>{
 const labels=['title','introExplanation','archiveExplanation','reviewExplanation',
  'formattingExplanation','russianDescriptionExplanation','checksumExplanation',
  'advancedExplanation','liveButton','archiveButton','acceptAllButton',
  'declineAllButton','publishButton','testWriteButton','testCasButton',
  'githubButton','exportButton'];
 for(const key of labels){
  assert.ok(view.includes("'"+key+"'"),key);
  const d1='book.catalog-sync.'+key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(guideRoot.PandoraHonorGuide.validOverride(d1,
   JSON.stringify({ru:'Подпись',en:'Caption'})),true,d1);
 }
 assert.match(view,/copyLabel\?\.\(key,ru,en\)\|\|tr\(ru,en\)/);
 assert.match(view,/editLabel\(node,key,ru,en\)/);
 assert.match(app,/ownerCopy\('catalog-sync',key,ru,en\)/);
 assert.match(app,/node,'catalog-sync',key,ru,en,callbacks/);
});

test('catalog editor edits real captions directly and never activates publish on a double-click',()=>{
 assert.match(view,/const wrap=h\('span',\{class:'os-sync-action-editor'/);
 assert.match(view,/wrap\.addEventListener\('dblclick'/);
 assert.match(view,/wrap\.addEventListener\('keydown'/);
 assert.match(view,/button\.addEventListener\('click',event=>/);
 assert.match(view,/event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/);
 assert.match(view,/button\.hidden=true;host\.hidden=false/);
 assert.match(view,/host\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(view,/onFinished:\(\)=>\{button\.hidden=false;host\.hidden=true\}/);
 assert.match(view,/const authored=\(tag,attrs,key,ru,en\)=>/);
 assert.match(view,/editLabel\(node,key,ru,en\)/);
 assert.match(view,/class:'os-sync-copy-field'/);
 assert.match(view,/caption\.addEventListener\('click'/);
 assert.match(view,/const box=caption\.closest\('label'\)\?\.querySelector/);
 assert.match(view,/box\.click\(\)/);
 for(const legacy of ['os-sync-owner-pencil','os-sync-copy-pencil',
  'os-sync-choice-pencil','os-sync-state-pencil']){
  assert.equal(view.includes(legacy),false,'Removed visible caption pencil: '+legacy);
  assert.equal(css.includes(legacy),false,'Removed decorative caption CSS: '+legacy);
 }
 assert.match(css,/\.os-sync-action-editor>\.button-action:disabled\{pointer-events:none\}/);
 assert.match(css,/\.os-sync-actions>\.os-sync-action-editor\{width:100%\}/);
 assert.match(css,/\.os-sync-action-edit-host\.origin-copy-editable::after\{content:none\}/);
 assert.match(css,/\.os-sync-copy-field>\.origin-copy-editable::after\{content:none\}/);
});

test('catalog copy Undo refreshes only authored text and cannot rewrite D1 catalog',()=>{
 assert.match(app,/function refreshVisibleOwnerCopy\(recordKey\)/);
 assert.match(app,/\(origin\|equipment\|path\|catalog-sync\|honor-view\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\)/);
 assert.match(app,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(app,/key\.startsWith\('book\.catalog-sync\.'\)/);
 assert.match(app,/!key\.startsWith\('book\.catalog-sync\.'\)/);
 assert.match(view,/request\('\/api\/admin\/catalog\/publish'/);
 assert.match(view,/if\(!confirm\('Создать отдельный GitHub PR/);
 assert.match(view,/if\(!confirm\('Проверить конфликты правок/);
});
