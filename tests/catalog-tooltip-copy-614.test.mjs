import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const workbench=read('pandora-os-catalog-workbench.js');
const tooltip=read('pandora-studio-guide-tooltips.js');
const css=read('pandora-os-catalog-workbench.css');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('nine catalog action hover hints have safe independent RU/EN D1 keys',()=>{
 for(const id of ['hintLive','hintArchive','hintAcceptAll','hintDeclineAll',
  'hintPublish','hintTestWrite','hintTestCas','hintGithub','hintExport']){
  assert.ok(workbench.includes("'"+id+"'"),id);
  const field='book.catalog-sync.'+id.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());
  assert.equal(root.PandoraHonorGuide.validOverride(field,
   JSON.stringify({ru:'Короткая подсказка',en:'Short help'})),true,id);
 }
 assert.match(workbench,/for\(const \[node,key,ru,en\] of \[/);
 assert.match(workbench,/actionHint\(node,key,ru,en\)/);
 assert.match(workbench,/const wrap=node\.closest\('\.os-sync-action-editor'\)/);
 assert.match(workbench,/class:'os-sync-hint-pencil'/);
 assert.match(workbench,/node\.dataset\.guideHint=next/);
 assert.match(workbench,/node\.dataset\.guideOwnerKey=key/);
 assert.match(app,/if\(target\.dataset\.guideOwnerKey===id\)target\.dataset\.guideHint=value/);
 assert.match(workbench,/wrap\.append\(pencil,host\)/);
 assert.match(workbench,/if\(!node\.isConnected\)return/);
 assert.match(app,/node,'catalog-sync',key,ru,en,callbacks/);
});

test('hover presentation reads up-to-date plain text from original target',()=>{
 assert.match(tooltip,/node\.dataset\.guideHint=text/);
 assert.match(tooltip,/popup\.textContent=node\.dataset\.guideHint\|\|text/);
 assert.match(tooltip,/popup\.setAttribute\('role','tooltip'\)/);
 assert.match(tooltip,/node\.addEventListener\('pointerenter'/);
 assert.match(tooltip,/node\.addEventListener\('focus'/);
 assert.doesNotMatch(tooltip,/popup\.innerHTML/);
});

test('hover help editor cannot click a catalog action and stays compact',()=>{
 assert.match(workbench,/event\.preventDefault\(\);event\.stopPropagation\(\)/);
 assert.match(workbench,/host\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.doesNotMatch(workbench,/node\.dispatchEvent\(new MouseEvent\('click'/);
 assert.match(workbench,/wrap\.classList\.add\('editing-hint'\)/);
 assert.match(css,/\.os-sync-hint-pencil\{/);
 assert.match(css,/\.os-sync-action-editor\.editing-hint>\.button-action/);
 assert.match(css,/\.os-sync-hint-edit-host \.wiki-inline-input/);
});
