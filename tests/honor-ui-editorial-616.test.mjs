import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-honor.css');
const scope={};scope.window=scope;
runInNewContext(read('pandora-studio-honor-guide.js'),scope);

test('Honor UI captions have five stable, independent D1 RU/EN keys',()=>{
 const keys=['warsHeading','warEyebrow','subtitle','zonesHeading','rewardsHeading'];
 for(const key of keys){
  const normalized=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(scope.PandoraHonorGuide.validOverride('book.honor-view.'+normalized,
   JSON.stringify({ru:'Проверенная подпись',en:'Verified caption'})),true,key);
  assert.ok(view.includes("'"+key+"'"),key);
 }
 assert.match(app,/copy:\(key,ru,en\)=>ownerCopy\('honor-view',key,ru,en\)/);
 assert.match(app,/editCopy:\(node,key,ru,en,callbacks\)=>ownerCopyLabel\(node,'honor-view',key,ru,en,callbacks\)/);
 assert.match(app,/\^\(origin\|equipment\|path\|catalog-sync\|honor-view\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\)/);
 assert.match(app,/key\.startsWith\('book\.honor-view\.'\)/);
 assert.match(app,/guideedit\\\.book\\\.\(equipment\|path\|catalog-sync\|honor-view\|owner-dock\|owner-history\|owner-dialog\|wiki-ui\|skill-ui\|stats-ui\)/);
 assert.match(view,/editorial\('p','wiki-honor-subtitle','subtitle'/);
 assert.match(view,/editorial\('h5','',isZone\?'zonesHeading':'warsHeading'/);
 assert.match(view,/editorial\('small','','rewardsHeading'/);
});

test('Honor visible copy edits directly without inserting pencil controls',()=>{
 assert.match(view,/if\(editable\)editCopy\(element,key,ru,english\)/);
 assert.doesNotMatch(view,/wiki-honor-copy-pencil/);
 assert.match(view,/root\.PandoraStudioCaptionActionGuard\?\.\(button,caption\)/);
 assert.match(view,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(css,/\.wiki-honor-field-edit-row\{display:flex/);
});
