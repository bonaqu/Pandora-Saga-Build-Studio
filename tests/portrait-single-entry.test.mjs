import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('hero itself opens book; no competing buttons or pointer hand',()=>{
 const html=src('index.html'),app=src('pandora-studio-app.js'),css=src('pandora-studio-theme.css');
 assert.match(html,/id="hero"[^>]*role="button"/);
 for(const id of ['portraitBookOpen','stageAttributeToggle','stageBuffToggle'])
  assert.doesNotMatch(html,new RegExp('id="'+id+'"'));
 assert.match(app,/\$\('hero'\)\.addEventListener\('click',openHeroBook\)/);
 assert.match(css,/cursor:default!important/);
});
test('Origin stat panel contains only values and no duplicate hidden buff editor',()=>{
 const html=src('index.html'),first=html.indexOf('id="originPanelStats"'),
  next=html.indexOf('<section class="stage panel"',first);
 assert.ok(first>0&&next>first);
 assert.match(html.slice(first,next),/id="originVitals"/);
 assert.doesNotMatch(html,/id="legacyBuffControls"|id="originGuildHp"|id="originCombatRage"|id="originHonorTitle"/);
 const app=src('pandora-studio-app.js');
 assert.match(app,/onVital:\(key,value\)=>setVitalsEnhancement\(key,value\)/);
});
test('book navigation prev/next/close shares one exact CSS box',()=>{
 const css=src('pandora-studio-theme.css');
 assert.match(css,/\.stage-book-arrow,\s*\.stage-attribute-head \.stage-book-close/);
 assert.match(css,/height:36px!important/);
 assert.match(css,/width:36px!important/);
});
test('no technical effect counts under the book summary',()=>{
 const stage=src('pandora-studio-hero-book.js');
 assert.doesNotMatch(stage,/Учтено структурированных эффектов предметов и душ/);
 assert.doesNotMatch(stage,/Окончательный урон на игровом сервере ещё не моделируется/);
});
