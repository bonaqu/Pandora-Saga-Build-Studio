import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('style.css'),app=read('app.js');
test('buffs are optional collapsed settings with separately labeled guild effects',()=>{
 assert.match(html,/<details class="origin-vitals-buffs" id="originBuffs">/);
 for(const id of ['originGuildHp','originGuildMp','originLifeSign','originVitalsCoverage'])
  assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.match(html,/<summary>Усиления ОЗ и ОМ<\/summary>/);
 assert.match(html,/Сила гильдии \(ОЗ\)/);
 assert.match(html,/Дух гильдии \(ОМ\)/);
 assert.match(html,/Знак жизни/);
 assert.match(html,/<option value="6">Уровень 6 \(\+15%\)<\/option>/);
 assert.doesNotMatch(html,/<details class="origin-vitals-buffs"[^>]+open/);
});
test('old saved build still receives disabled optional buffs by default',()=>{
 assert.match(app,/vitalsBuffs:\{guildHp:0,guildMp:0,lifeSign:false\}/);
 assert.match(app,/enhancements:state\.vitalsBuffs\|\|\{\}/);
 const start=app.indexOf('function renderVitalsEnhancements(){');
 const end=app.indexOf('\nfunction budgetSummary(){',start);
 assert.ok(start>0&&end>start);
 const body=app.slice(start,end);
 let persisted=0,rerenders=0,preview=0;
 const state={vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false}};
 const dom={
  originGuildHp:{value:'0'},originGuildMp:{value:'0'},
  originLifeSign:{checked:false},originVitalsCoverage:{textContent:''}
 };
 const f=Function('state','$','persist','previewBaseStats','renderOriginVitals',
  body+'\nreturn {renderVitalsEnhancements,setVitalsEnhancement}')(state,
  id=>dom[id]||null,()=>persisted++,()=>{preview++;return{hp:500,mp:200}},
  ()=>rerenders++);
 f.renderVitalsEnhancements();
 assert.equal(dom.originLifeSign.checked,false);
 assert.equal(dom.originGuildHp.value,'0');
 f.setVitalsEnhancement('guildHp','4');
 f.setVitalsEnhancement('guildMp','6');
 f.setVitalsEnhancement('lifeSign',true);
 assert.deepEqual(state.vitalsBuffs,{guildHp:4,guildMp:6,lifeSign:true});
 assert.equal(dom.originGuildHp.value,'4');
 assert.equal(dom.originGuildMp.value,'6');
 assert.equal(dom.originLifeSign.checked,true);
 assert.equal(rerenders,3);assert.equal(persisted,3);
 f.setVitalsEnhancement('guildHp','100');
 assert.equal(state.vitalsBuffs.guildHp,4,'invalid guild levels rejected');
 assert.match(dom.originVitalsCoverage.textContent,/не проверена/);
});
test('race carousel and equipped portrait have distinct responsive positions and dimensions',()=>{
 assert.match(html,/<h2 id="stageHeading">Образ героя<\/h2>/);
 assert.match(html,/<span class="hint">Экипировка персонажа<\/span>/);
 assert.match(html,/Раса <span>Выбери расу<\/span>/);
 assert.match(css,/@media\(min-width:791px\) and \(max-width:1200px\)/);
 assert.match(css,/@media\(max-width:790px\)/);
 assert.match(css,/@media\(max-width:460px\)/);
 assert.match(css, /\.workspace>.left \.race-slide-frame\{max-height:205px/);
 assert.match(css, /\.workspace>.stage \.portrait-frame\{[\s\S]*?max-height:405px/);
 assert.match(css, /height:clamp\(440px,calc\(100dvh - 350px\),565px\)/);
 assert.match(css, /\.workspace\{row-gap:24px\}/);
 assert.match(css,/\.workspace>.stage \.portrait-frame>img#hero\{[\s\S]*?object-fit:contain/);
});
test('runtime enhancement hooks are attached and existing build information is not reset',()=>{
 assert.match(app, /setVitalsEnhancement\('lifeSign',event\.target\.checked\)/);
 assert.match(app, /setVitalsEnhancement\(key,select\.value\)/);
 assert.match(app,/state\.vitalsBuffs=current;persist\(\);renderOriginVitals\(\);renderVitalsEnhancements\(\)/);
 assert.match(app,/renderOriginVitals\(\);renderVitalsEnhancements\(\);updateAdminHint\(\)/);
});
