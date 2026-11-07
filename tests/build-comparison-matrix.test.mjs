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
 assert.match(app,/PandoraBuildComparison\.calculatePair\(/);
 assert.match(app,/a\.data,b\.data,previewBaseStats/);
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

test('comparison preserves the verified 50–74 ATK range rather than showing max only',()=>{
 const observed={combat:{attack:{minimum:50,known:74,minimumVerified:true}}};
 const other={combat:{attack:{minimum:null,known:74,minimumVerified:false}}};
 const ru=comparison.matrixRows(first,second,{...opts,calcA:observed,calcB:other});
 const row=ru.find(x=>x.key==='attack.range');
 assert.ok(row);
 assert.equal(row.label,'Диапазон АТК');
 assert.equal(row.a,'50–74');
 assert.equal(row.b,'—');
 assert.equal(row.equal,false);
 assert.equal(row.delta,null,'Unknown minimum cannot produce a fake numeric delta');
 const en=comparison.matrixRows(first,second,{...opts,lang:'en',
  calcA:observed,calcB:other}).find(x=>x.key==='attack.range');
 assert.equal(en.label,'ATK range');
 assert.equal(en.a,'50–74');
 assert.equal(en.b,'—');
});
test('changes to a proven minimum remain visible even when maximum attack is the same',()=>{
 const a={combat:{attack:{minimum:50,known:74,minimumVerified:true}}};
 const b={combat:{attack:{minimum:54,known:74,minimumVerified:true}}};
 const row=comparison.matrixRows(first,second,{...opts,calcA:a,calcB:b})
  .find(x=>x.key==='attack.range');
 assert.deepEqual([row.a,row.b,row.equal,row.delta],
  ['50–74','54–74',false,null]);
 const unknown=comparison.matrixRows(first,second,{...opts,
  calcA:{combat:{attack:{minimum:50,known:74,minimumVerified:false}}},
  calcB:{combat:{attack:{known:74,minimumVerified:false}}}});
 assert.equal(unknown.some(x=>x.key==='attack.range'),false,
  'Do not show speculative minima as authoritative data');
});


test('approved stat names in A/B are separate from legacy saved allocation keys',()=>{
 const first={stats:{'Выносливость':2,'Сила':3,'Ловкость':4,'Сноровка':5,'Дух':6,'Интеллект':7}};
 const second={stats:{...first.stats,'Выносливость':3,'Ловкость':9,'Дух':8}};
 const storedStats=[['Выносливость','Vitality'],['Сила','Strength'],
  ['Ловкость','Agility'],['Сноровка','Dexterity'],
  ['Дух','Spirit'],['Интеллект','Intelligence']];
 const statLabels=['Выносливость','Сила','Проворность',
  'Ловкость','Сила духа','Интеллект'];
 const original=JSON.stringify([first,second]);
 const rows=comparison.matrixRows(first,second,{...opts,stats:storedStats,statLabels});
 const get=key=>rows.find(row=>row.key===key);
 assert.deepEqual([get('points.agi').label,get('points.agi').a,get('points.agi').b],
  ['Проворность','4','9']);
 assert.deepEqual([get('points.dex').label,get('points.dex').a,get('points.dex').b],
  ['Ловкость','5','5']);
 assert.deepEqual([get('points.spi').label,get('points.spi').a,get('points.spi').b],
  ['Сила духа','6','8']);
 assert.equal(get('points.agi').delta,'+5');
 assert.equal(get('points.spi').delta,'+2');
 assert.equal(get('effective.agi').label,'Проворность');
 const en=comparison.matrixRows(first,second,{...opts,lang:'en',
  stats:storedStats,statLabels});
 assert.equal(en.find(x=>x.key==='points.agi').label,'Agility');
 assert.equal(en.find(x=>x.key==='points.dex').label,'Dexterity');
 assert.equal(JSON.stringify([first,second]),original);
});

test('resistance skills compare readable RU/EN names instead of internal catalog IDs',()=>{
 const left={attributeBuffs:{resistanceSkillIds:[310001,310002],honorTitle:9001}};
 const right={attributeBuffs:{resistanceSkillIds:[310002,310003],honorTitle:9002}};
 const skillCatalog={
  310001:{name:'Огненная защита'},
  310002:{name:'Ледяная защита',nameEn:'Ice protection'}};
 const englishSkills={310001:{n:'Fire protection'}};
 const options={...opts,skillCatalog,englishSkills,honorTitles:[]};
 const key=(lang,id)=>comparison.matrixRows(left,right,{...options,lang}).find(x=>x.key===id);
 const ru=key('ru','resistanceSkills'),en=key('en','resistanceSkills');
 assert.equal(ru.a,'Огненная защита · Ледяная защита');
 assert.equal(ru.b,'Ледяная защита · Умение отсутствует в каталоге');
 assert.equal(en.a,'Fire protection · Ice protection');
 assert.equal(en.b,'Ice protection · Skill not in catalog');
 assert.equal(ru.equal,false);
 assert.equal(en.equal,false);
 const title=key('ru','honorTitle');
 assert.equal(title.a,'Титул отсутствует в каталоге');
 assert.equal(title.b,'Титул отсутствует в каталоге');
 assert.equal(title.equal,false,'Two missing titles must remain distinguishable by identity');
 const rendered=[ru.a,ru.b,en.a,en.b,title.a,title.b].join(' ');
 for(const raw of ['310001','310002','310003','9001','9002'])
  assert.equal(rendered.includes(raw),false,'An internal ID leaked: '+raw);
 const same=comparison.matrixRows(left,structuredClone(left),options);
 assert.equal(same.find(x=>x.key==='resistanceSkills').equal,true);
 assert.equal(same.find(x=>x.key==='honorTitle').equal,true);
});

test('invalid resistance skill arrays do not silently discard corrupt identifiers',()=>{
 const invalid={attributeBuffs:{resistanceSkillIds:[310001,'not-an-id']}};
 const rows=comparison.matrixRows(invalid,first,{...opts,skillCatalog:{310001:{name:'Valid'}}});
 assert.equal(rows.find(x=>x.key==='resistanceSkills').a,'—');
});
