import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../pandora-studio-build-comparison.js',import.meta.url),'utf8');
const window={};
Function('window',code)(window);
const compare=window.PandoraBuildComparison;

const start={
 race:0,job:0,gender:0,level:1,masteryAuto:true,
 racialPassiveId:444,
 equipment:{0:{id:900001}},
 souls:{0:[{id:800001}]},
 attributeBuffs:{proelium:false,proeliumPotency:0}
};
const changed={
 ...structuredClone(start),racialPassiveId:445,
 equipment:{0:{id:900002}},
 souls:{0:[{id:800002}]},
 attributeBuffs:{proelium:true,proeliumPotency:4}
};
const options={
 races:[['Человек','Human']],jobs:['Warrior'],
 slotLabels:['Оружие'],equipment:{},souls:{},
 skillCatalog:{444:{name:'Зоркость'}},
 englishSkills:{444:{n:'Keen Sight'}}
};
const row=(rows,id)=>rows.find(x=>x.key===id);

test('no missing equipment or Soul source exposes an internal catalog ID',()=>{
 const ru=compare.matrixRows(start,changed,{...options,lang:'ru'});
 const en=compare.matrixRows(start,changed,{...options,lang:'en'});
 assert.equal(row(ru,'gear.0').a,'Предмет отсутствует в каталоге');
 assert.equal(row(ru,'gear.0').b,'Предмет отсутствует в каталоге');
 assert.equal(row(ru,'soul.0.0').a,'Душа отсутствует в каталоге');
 assert.equal(row(ru,'soul.0.0').b,'Душа отсутствует в каталоге');
 assert.equal(row(en,'gear.0').a,'Item not in catalog');
 assert.equal(row(en,'soul.0.0').b,'Soul not in catalog');
 for(const rows of [ru,en]){
  const displayed=rows.map(x=>[x.a,x.b,x.label].join(' ')).join(' ');
  for(const id of ['900001','900002','800001','800002'])
   assert.equal(displayed.includes(id),false,'Unexpected visible internal ID '+id);
 }
});

test('different unknown IDs are still marked different in the A/B Differences-only view',()=>{
 const rows=compare.matrixRows(start,changed,{...options,lang:'ru'});
 assert.equal(row(rows,'gear.0').equal,false);
 assert.equal(row(rows,'soul.0.0').equal,false);
 assert.equal(row(rows,'racialPassiveId').equal,false);
 assert.ok(rows.filter(x=>!x.equal).some(x=>x.key==='gear.0'));
 const one=structuredClone(start);
 one.equipment[0]={id:900001};
 const equal=compare.matrixRows(start,one,options);
 assert.equal(row(equal,'gear.0').equal,true);
 assert.equal(row(equal,'soul.0.0').equal,true);
 assert.equal(row(equal,'racialPassiveId').equal,true);
});

test('two distinct equipment records with identical published names stay different',()=>{
 const a={...start,equipment:{0:{id:1}}};
 const b={...start,equipment:{0:{id:2}}};
 const rows=compare.matrixRows(a,b,{
  ...options,equipment:{1:{name:'Сапфировый клинок'},2:{name:'Сапфировый клинок'}}
 });
 assert.equal(row(rows,'gear.0').a,'Сапфировый клинок');
 assert.equal(row(rows,'gear.0').b,'Сапфировый клинок');
 assert.equal(row(rows,'gear.0').equal,false);
});

test('racial passive uses documented English game name without guessing translations',()=>{
 const ru=compare.matrixRows(start,changed,{...options,lang:'ru'});
 const en=compare.matrixRows(start,changed,{...options,lang:'en'});
 assert.equal(row(ru,'racialPassiveId').a,'Зоркость');
 assert.equal(row(en,'racialPassiveId').a,'Keen Sight');
 assert.equal(row(en,'racialPassiveId').b,'Racial passive unavailable');
 assert.equal(row(ru,'racialPassiveId').b,'Расовая пассивка не найдена');
 assert.equal(row(en,'racialPassiveId').equal,false);
 const copy=structuredClone(start);copy.racialPassiveId=445;
 assert.equal(row(compare.matrixRows(copy,copy,{...options,lang:'en'}),'racialPassiveId').equal,true);
});

test('legacy saved enhancement flags remain comparable but retired naming stays hidden',()=>{
 const before=JSON.stringify(start),after=JSON.stringify(changed);
 const ru=compare.describe(start,changed,{lang:'ru'});
 const en=compare.describe(start,changed,{lang:'en'});
 assert.ok(ru.some(x=>x.startsWith('Прочее усиление: ')));
 assert.ok(ru.some(x=>x.startsWith('Сила прочего усиления: ')));
 assert.ok(en.some(x=>x.startsWith('Other enhancement: ')));
 assert.ok(en.some(x=>x.startsWith('Other enhancement strength: ')));
 assert.equal(ru.some(x=>/Проэлиум/i.test(x)),false);
 assert.equal(en.some(x=>/Proelium/i.test(x)),false);
 assert.equal(JSON.stringify(start),before);
 assert.equal(JSON.stringify(changed),after);
});

test('compact A/B reads localized Hero Book results, not internal skill IDs',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 assert.match(app,/PandoraBuildComparison\.compactResults\(/);
 assert.match(app,/PandoraStageAttributes\.summaryRows\(calcA\)/);
 assert.doesNotMatch(code,/['"]Проэлиум['"]/);
});

test('comparison uses visible results without exposing historical allocation key labels',()=>{
 const app=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
 const begin=app.indexOf('function renderBuildComparison(');
 const end=app.indexOf('function restoreLoadedBuildUI(){',begin);
 assert.ok(begin>=0&&end>begin);
 const view=app.slice(begin,end);
 assert.match(view,/PandoraStageAttributes\.summaryRows\(calcB\)/);
 assert.doesNotMatch(view,/statLabels:|Ловкость','Agility|Сноровка','Dexterity/);
 assert.match(app,/ORIGIN_STAT_LABELS/);
});

test('legacy short comparison never prints unknown honor-title IDs',()=>{
 const before={attributeBuffs:{honorTitle:999}};
 const after={attributeBuffs:{honorTitle:998}};
 for(const lang of ['ru','en']){
  const messages=compare.describe(before,after,{lang,honorTitles:[]});
  assert.equal(messages.length,1);
  assert.equal(messages[0].includes('999'),false);
  assert.equal(messages[0].includes('998'),false);
  assert.match(messages[0],lang==='ru'?/Титул отсутствует в каталоге/:/Honor title unavailable/);
 }
});
