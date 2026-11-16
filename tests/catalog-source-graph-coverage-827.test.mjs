import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};vm.runInNewContext(read('pandora-studio-catalog-safety.js'),{window:host});
const safety=host.PandoraCatalogSafety;
const json=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:json('skills'),items:json('items'),
 classes:json('classes'),tables:json('tables'),
 maps:json('maps'),monsters:json('monsters')};
function edit(section,id,mutate){
 const after={...before,[section]:{...before[section]}};
 after[section][id]=structuredClone(before[section][id]);
 mutate(after[section][id]);return after;
}
function missingLink(section,id,mutate,kind,field){
 const after=edit(section,id,mutate);
 const snapshot=JSON.stringify(before),candidate=JSON.stringify(after);
 const report=safety.sourceGraphIntegrity(before,after);
 assert.equal(report.ok,false,'must reject new dangling '+section+'/'+id);
 assert.ok(report.newBroken>0,'missing source reference is actionable');
 assert.ok(report.samples.some(x=>x.kind===kind&&x.field===field));
 assert.equal(JSON.stringify(before),snapshot);
 assert.equal(JSON.stringify(after),candidate);
 return report;
}

test('full current-source graph is readable with grandfathered zero-ID placeholders only',()=>{
 const original=JSON.stringify(before);
 const report=safety.sourceGraphIntegrity(before,before);
 assert.equal(report.ok,true);
 assert.equal(report.historical,4,'two zero prerequisites and two zero action placeholders are known');
 assert.equal(report.newBroken,0);
 assert.ok(report.inspected>5000,'all skill classes and internal actions were inspected');
 assert.equal(JSON.stringify(before),original);
});

test('legacy zero-action placeholders are exempt only while source gameplay data is unchanged',()=>{
 const key='620002061';
 assert.ok(before.skills[key].funcs.some(x=>x.ep==='EP_SKILL_EXEC'&&x.fv1[3]===0));
 const renamed=edit('skills',key,s=>{s.name+=' •';});
 assert.equal(safety.sourceGraphIntegrity(before,renamed).ok,true,
  'source labels may be translated without changing model trust');
 const changed=edit('skills',key,s=>{s.cooldown=(s.cooldown||0)+1;});
 const audit=safety.sourceGraphIntegrity(before,changed);
 assert.equal(audit.ok,false,'a modified source cannot reuse legacy malformed source proof');
 assert.ok(audit.samples.some(x=>x.owner===key&&x.field==='EP_SKILL_EXEC'));
});

test('new and changed classless execution links are blocked even without an old numeric proof',()=>{
 const newId=999997901;
 const after={...before,skills:{...before.skills,[newId]:{
  id:newId,name:'Unmodeled future source',learnable:false,
  prereq:null,classes:{},funcs:[
   {ep:'EP_SKILL_EXEC',dir:'TARGET',fv1:[0,0,0,999997902],
    fv2:[0,0,0,0]}]
 }}};
 const graph=safety.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,false);
 assert.ok(graph.samples.some(x=>x.owner===String(newId)&&
  x.field==='EP_SKILL_EXEC'));
 assert.equal(safety.compatibility(before,after).totals.needsReview,1);
 missingLink('skills','240005001',s=>{s.funcs[1].fv1[3]=999997902;},
  'skill','EP_SKILL_EXEC');
});

test('historical zero placeholders are not a permit to add more broken links',()=>{
 missingLink('skills','240005001',s=>{s.funcs[1].fv1[3]=0;},
  'skill','EP_SKILL_EXEC');
});

test('cyclic source actions are rejected even when every target ID exists',()=>{
 const id='240005001',original=before.skills[id];
 const after=edit('skills',id,s=>{s.funcs[1].fv1[3]=s.id;});
 const report=safety.sourceGraphIntegrity(before,after);
 assert.equal(report.ok,false,'self-recursive skill is not a valid execution chain');
 assert.ok(report.samples.some(x=>x.field==='execution-cycle'&&x.owner===id));
 assert.equal(original.funcs[1].fv1[3],240005002,'baseline untouched');
 const next={...before,skills:{...before.skills}};
 const x=999997911,y=999997912;
 next.skills[String(x)]={id:x,learnable:false,prereq:null,classes:{},
  funcs:[{ep:'EP_SKILL_EXEC',dir:'TARGET',fv1:[0,0,0,y],fv2:[0,0,0,0]}]};
 next.skills[String(y)]={id:y,learnable:false,prereq:null,classes:{},
  funcs:[{ep:'EP_SKILL_EXEC',dir:'TARGET',fv1:[0,0,0,x],fv2:[0,0,0,0]}]};
 const cycle=safety.sourceGraphIntegrity(before,next);
 assert.equal(cycle.ok,false,'two new linked skills cannot call one another indefinitely');
 assert.ok(cycle.samples.some(row=>row.field==='execution-cycle'));
});

test('new broken class and prerequisite references are detected before D1',()=>{
 missingLink('skills','240005001',s=>{s.prereq=999999992;},
  'skill','prereq');
 missingLink('skills','240005001',s=>{s.classes.FUTURE_JOB=1;},
  'skill','class');
 const after={...before,classes:{...before.classes}};
 delete after.classes.WARRIOR;
 const report=safety.sourceGraphIntegrity(before,after);
 assert.equal(report.ok,false,'removing a class still referenced by skills is unsafe');
 assert.ok(report.samples.some(x=>x.field==='class'&&x.target==='WARRIOR'));
});

test('skill material references validate ID and amount across different catalogs',()=>{
 missingLink('skills','240005001',s=>{s.funcs[0].fv1[3]=999997903;},
  'skill','EP_CONSUME_ITEM');
 missingLink('skills','240005001',s=>{s.funcs[0].fv2[3]=0;},
  'skill','EP_CONSUME_ITEM.quantity');
 const next={...before,items:{...before.items}};
 delete next.items['65007'];
 const result=safety.sourceGraphIntegrity(before,next);
 assert.equal(result.ok,false);
 assert.ok(result.newBroken>=5,'all existing trap consumers must report missing item');
});

test('item-triggered skill links validate both normal and balm actions',()=>{
 missingLink('items','50014',item=>{item.effects[0].a=999997904;},
  'item','EP_SKILL_EXEC');
 missingLink('items','50017',item=>{item.effects[0].a=999997905;},
  'item','EP_SKILL_EXEC_BALM');
});

test('six source-backed trap material changes stay valid as a single read-only candidate',()=>{
 const changes=['240001001','240002001','240005001',
  '240008001','240010001','240002002'];
 const after={...before,skills:{...before.skills}};
 for(const id of changes){
  after.skills[id]=structuredClone(before.skills[id]);
  after.skills[id].funcs[0].fv2[3]+=2;
 }
 const saved=JSON.stringify(after);
 const graph=safety.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,true);
 assert.equal(graph.newBroken,0);
 assert.equal(graph.unresolved,graph.historical);
 assert.equal(JSON.stringify(after),saved,'preflight must not alter staged candidate');
});

test('unknown gameplay EP stays an explicit needsReview, not a verified formula',()=>{
 const after=edit('skills','240005001',s=>{s.funcs.push({
  ep:'EP_FUTURE_NOT_MODELED',dir:'TARGET',fv1:[0,0,0,40],fv2:[0,0,0,0]});});
 const graph=safety.sourceGraphIntegrity(before,after);
 assert.equal(graph.ok,true,'reference audit is not a substitute for effect semantics');
 const report=safety.compatibility(before,after);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.totals.verified,0);
 assert.equal(report.entries[0].kind,'needsReview');
});

test('complete coverage preserves all twelve source entries; samples only cap visual warnings',()=>{
 const after={...before,skills:{...before.skills}};
 for(const id of Object.keys(before.skills).slice(0,12)){
  after.skills[id]={...before.skills[id],name:before.skills[id].name+' •'};
 }
 const original=JSON.stringify(before),next=JSON.stringify(after);
 const report=safety.compatibility(before,after);
 assert.equal(report.totals.sourceOnly,12);
 assert.equal(report.entries.length,12,'no silent truncation after six entries');
 assert.equal(report.samples.sourceOnly.length,6,'small warning summary retained');
 assert.ok(Object.keys(after.skills).slice(0,12).every(id=>
  report.entries.some(row=>row.key==='skill:'+id&&row.kind==='sourceOnly')));
 assert.equal(JSON.stringify(before),original);
 assert.equal(JSON.stringify(after),next);
});

test('per-record status covers monster/drop/map entries and English translations',()=>{
 const old={
  monsters:{'1':{id:1,name:'A'},'2':{id:2,name:'B'}},
  drops:{'1':{id:1,rate:1},'2':{id:2,rate:2}},
  maps:{'1':{id:1,name:'Map'}},
  'strings.en':{locale:'en',items:{'1':{n:'Old'}},skills:{'4':{n:'Old'}}}
 };
 const next=structuredClone(old);
 next.monsters['1'].name='A2';next.monsters['2'].name='B2';
 next.drops['1'].rate=3;next.drops['2'].rate=4;
 next.maps['1'].name='Map II';
 next['strings.en'].items['1'].n='New';
 next['strings.en'].skills['4'].n='New';
 const report=safety.compatibility(old,next);
 assert.equal(report.totals.sourceOnly,7);
 assert.equal(report.entries.length,7);
 for(const key of ['monsters:1','monsters:2','drops:1','drops:2',
  'maps:1','strings.en:items/1','strings.en:skills/4'])
  assert.ok(report.entries.some(row=>row.key===key),'per-record '+key);
 assert.equal(report.totals.verified,0,
  'source text/chance must not be mislabeled as measured hero damage');
});

test('new unrecognized dataset needs a model review, not blanket source approval',()=>{
 const old={futureEffects:{x:{value:1}}};
 const next={futureEffects:{x:{value:5}}};
 const result=safety.compatibility(old,next);
 assert.equal(result.totals.needsReview,1);
 assert.equal(result.totals.sourceOnly,0);
});

test('owner review, preview and final publish use the same link graph and full semantic entries',()=>{
 const wb=read('pandora-os-catalog-workbench.js');
 assert.match(wb,/safety\.sourceGraphIntegrity\(baseline,selected\)/);
 assert.match(wb,/safety\.sourceGraphIntegrity\(baseline,combined\)/);
 assert.match(wb,/const graph=typeof safety\.sourceGraphIntegrity/);
 assert.match(wb,/selectedMechanicStatus\(change\)/);
 assert.match(wb,/Проверка выбранного каталога/);
 assert.match(wb,/повреждённых новых ссылок/);
 assert.match(wb,/const coverageSummary=h\('p'/);
 assert.match(wb,/return \{combined,normalized,compatibility,replay,equipment,graph\}/);
 assert.match(read('pandora-studio-catalog-safety.js'),/entries,requiresMechanicReview/);
});
