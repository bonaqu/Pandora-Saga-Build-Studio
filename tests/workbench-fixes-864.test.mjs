import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-skill-progression.js'))(host);
Function('window','document',read('pandora-studio-hero-path.js'))(host,{});
Function('window',read('pandora-studio-honor-guide.js'))(host);
const future=host.PandoraHeroPath.futureSkillReachable;
const skill=(id,reqs=[],more={})=>({
 id,name:'Test '+id,classes:{ARCHER:1},charLevel:1,learnable:true,
 reqs,reqLevel:0,...more
});
const api=(skills=[],other={})=>{
 const branchCaps={archery:55,assassin:35,defense:0,
  martial:0,slash:40,thrust:40,brush:40,blow:40};
 return {lang:'ru',job:'ARCHER',state:{level:1,points:{}},innate:{archery:3},
  branchCaps,skillCatalog:skills,maxLevel:55,maxSkillPoints:104,
  cap:key=>branchCaps[key]??0,branchName:key=>key,...other};
};
test('future gallery includes skills locked now but reachable with valid branch training',()=>{
 const s=skill(1,[{branch:'archery',amount:45}],{charLevel:50});
 const ctx=api([s]);
 assert.equal(future(s,ctx),true);
 assert.equal(host.PandoraHeroPath.readiness(s,ctx).learned,false);
});
test('future gallery excludes impossible class, cap, source method and level requirements',()=>{
 const classes=skill(2,[],{classes:{CLERIC:1}});
 const cap=skill(3,[{branch:'archery',amount:56}]);
 const disabled=skill(4,[],{learnable:false});
 const level=skill(5,[],{charLevel:56});
 const unknown=skill(6,[],{reqLevel:3});
 for(const s of [classes,cap,disabled,level,unknown])
  assert.equal(future(s,api([s])),false,s.name);
});
test('future gallery checks whole prerequisite chain, cycles and maximum skill budget',()=>{
 const prior=skill(11,[{branch:'defense',amount:5}]);
 const next=skill(12,[],{prereq:11});
 assert.equal(future(next,api([prior,next])),false);
 const first=skill(21,[],{prereq:22});
 const last=skill(22,[],{prereq:21});
 assert.equal(future(first,api([first,last])),false);
 const costly=skill(30,[{branch:'archery',amount:55},{branch:'assassin',amount:35}]);
 assert.equal(future(costly,api([costly],{maxSkillPoints:70})),false);
 assert.equal(future(costly,api([costly],{maxSkillPoints:104})),true);
});
test('martial group above 90 is not incorrectly hidden when class has adequate grouped cap',()=>{
 const s=skill(41,[{branch:'martial',amount:100}],{
  branch:'martial',branchRaw:'MELEE',reqLevel:100});
 assert.equal(future(s,api([s],{maxSkillPoints:130})),true);
});
test('build overwrite preserves active record and guest draft has distinct save copy',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/const savedCurrent=builds\.find\(b=>b\.id===activeBuildId\)\|\|null/);
 assert.match(app,/saveBuild\(state\.name\|\|currentName,savedCurrent\?\.id\|\|null\)/);
 assert.match(app,/Сохранить новый и открыть/);
 assert.match(app,/Открытие билда «/);
 assert.doesNotMatch(app,/Создадим новую копию билда/);
});
test('D1 authoring covers all three workbench sections and per-tab help',()=>{
 const app=read('pandora-studio-app.js'),equip=read('pandora-studio-equipment-ui.js');
 for(const section of ['origin','equipment','path']){
  assert.match(app,new RegExp("'"+section+"','hint"));
 }
 assert.match(app,/renderWorkbenchHintEditors\(\)/);
 assert.match(app,/ownerInterfaceEditor\(section,rows,ru,en\)/);
 assert.match(app,/ownerCopy\(section,key,ru,en\)/);
 assert.match(equip,/copy\('hint\.'\+key,\.\.\.hints\[key\]\)/);
 for(const key of ['book.origin.hint-race','book.equipment.hint.choose','book.path.hint-skills'])
  assert.equal(host.PandoraHonorGuide.validOverride(key,JSON.stringify({ru:'Подсказка',en:'Hint'})),true);
});
test('slot indicators and chapter use unambiguous labels',()=>{
 const css=read('pandora-studio-workbench-guidance.css');
 const labels=read('pandora-studio-wiki-labels.js'),app=read('pandora-studio-app.js');
 assert.match(css,/data-stage-tab="choose"\]::before\{content:"⇄"/);
 assert.match(css,/data-stage-tab="souls"\]::before\{content:"○"/);
 assert.match(labels,/skill:\['Умения','Skills'\]/);
 assert.match(app,/text:Math\.min\(report\.count,cap\)\+'\/'\+cap/);
});
