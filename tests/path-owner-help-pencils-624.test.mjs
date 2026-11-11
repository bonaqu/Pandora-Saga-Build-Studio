import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hero=read('pandora-studio-hero-path.js'),app=read('pandora-studio-app.js');
const css=read('pandora-studio-owner-inline-ui.css');
const scope={};scope.window=scope;
runInNewContext(read('pandora-studio-honor-guide.js'),scope);

test('owner-only Path help pencil is a native action, never nested in a game control',()=>{
 assert.match(hero,/if\(!api\.canEdit\|\|typeof api\.editLabel!=='function'\)/);
 assert.match(hero,/const label=make\('span',\{class:'path-owner-copy-text'/);
 assert.match(hero,/const pencil=make\('button',\{type:'button',class:'path-owner-pencil'/);
 assert.match(hero,/api\.editLabel\(label,key,ru,en,\{onCommitted:sync\}\)/);
 assert.match(hero,/node\.append\(label,pencil\)/);
 assert.match(hero,/label\.dispatchEvent\(new MouseEvent\('dblclick'/);
 assert.match(app,/editLabel:\(node,key,ru,en,callbacks\)=>ownerCopyLabel\(node,'path',key,ru,en,callbacks\)/);
 assert.match(app,/const helpPencil=node\.parentElement\?\.classList\?\.contains\('path-owner-edit-row'\)/);
 assert.match(css,/\.path-owner-edit-row\{display:flex/);
 assert.match(css,/\.path-skill-metadata dt\.path-owner-edit-row/);
});

test('D1 editing never replaces source-backed skill values or invalid requirement details',()=>{
 for(const k of ['skillDescriptionUnavailable','skillReady']){
  const dashed=k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  assert.ok(hero.includes("'"+k+"'"));
  assert.equal(scope.PandoraHonorGuide.validOverride('book.path.'+dashed,
   JSON.stringify({ru:'Текст',en:'Text'})),true);
 }
 assert.match(hero,/skill\.desc\?make\('p',\{text:skill\.desc\}\):/);
 assert.match(hero,/gate\.learned\?\s*authored\(api,'skillReady'/);
 assert.match(hero,/make\('p',\{class:'path-skill-no',text:'🔒 '\+gate\.problems\.join\(' · '\)\}\)/);
 assert.match(hero,/stats\.append\(label,make\('dd',\{text:String\(value\)\}\)\)/);
});