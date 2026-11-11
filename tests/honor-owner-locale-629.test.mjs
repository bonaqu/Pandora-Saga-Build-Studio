import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const view=read('pandora-studio-honor-view.js');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);

test('Honor unavailable-war message reuses normal inline RU/EN D1 editor',()=>{
 assert.match(view,/editorial\('h3','wiki-honor-title','warNotFound'/);
 assert.equal(root.PandoraHonorGuide.validOverride('book.honor-view.war-not-found',
  JSON.stringify({ru:'Война пока недоступна',en:'War unavailable'})),true);
 assert.match(view,/if\(!editable\)return element/);
});
test('Honor create-war form localizes both input names without confusing their actual language',()=>{
 assert.match(view,/placeholder:tr\('Название на русском','Russian name'\)/);
 assert.match(view,/placeholder:tr\('Название на английском','English name'\)/);
 assert.match(view,/'aria-label':tr\('Название на русском','Russian name'\)/);
 assert.match(view,/'aria-label':tr\('Название на английском','English name'\)/);
 assert.match(view,/const nameRu=ru\.value\.trim\(\),nameEn=english\.value\.trim\(\)/);
});
test('Honor owner remove aria label follows currently displayed RU/EN record name',()=>{
 assert.match(view,/'aria-label':tr\('Удалить','Remove'\)\+' '\+\(value\|\|item\.nameRu\)/);
 assert.doesNotMatch(view,/'aria-label':tr\('Удалить','Remove'\)\+' '\+item\.nameRu,/);
 assert.match(view,/const value=\(linked\?\(en\?linked\.nameEn:linked\.nameRu\):item\[field\]\)\|\|''/);
});
