import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hero=read('pandora-studio-hero-path.js'),app=read('pandora-studio-app.js');
const css=read('pandora-studio-owner-inline-ui.css');
const scope={};scope.window=scope;
runInNewContext(read('pandora-studio-honor-guide.js'),scope);

test('Path help is directly editable with stable D1 keys and no caption pencils',()=>{
 assert.match(hero,/const authored=\(api,key,ru,en,tag='p',cls='muted'\)=>/);
 assert.match(hero,/api\.editLabel\(node,key,ru,en\)/);
 assert.match(app,/editLabel:\(node,key,ru,en,callbacks\)=>ownerCopyLabel\(node,'path',key,ru,en,\{/);
 assert.match(app,/applyOwnerInterfaceEditedValue\('path',key,visible\)/);
 assert.match(app,/callbacks\?\.onCommitted\?\.\(visible\)/);
 assert.match(app,/node\.addEventListener\('dblclick',edit\)/);
 assert.doesNotMatch(hero,/class:'path-owner-pencil'/);
 assert.doesNotMatch(hero,/class:'path-group-pencil'/);
 assert.doesNotMatch(hero,/class:'path-racial-pencil'/);
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
 assert.match(hero,/const dd=make\('dd',\{text:String\(value\)\}\)/);
 assert.match(hero,/if\(valueCopy\)bindPathCopy\(api,dd,\.\.\.valueCopy\)/);
 assert.match(hero,/stats\.append\(label,dd\)/);
});