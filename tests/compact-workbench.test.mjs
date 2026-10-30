import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css'),hero=read('hero-path.js');

test('unused hero HUD, dummy name and experience disappear from the actual page',()=>{
 assert.doesNotMatch(html,/id="psHud"/);
 assert.doesNotMatch(html,/id="psHudName"|id="psHudLevel"|ps-hud-exp/);
 assert.doesNotMatch(html,/>Новый герой</);
 assert.match(html,/id="originPanelStats"[\s\S]*?id="originVitals"/);
 assert.match(html,/id="originHp"/);
 assert.match(html,/id="originMp"/);
 assert.match(html,/id="levelOut"/);
 assert.doesNotMatch(app,/getElementById\(['"]psHudName['"]\)/);
});

test('HP and MP render in the Origin area and refresh when allocation/equipment changes',()=>{
 const first=app.indexOf('function renderOriginVitals(){');
 const last=app.indexOf('\nfunction budgetSummary(){',first);
 assert.ok(first>0&&last>first);
 const fn=app.slice(first,last);
 const fake={
  originHp:{textContent:''},
  originMp:{textContent:''},
  originVitals:{attrs:{},setAttribute(k,v){this.attrs[k]=v}}
 };
 let estimate={hp:1630,mp:420};
 const render=Function('$','previewBaseStats',fn+'\nreturn renderOriginVitals;')(
  name=>fake[name]||null,()=>estimate);
 render();
 assert.equal(fake.originHp.textContent,'1630');
 assert.equal(fake.originMp.textContent,'420');
 assert.match(fake.originVitals.attrs['aria-label'],/1630/);
 estimate={hp:1810,mp:490};render();
 assert.equal(fake.originHp.textContent,'1810');
 assert.equal(fake.originMp.textContent,'490');
 estimate=null;render();
 assert.equal(fake.originHp.textContent,'—');
 assert.equal(fake.originMp.textContent,'—');
 assert.match(app,/function setAttributePoints\([\s\S]*?persist\(\);renderOriginVitals\(\)/);
 assert.match(app,/function render\(\)[\s\S]*?renderOriginVitals\(\);updateAdminHint\(\)/);
});

test('skill tick overlay is passive, not a drag-blocking button',()=>{
 assert.match(hero,/const ticks=make\('div',\{class:'inline-branch-milestones','aria-hidden':'true'\}\)/);
 assert.match(hero,/const tick=make\('span',\{class:'path-threshold-tick'/);
 assert.doesNotMatch(hero,/class:'inline-milestone path-milestone-pin'/);
 assert.match(css,/\.inline-mastery-track \.inline-branch-milestones\{[\s\S]*?pointer-events:none!important/);
 assert.match(css,/\.inline-mastery-track \.path-threshold-tick\{[\s\S]*?pointer-events:none!important/);
 assert.match(css,/\.inline-mastery-track input\[type=range\]\{[\s\S]*?z-index:7/);
});

test('both equipment rails share the same sizing at desktop/tablet/mobile breakpoints',()=>{
 const block=css.slice(css.indexOf('Override the older per-slot custom property'));
 assert.ok(block.length>0);
 for(const size of ['clamp(48px,5.5vh,60px)','clamp(42px,5.5vw,52px)','clamp(37px,9vw,44px)']){
  assert.ok(block.includes(size));
 }
 assert.match(block,/\.left-rail \.equipment-slot,\s*\.workspace \.stage-inner \.right-rail \.equipment-slot/);
});
