import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('style.css'),app=read('app.js');
test('buffs are book-only while legacy form inputs stay hidden for compatibility',()=>{
 assert.match(html,/id="legacyBuffControls" hidden inert/);
 const origin=html.slice(html.indexOf('id="originPanelStats"'),html.indexOf('id="originPanelStats"')+1700);
 assert.doesNotMatch(origin,/Усиления ОЗ и ОМ/);
 assert.match(html,/<details class="origin-vitals-buffs" id="originBuffs">/);
 for(const id of ['originGuildHp','originGuildMp','originLifeSign','originVitalsCoverage'])
  assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.match(html,/<summary>Усиления ОЗ и ОМ<\/summary>/);
 assert.match(html,/Сила гильдии \(ОЗ\)/);
 assert.match(html,/Дух гильдии \(ОМ\)/);
 assert.match(html,/Знак жизни/);
 assert.doesNotMatch(html,/<details class="origin-vitals-buffs"[^>]+open/);
});
test('old saved build starts with disabled buffs; controls update without resetting stats',()=>{
 assert.match(app,/vitalsBuffs:\{guildHp:0,guildMp:0,lifeSign:false\}/);
 assert.match(app,/enhancements:state\.vitalsBuffs\|\|\{\}/);
 const start=app.indexOf('function renderVitalsEnhancements(){');
 const end=app.indexOf('\nfunction budgetSummary(){',start);
 assert.ok(start>0&&end>start);
 const body=app.slice(start,end);
 let persisted=0,rerenders=0;
 const state={vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},attributeBuffs:{}};
 const dom={originGuildHp:{value:'0'},originGuildMp:{value:'0'},
  originLifeSign:{checked:false},originVitalsCoverage:{textContent:''},
  originPotionRecovery:{textContent:''}};
 const fakeWindow={PandoraOSCalculator:{honorTitles:[]}};
 const f=Function('state','$','persist','previewBaseStats','renderOriginVitals',
  'window','renderStageAttributes','stageAttributesPage','renderPotionPreview',body+
  '\nreturn {renderVitalsEnhancements,setVitalsEnhancement};')(
  state,id=>dom[id]||null,()=>persisted++,()=>({hp:500,mp:200,potion:{percent:105}}),
  ()=>rerenders++,fakeWindow,()=>{},null,()=>{});
 f.renderVitalsEnhancements();
 assert.equal(dom.originLifeSign.checked,false);
 assert.equal(dom.originGuildHp.value,'0');
 assert.equal(dom.originPotionRecovery.textContent,'105%');
 f.setVitalsEnhancement('guildHp','4');
 f.setVitalsEnhancement('guildMp','6');
 f.setVitalsEnhancement('lifeSign',true);
 assert.deepEqual(state.vitalsBuffs,{guildHp:4,guildMp:6,lifeSign:true});
 assert.equal(dom.originGuildHp.value,'4');
 assert.equal(dom.originGuildMp.value,'6');
 assert.equal(dom.originLifeSign.checked,true);
 assert.equal(rerenders,3);
 assert.equal(persisted,3);
 f.setVitalsEnhancement('guildHp','100');
 assert.equal(state.vitalsBuffs.guildHp,4);
 assert.equal(dom.originVitalsCoverage.textContent,'');
});
test('race selection and equipped portrait stay distinct on narrow viewports',()=>{
 assert.match(html,/<h2 id="stageHeading">Образ героя<\/h2>/);
 assert.match(html,/<span class="hint">Экипировка персонажа<\/span>/);
 assert.match(html,/Раса <span>Выбери расу<\/span>/);
 for(const media of ['@media(max-width:790px)','@media(max-width:460px)',
  '@media(min-width:791px) and (max-width:1200px)'])
  assert.ok(css.includes(media),media);
 assert.match(css,/\.workspace>.left \.race-slide-frame\{max-height:205px/);
 assert.match(css,/\.workspace>.stage \.portrait-frame>img#hero\{[\s\S]*?object-fit:contain/);
});
test('runtime hooks update linked HP/MP and rune changes without a full page reset',()=>{
 assert.match(app,/setVitalsEnhancement\('lifeSign',event\.target\.checked\)/);
 assert.match(app,/setVitalsEnhancement\(key,select\.value\)/);
 assert.match(app,/setAttributeBuff\('honorTitle',event\.target\.value\)/);
 assert.doesNotMatch(html,/id="originRuneJoEun"/);
 assert.match(app,/state\.vitalsBuffs=current;persist\(\);renderOriginVitals\(\);renderVitalsEnhancements\(\)/);
});
