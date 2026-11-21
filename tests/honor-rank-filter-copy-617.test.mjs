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

test('rank filter captions use separate bilingual D1 keys, rank counts stay live',()=>{
 for(const key of ['filterAll','filterStandard','filterMonthly']){
  const slug=key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
  assert.equal(scope.PandoraHonorGuide.validOverride('book.honor-view.'+slug,
   JSON.stringify({ru:'Название',en:'Caption'})),true,key);
  assert.ok(view.includes("'"+key+"'"),key);
 }
 assert.match(view,/article\.ranks\.length/);
 assert.match(view,/article\.ranks\.filter\(rank=>rank\.top==null\)\.length/);
 assert.match(view,/article\.ranks\.filter\(rank=>rank\.top!=null\)\.length/);
 assert.match(view,/node\('span','wiki-honor-filter-count',' · '\+count\)/);
 assert.doesNotMatch(view,/tr\('Все · 12','All · 12'\)/);
});

test('rank filter direct edit never triggers a filter action',()=>{
 assert.match(view,/class:'wiki-honor-filter-wrap'/);
 assert.match(view,/wrap\.append\(button\)/);
 assert.match(view,/wrap\.append\(host\)/);
 assert.match(view,/caption\.addEventListener\('dblclick',edit\)/);
 assert.match(view,/guardCaptionAction\(button,caption\)/);
 assert.match(view,/rankFilters\.querySelectorAll\('button\[data-honor-filter\]'\)/);
 assert.match(view,/button\.hidden=true;host\.hidden=false/);
 assert.match(view,/onFinished:restore/);
 assert.doesNotMatch(view,/wiki-honor-filter-pencil/);
 assert.match(app,/ownerDockPatchText\(filterCaption,value\)/);
 assert.match(css,/\.wiki-honor-filter-wrap\{/);
 assert.match(css,/\.wiki-honor-filter-caption\{pointer-events:auto\}/,
  'An owner double-click must target the actual caption, not its action button');
 assert.match(css,/\.wiki-honor-filter-count\{pointer-events:none\}/,
  'Live rank counts stay passive and cannot be edited');
 assert.doesNotMatch(css,/\.wiki-honor-filter-pencil\{/);
 assert.match(css,/\.wiki-honor-filter-edit-host\[hidden\]\{display:none!important\}/);
});
