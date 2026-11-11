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

test('rank filter pencils stay outside actions and do not change filter state',()=>{
 assert.match(view,/class:'wiki-honor-filter-wrap'/);
 assert.match(view,/wrap\.append\(button\)/);
 assert.match(view,/wrap\.append\(pencil,host\)/);
 assert.match(view,/rankFilters\.querySelectorAll\('button\[data-honor-filter\]'\)/);
 assert.match(view,/button\.hidden=true;pencil\.hidden=true;host\.hidden=false/);
 assert.match(view,/host\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(view,/onFinished:restore/);
 assert.match(app,/if\(filterCaption\)filterCaption\.textContent=value/);
 assert.match(css,/\.wiki-honor-filter-wrap\{/);
 assert.match(css,/\.wiki-honor-filter-edit-host\[hidden\]\{display:none!important\}/);
});
