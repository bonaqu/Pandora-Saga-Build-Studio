import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),stage=read('stage-attributes.js'),css=read('style.css');
test('original portrait and rails stay intact with dedicated book controls',()=>{
 assert.match(html,/id="hero"[^>]*role="button"[^>]*tabindex="0"/);
 for(const id of ['portraitBookOpen','stageBuffToggle','stageAttributes','railLeft','railRight'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(css,/\.portrait-book-open/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('click, Enter, Space, Escape and back action switch the existing overlay',()=>{
 assert.match(app,/\$\('hero'\)\.addEventListener\('click',openHeroBook\)/);
 assert.match(app,/event\.key==='Enter'\|\|event\.key===' '/);
 assert.match(app,/stageAttributesPage='summary'/);
 assert.match(app,/if\(stageAttributesPage\)\{/);
 assert.match(app,/stageSlotPickerOpen\|\|adminEditing/);
 assert.match(app,/attributes:stageAttributesPage/);
});
test('six accessible chapters and guarded toggle setters share one build model',()=>{
 for(const label of ['Итоги','Атака','Защита','Восстановление','Эффекты','Усиления'])
  assert.ok(stage.includes("'"+label+"'"),label);
 assert.match(app,/window\.PandoraStageAttributes\.bookPages\.some/);
 assert.match(app,/onBuff:\(key,value\)=>setAttributeBuff\(key,value\)/);
 assert.match(app,/onVital:\(key,value\)=>setVitalsEnhancement\(key,value\)/);
 assert.match(app,/availability\[name\]=Boolean\(ability\?\.classes/);
 assert.match(app,/equippedShield\?\.slot==='shield'/);
});
test('changing a buff does not force the chapter back to the top',()=>{
 assert.match(app,/priorScroll=root\.querySelector/);
 assert.match(app,/scroll\.scrollTop=priorScroll/);
});
