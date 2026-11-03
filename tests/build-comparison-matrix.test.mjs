import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',file('pandora-studio-build-comparison.js'))(host);
const comparison=host.PandoraBuildComparison;
const first={race:1,job:3,gender:0,level:10,stats:{Выносливость:1},
 points:{slash:5},equipment:{0:{id:1}},
 refinements:{},souls:{},vitalsBuffs:{guildHp:0},
 attributeBuffs:{guildAll:0,priestEnabled:true,priestSpi:30}};
const second={...structuredClone(first),level:30,
 stats:{Выносливость:9},points:{slash:15},
 equipment:{0:{id:2}},vitalsBuffs:{guildHp:3},
 attributeBuffs:{guildAll:5,priestEnabled:true,priestSpi:134}};
const opts={
 lang:'ru',races:[['Человек','Human'],['Эльф','Elf']],
 jobs:['Warrior','Other','Third','Priest'],
 stats:[['Выносливость','Vitality'],['Сила','Strength'],
  ['Ловкость','Agility'],['Сноровка','Dexterity'],['Дух','Spirit'],
  ['Интеллект','Intelligence']],
 branches:[['slash','Рубящая','Slashing']],
 slotLabels:['Оружие'],equipment:{1:{name:'Меч'},2:{name:'Копьё'}},
 souls:{},calcA:{hp:300,stats:{vit:11}},calcB:{hp:600,stats:{vit:22}},
 summaryA:[{ru:'Жизнь',en:'Vitals',rows:[
  {ru:'ОЗ',en:'HP',value:300,unit:''},
  {ru:'Неизвестная формула',en:'Unknown formula',value:null,unit:'%'}]}],
 summaryB:[{ru:'Жизнь',en:'Vitals',rows:[
  {ru:'ОЗ',en:'HP',value:600,unit:''},
  {ru:'Неизвестная формула',en:'Unknown formula',value:null,unit:'%'}]}],
 trained:(snap,id)=>snap.points?.[id]||0,
 refinement:()=>0
};
test('A/B comparison shows real per-build numbers and delta B minus A',()=>{
 const a=structuredClone(first),b=structuredClone(second);
 const rows=comparison.matrixRows(a,b,opts);
 const level=rows.find(x=>x.key==='level');
 assert.equal(level.a,'10');assert.equal(level.b,'30');assert.equal(level.delta,'+20');
 assert.equal(level.direction,'up');
 const hp=rows.find(x=>x.key==='result.0.0');
 assert.equal(hp.a,'300');assert.equal(hp.b,'600');assert.equal(hp.delta,'+300');
 const effective=rows.find(x=>x.key==='effective.vit');
 assert.equal(effective.a,'11');assert.equal(effective.b,'22');
 const unknown=rows.find(x=>x.key==='result.0.1');
 assert.equal(unknown.a,'—');assert.equal(unknown.b,'—');
 assert.equal(unknown.delta,null,'Missing source data must not be rendered as zero');
 assert.equal(unknown.equal,true);
 assert.ok(rows.some(x=>x.key==='gear.0'&&x.a==='Меч'&&x.b==='Копьё'));
 assert.ok(rows.some(x=>x.key==='branch.slash'&&x.delta==='+10'));
 assert.ok(rows.some(x=>x.key==='vital.guildHp'&&x.delta==='+3'));
 assert.ok(rows.some(x=>x.key==='priest.priestSpi'&&x.delta==='+104'));
 assert.deepEqual(a,first);assert.deepEqual(b,second,'Comparison must not mutate saved snapshots');
});
test('swapping A and B reverses signed numeric deltas without claiming better is always positive',()=>{
 const rows=comparison.matrixRows(second,first,{...opts,
  calcA:opts.calcB,calcB:opts.calcA,
  summaryA:opts.summaryB,summaryB:opts.summaryA});
 const delta=rows.find(x=>x.key==='result.0.0');
 assert.equal(delta.delta,'-300');assert.equal(delta.direction,'down');
 const noData=comparison.matrixRows(first,second,{
  ...opts,summaryA:[{ru:'Магия',en:'Magic',rows:[{ru:'МАТК',en:'MATK',value:null,unit:'%'}]}],
  summaryB:[{ru:'Магия',en:'Magic',rows:[{ru:'МАТК',en:'MATK',value:0,unit:'%'}]}]
 }).find(x=>x.key==='result.0.0');
 assert.equal(noData.a,'—');assert.equal(noData.b,'0%');
 assert.equal(noData.delta,null);
});
test('English comparison and legacy saved states remain valid and complete',()=>{
 const rows=comparison.matrixRows(first,second,{...opts,lang:'en'});
 assert.ok(rows.some(x=>x.section==='results'&&x.group==='Hero Book results · Vitals'));
 assert.ok(rows.some(x=>x.key==='gear.0'&&x.label==='Weapon'));
 assert.ok(rows.some(x=>x.key==='priest.priestSpi'&&x.label==='Priest spirit'));
 const empty=comparison.matrixRows({},{},{...opts,summaryA:[],summaryB:[],calcA:null,calcB:null});
 assert.ok(empty.some(x=>x.key==='effective.vit'&&x.a==='—'&&x.b==='—'));
 assert.ok(empty.some(x=>x.key==='level'&&x.a==='—'&&x.delta===null));
});
test('comparison renders within saved builds instead of a modal, with familiar stats and controls',()=>{
 const app=file('pandora-studio-app.js'),style=file('pandora-studio-build-comparison.css'),
  html=file('index.html');
 assert.match(app,/function renderBuildComparison\(host,onSelection/);
 assert.match(app,/renderBuildComparison\(comparisonSlot/);
 assert.match(app,/PandoraBuildComparison\.matrixRows\(a\.data,b\.data/);
 assert.match(app,/summaryRows\(calcA\)/);
 assert.match(app,/previewBaseStats\(a\.data\)/);
 assert.match(app,/previewBaseStats\(b\.data\)/);
 assert.match(app,/data-compare-row/);
 assert.match(app,/data-compare-select/);
 assert.match(app,/data-compare-differences/);
 assert.match(app,/comparisonSlot\.querySelector/);
 assert.doesNotMatch(app,/modal\('Сравнение билдов'/);
 assert.match(style,/build-compare-table-wrap/);
 assert.match(html,/pandora-studio-build-comparison\.css/);
});


test('corrupt legacy allocation and resistance skills remain unknown without crashing',()=>{
 const damaged=structuredClone(first);
 damaged.stats.Выносливость='not-a-number';
 damaged.points.slash=-12;
 damaged.attributeBuffs.resistanceSkillIds='invalid';
 const rows=comparison.matrixRows(damaged,second,opts);
 const invested=rows.find(x=>x.key==='points.vit');
 const branch=rows.find(x=>x.key==='branch.slash');
 const resistance=rows.find(x=>x.key==='resistanceSkills');
 assert.equal(invested.a,'—','invalid allocation must never become zero');
 assert.equal(invested.delta,null);
 assert.equal(branch.a,'—','invalid branch points must never become zero');
 assert.equal(branch.delta,null);
 assert.equal(resistance.a,'—','malformed skill list must not throw');
 assert.equal(rows.find(x=>x.key==='level').delta,'+20');
 assert.deepEqual(damaged.attributeBuffs.resistanceSkillIds,'invalid');
});
test('one failed calculation cannot suppress the other saved build',()=>{
 let attempts=0;
 const calculated=comparison.calculatePair(first,second,snapshot=>{
  attempts++;
  if(snapshot===first)throw Error('Simulated malformed saved A');
  return {hp:600,stats:{vit:22}};
 });
 assert.equal(attempts,2);
 assert.equal(calculated[0],null);
 assert.equal(calculated[1].hp,600);
 const rows=comparison.matrixRows(first,second,{...opts,calcA:calculated[0],
  calcB:calculated[1],summaryA:[],summaryB:opts.summaryB});
 assert.equal(rows.find(x=>x.key==='effective.vit').a,'—');
 assert.equal(rows.find(x=>x.key==='effective.vit').b,'22');
 assert.equal(rows.find(x=>x.key==='result.0.0').b,'600');
 assert.deepEqual(comparison.calculatePair(first,second,()=>({hp:9}),false),
  [null,null],'Unavailable catalog must not fabricate a calculation');
});
