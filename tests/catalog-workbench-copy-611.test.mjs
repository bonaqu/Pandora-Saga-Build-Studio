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

test('editing catalog actions is separate from their potentially destructive click',()=>{
 assert.match(view,/const wrap=h\('span',\{class:'os-sync-action-editor'\}\)/);
 assert.match(view,/const pencil=h\('button',\{type:'button',class:'os-sync-owner-pencil'/);
 assert.match(view,/button.hidden=true;pencil.hidden=true;host.hidden=false/);
 assert.match(view,/host.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.doesNotMatch(view,/button.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(view,/onFinished:\(\)=>\{button.hidden=false;pencil.hidden=false;host.hidden=true\}/);
 assert.match(view,/if\(!canEdit\|\|typeof editLabel!=='function'\)return button/);
 assert.match(css,/\.os-sync-actions>\.os-sync-action-editor\{width:100%\}/);
 assert.match(css,/\.os-sync-action-edit-host\.origin-copy-editable::after\{content:none\}/);
 assert.match(view,/class:'os-sync-copy-field'/);
 assert.match(view,/class:'os-sync-copy-pencil'/);
 assert.match(view,/node.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(css,/\.os-sync-copy-field>\.origin-copy-editable::after\{content:none\}/);
});

test('catalog copy Undo refreshes only authored text and cannot rewrite D1 catalog',()=>{
 assert.match(app,/function refreshVisibleOwnerCopy\(recordKey\)/);
 assert.match(app,/\(equipment\|path\|catalog-sync\|honor-view\|owner-history\|owner-dialog\)/);
 assert.match(app,/refreshVisibleOwnerCopy\(last\.key\);saveView\(\)/);
 assert.match(app,/key\.startsWith\('book\.catalog-sync\.'\)/);
 assert.match(app,/!key\.startsWith\('book\.catalog-sync\.'\)/);
 assert.match(view,/request\('\/api\/admin\/catalog\/publish'/);
 assert.match(view,/if\(!confirm\('Создать отдельный GitHub PR/);
 assert.match(view,/if\(!confirm\('Проверить конфликты правок/);
});
