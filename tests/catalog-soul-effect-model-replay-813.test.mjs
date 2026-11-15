import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const path of ['pandora-os-character-calculator.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(path),{window:root});
const C=root.PandoraOSCalculator;
const S=root.PandoraCatalogSafety;
const load=name=>JSON.parse(read('data/os/'+name+'.json'));
const original={items:load('items'),souls:load('souls'),itemForth:load('itemForth'),
 tables:load('tables'),classes:load('classes')};
const newSoul=(id,mutate)=>{
 const result={...original,souls:{...original.souls}};
 result.souls[id]=structuredClone(original.souls[id]);
 mutate(result.souls[id]);
 return result;
};
const newForth=(id,mutate)=>{
 const result={...original,itemForth:{...original.itemForth}};
 result.itemForth[id]=structuredClone(original.itemForth[id]);
 mutate(result.itemForth[id]);
 return result;
};
function equipmentPreview(data,gradedSoul=101000){
 const r=data.items['1'],body=data.items['12001'],s=data.souls[String(gradedSoul)];
 return C.base({classData:data.classes.WARRIOR,
  raceData:data.tables.raceInit.HUMAN,jobData:data.tables.jobInit.WARRIOR,
  level:45,allocation:{},records:[
   ['item:1',r,5],['item:12001',body,5],
   ['soul:'+gradedSoul,s,5]
  ],itemForth:data.itemForth,
  combatContext:{jobKey:'WARRIOR',weapon:r,weaponGrade:5,
   weaponPlus:data.tables.weaponPlus}});
}

test('the real multi-piece hero model incorporates source-backed Soul accuracy changes',()=>{
 const next=newSoul('101000',s=>{s.effects[0].a=10});
 const oldResult=equipmentPreview(original),nowResult=equipmentPreview(next);
 assert.ok(Number.isFinite(oldResult.hp)&&Number.isFinite(oldResult.mp));
 assert.ok(Number.isFinite(oldResult.combat.attack.known));
 assert.ok(Number.isFinite(oldResult.combat.defense.known));
 assert.equal(nowResult.combat.accuracy.known-oldResult.combat.accuracy.known,2);
 assert.equal(nowResult.hp,oldResult.hp);
 assert.equal(S.compatibility(original,next).totals.verified,1,
  'the effect channel is already consumed by the existing calculator');
 const report=S.replayEquipmentEffects(original,next);
 assert.equal(report.ok,true);
 assert.equal(report.changedSources,1);
 assert.equal(report.lost,0);
 assert.ok(report.retained>0);
});
test('known attack-amount Soul changes are modeled with a real equipped weapon',()=>{
 const next=newSoul('101003',s=>{s.effects[0].a=9});
 const prior=equipmentPreview(original,101003),after=equipmentPreview(next,101003);
 assert.equal(after.combat.attack.known-prior.combat.attack.known,3);
 assert.equal(S.compatibility(original,next).totals.verified,1);
 assert.equal(S.replayEquipmentEffects(original,next).ok,true);
});
test('replacing a known numeric Soul EP with unknown code blocks prepublish',()=>{
 const next=newSoul('101000',s=>{
  s.effects[0].func='EP_UNKNOWN_NEW_ACCURACY';
  s.effects[0].a=25;
 });
 const report=S.replayEquipmentEffects(original,next);
 assert.equal(report.ok,false);
 assert.ok(report.lost>0);
 assert.ok(report.samples.some(e=>e.key==='soul:101000'));
 assert.ok(report.samples.some(e=>e.previous==='EP_TOHIT_CONST'));
 assert.ok(report.samples.some(e=>e.next==='EP_UNKNOWN_NEW_ACCURACY'));
 assert.equal(S.compatibility(original,next).requiresMechanicReview,true);
});
test('removing a known Soul bonus explicitly is reviewable, not an unsupported replacement',()=>{
 const next=newSoul('101000',s=>{s.effects=[]});
 const report=S.replayEquipmentEffects(original,next);
 assert.equal(report.lost,0);
 assert.equal(report.ok,true);
 assert.equal(S.compatibility(original,next).totals.needsReview,1);
});
test('numeric bonus with changed grade gates or meaning is not auto-verified',()=>{
 const next=newSoul('101000',s=>{s.effects[0].min=6;s.effects[0].a=10});
 assert.equal(S.compatibility(original,next).totals.verified,0);
 assert.equal(S.compatibility(original,next).totals.needsReview,1);
});
test('new unknown Soul code does not receive fabricated numbers',()=>{
 const next={...original,souls:{...original.souls}};
 next.souls['999999']={id:999999,name:'Unknown',slots:['weapon'],
  effects:[{func:'EP_NEW_UNVERIFIED',dir:'SELF',a:77,b:0,min:0,max:10}]};
 assert.equal(S.compatibility(original,next).totals.needsReview,1);
 assert.equal(S.replayEquipmentEffects(original,next).lost,0);
});
test('Forth replacement of a known accuracy EP by an unknown EP blocks D1',()=>{
 const numeric=original.itemForth['242']['2'];
 assert.ok(numeric.some(e=>e.func==='EP_TOHIT_CONST'));
 const next=newForth('242',forth=>{
  forth['2'][0].func='EP_UNKNOWN_GRADE_EFFECT';
  forth['2'][0].a=12;
 });
 const report=S.replayEquipmentEffects(original,next);
 assert.ok(report.lost>0);
 assert.ok(report.samples.some(row=>row.key==='item:242'));
 assert.equal(S.compatibility(original,next).requiresMechanicReview,true);
});
test('duplicate numeric EP cannot mask replacement of its second instance',()=>{
 const item={id:99776,name:'Two same numeric sources',slot:'weapon',
  kind:'1H_SWORD',W:30,effects:[
   {func:'EP_TOHIT_CONST',dir:'TARGET',a:2},
   {func:'EP_TOHIT_CONST',dir:'TARGET',a:5}
  ]};
 const before={items:{'99776':item},itemForth:{}};
 const after=structuredClone(before);
 after.items['99776'].effects[1]={func:'EP_UNKNOWN_REPLACEMENT',
  dir:'TARGET',a:8};
 const report=S.replayEquipmentEffects(before,after);
 assert.equal(report.ok,false);
 assert.ok(report.lost>0,'one still-supported EP must not mask lost second EP');
 assert.ok(report.samples.some(x=>x.previous==='EP_TOHIT_CONST'));
});

test('unmodified source and all known effects skip unnecessary compute',()=>{
 const report=S.replayEquipmentEffects(original,original);
 assert.equal(report.ok,true);
 assert.equal(report.changedSources,0);
 assert.equal(report.scenarios,0);
});
test('the D1 prepublish UI executes this check twice on selected snapshots',()=>{
 const workbench=read('pandora-os-catalog-workbench.js');
 assert.match(workbench,/safety\.replayEquipmentEffects\(baseline,selected\)/);
 assert.match(workbench,/safety\.replayEquipmentEffects\(baseline,combined\)/);
 assert.match(workbench,/validation\.issues\.push\(\.\.\.equipment\.errors\)/);
 assert.match(workbench,/if\(equipment&&!equipment\.ok\)throw Error/);
 assert.match(workbench,/publish\.disabled=!ready\|\|!acknowledged\|\|preview\?\.validation\?\.ok!==true/);
});
test('model replay does not change pinned source data or selected snapshot',()=>{
 const next=newSoul('101000',s=>{s.effects[0].a=10});
 const old=JSON.stringify(original),fresh=JSON.stringify(next);
 S.compatibility(original,next);
 S.replayEquipmentEffects(original,next);
 assert.equal(JSON.stringify(original),old);
 assert.equal(JSON.stringify(next),fresh);
});
