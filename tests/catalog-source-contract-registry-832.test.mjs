import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
for(const script of [
 'pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'
])vm.runInNewContext(read(script),{window:host});
const safety=host.PandoraCatalogSafety;
const original=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:original('skills'),items:original('items'),
 classes:original('classes'),tables:original('tables')};
const snapshot=(id,edit)=>{
 const next={...before,skills:{...before.skills}};
 next.skills[id]=structuredClone(before.skills[id]);
 edit(next.skills[id]);return next;
};
const quantity=(skill,ep)=>skill.funcs.find(row=>row.ep===ep);

test('one declared registry contains thirteen stable distinct data-only contracts',()=>{
 const contracts=safety.sourceContractRegistry;
 assert.ok(Array.isArray(contracts));
 assert.equal(Object.isFrozen(contracts),true);
 assert.equal(contracts.length,13);
 assert.equal(new Set(contracts.map(x=>x.id)).size,13);
 assert.deepEqual([...new Set(contracts.map(x=>x.kind))].sort(),
  ['sourceOnly','verified']);
 for(const contract of contracts){
  assert.equal(Object.isFrozen(contract),true);
  assert.match(contract.id,/^(skill|equipment|class|table)\./);
  assert.ok(contract.dataset&&typeof contract.dataset==='string');
 }
 assert.equal(contracts.filter(x=>x.kind==='sourceOnly').length,2);
});

test('43 resource-count updates retain strict old/new proof with an explicit source contract ID',()=>{
 const targets=new Map();
 for(const [id,record] of Object.entries(before.skills)){
  const indices=(record.funcs||[]).flatMap((x,index)=>
   ['EP_CONSUME_ITEM','EP_CONSUME_AMMO'].includes(x.ep)?[index]:[]);
  if(indices.length)targets.set(id,indices);
 }
 assert.equal(targets.size,43);
 const next={...before,skills:{...before.skills}};
 for(const [id,indices] of targets){
  const skill=structuredClone(before.skills[id]);
  for(const index of indices)skill.funcs[index].fv2[3]+=2;
  next.skills[id]=skill;
 }
 const originalJSON=JSON.stringify(before),candidateJSON=JSON.stringify(next);
 const audit=safety.compatibility(before,next),registry=safety.sourceContractRegistry;
 assert.equal(audit.entries.length,43);
 assert.equal(audit.totals.needsReview,0);
 assert.ok(audit.totals.verified>0);
 assert.ok(audit.totals.sourceOnly>0);
 for(const row of audit.entries){
  const contract=registry.find(x=>x.id===row.contract);
  assert.ok(contract,'every recognized source change has auditable provenance '+row.key);
  assert.equal(row.kind,contract.kind);
 }
 assert.equal(safety.sourceGraphIntegrity(before,next).ok,true);
 assert.equal(JSON.stringify(before),originalJSON);
 assert.equal(JSON.stringify(next),candidateJSON);
});

test('unmodeled archery ammunition is explicitly sourceOnly, never verified damage',()=>{
 const next=snapshot('213601001',skill=>{
  quantity(skill,'EP_CONSUME_AMMO').fv2[3]=7;
 });
 const report=safety.compatibility(before,next);
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(report.totals.verified,0);
 assert.equal(report.entries[0].contract,'skill.source-resource');
 assert.match(report.entries[0].title,/эффект навыка не рассчитан/);
});

test('unknown skill EP and cast timing never borrow another source contract',()=>{
 const next=snapshot('213601001',skill=>{
  skill.funcs.push({ep:'EP_FUTURE_UNMODELED',dir:'TARGET',
   fv1:[0,0,0,1],fv2:[0,0,0,99]});
 });
 const report=safety.compatibility(before,next);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.entries[0].contract,undefined);
 const cast=snapshot('213601001',skill=>{skill.cast+=1;});
 const check=safety.compatibility(before,cast);
 assert.equal(check.totals.needsReview,1);
 assert.equal(check.entries[0].contract,undefined);
});

test('unverified equipment effect must remain needsReview; text-only changes have no contract',()=>{
 const next={...before,items:{...before.items}};
 next.items['1']=structuredClone(before.items['1']);
 next.items['1'].effects.push({func:'EP_UNKNOWN_999',dir:'TARGET',a:25,b:0});
 const unknown=safety.compatibility(before,next);
 assert.equal(unknown.totals.needsReview,1);
 assert.equal(unknown.entries[0].contract,undefined);
 const renamed={...before,items:{...before.items}};
 renamed.items['1']={...before.items['1'],name:before.items['1'].name+' •'};
 const status=safety.compatibility(before,renamed);
 assert.equal(status.totals.sourceOnly,1);
 assert.equal(status.entries[0].contract,undefined);
});

test('the registry does not replace independent whole-snapshot pre-D1 controls',()=>{
 const wb=read('pandora-os-catalog-workbench.js');
 for(const proof of [
 'safety.compatibility(baseline,combined)',
 'safety.replaySkills(baseline,combined)',
 'safety.replayEquipmentEffects(baseline,combined)',
 'safety.sourceGraphIntegrity(baseline,combined)'
 ])assert.ok(wb.includes(proof),'required '+proof);
 assert.match(read('pandora-studio-catalog-safety.js'),/sourceContractRegistry:SOURCE_CONTRACT_REGISTRY/);
});
