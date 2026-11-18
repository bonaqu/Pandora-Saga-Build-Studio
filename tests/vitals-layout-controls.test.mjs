import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('pandora-studio-theme.css'),app=read('pandora-studio-app.js');
const book=read('pandora-studio-hero-book.js');

test('all guild and vital controls belong to the live Book, not a hidden duplicate',()=>{
 assert.doesNotMatch(html,/id="legacyBuffControls"|id="originGuildHp"|id="originGuildMp"|id="originLifeSign"|id="originVitalsCoverage"/);
 const origin=html.slice(html.indexOf('id="originPanelStats"'),html.indexOf('<section class="stage panel"'));
 assert.match(origin,/id="originVitals"/);
 assert.doesNotMatch(origin,/Усиления ОЗ и ОМ/);
 assert.match(book,/data-book-setting':key/);
 assert.match(book,/onchange:event=>\(vital\?onVital:onBuff\)/);
 assert.match(app,/onVital:\(key,value\)=>setVitalsEnhancement\(key,value\)/);
});
function vitalFixture(attributeBuffs={}){
 const start=app.indexOf('function setVitalsEnhancement(key,value){');
 const end=app.indexOf('function setAttributeBuff(key,value){',start);
 assert.ok(start>0&&end>start);
 const state={vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},
  attributeBuffs:{...attributeBuffs}};
 let saves=0,redraws=0;
 const edit=Function('state','persist','previewBaseStats','renderOriginVitals',
  app.slice(start,end)+'\nreturn setVitalsEnhancement;')(
   state,()=>saves++,()=>({hp:500,mp:200}),()=>redraws++);
 return {state,edit,get saves(){return saves},get redraws(){return redraws}};
}
test('Book vital selection persists, redraws and rejects invalid legacy values',()=>{
 const f=vitalFixture();
 for(const [key,value] of [['guildHp','4'],['guildMp','6'],['lifeSign',true]])
  f.edit(key,value);
 assert.deepEqual(f.state.vitalsBuffs,{guildHp:4,guildMp:6,lifeSign:true});
 assert.equal(f.saves,3);assert.equal(f.redraws,3);
 for(const [key,value] of [['guildHp','100'],['guildMp',-1],['lifeSign',false]])
  if(key!=='lifeSign')f.edit(key,value);
 assert.equal(f.saves,3,'Invalid levels never persist');
 assert.equal(f.state.vitalsBuffs.guildHp,4);
 assert.equal(f.state.vitalsBuffs.guildMp,6);
});

test('race selection and equipped portrait stay distinct on narrow viewports',()=>{
 assert.match(html,/<h2 id="stageHeading" data-i18n="appearance">Образ героя<\/h2>/);
 assert.match(html,/<span class="hint"[^>]*>Экипировка персонажа<\/span>/);
 assert.match(html,/data-origin-copy-static="race">Раса<\/span> <span[^>]*>Выбери расу<\/span>/);
 for(const media of ['@media(max-width:790px)','@media(max-width:460px)',
  '@media(min-width:791px) and (max-width:1200px)'])
  assert.ok(css.includes(media),media);
 assert.match(css,/\.workspace>.left \.race-slide-frame\{max-height:205px/);
 assert.match(css,/\.workspace>.stage \.portrait-frame>img#hero\{[\s\S]*?object-fit:contain/);
});

test('runtime callbacks update HP/MP and expose no obsolete hidden field hooks',()=>{
 assert.match(app,/onVital:\(key,value\)=>setVitalsEnhancement\(key,value\)/);
 assert.match(app,/onBuff:\(key,value\)=>setAttributeBuff\(key,value\)/);
 assert.match(app,/state\.vitalsBuffs=current;persist\(\);\s*const calculated=previewBaseStats\(\);\s*renderOriginVitals\(calculated\)/);
 assert.doesNotMatch(app,/renderVitalsEnhancements\(|renderPotionPreview\(/);
 assert.doesNotMatch(html,/id="originRuneJoEun"/);
});
test('guild-level automation never destroys or overwrites manual vital settings',()=>{
 const f=vitalFixture({guildLevel:10});
 f.state.vitalsBuffs.guildHp=6;
 f.state.vitalsBuffs.guildMp=5;
 f.edit('guildHp','1');
 f.edit('guildMp','2');
 assert.equal(f.saves,0);
 assert.deepEqual(f.state.vitalsBuffs,{guildHp:6,guildMp:5,lifeSign:false});
 f.state.attributeBuffs.guildLevel=0;
 f.edit('guildHp','1');
 assert.equal(f.state.vitalsBuffs.guildHp,1);
 assert.equal(f.state.vitalsBuffs.guildMp,5);
 assert.equal(f.saves,1);
 assert.equal(f.redraws,1);
 assert.match(book,/guildPreview=root\.PandoraOSCalculator\?\.guildPassiveAtLevel\(guildLevel\)/);
});
