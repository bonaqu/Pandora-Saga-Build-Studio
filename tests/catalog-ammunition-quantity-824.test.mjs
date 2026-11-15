import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
for(const file of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(file),{window:host});
const C=host.PandoraOSCalculator,S=host.PandoraCatalogSafety;
const json=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:json('skills'),classes:json('classes'),tables:json('tables'),
 items:json('items')};
const ids=[213603002,213608001,213700501,213602001,213603501,213701001];
const weapons=['BOW','CROSSBOW'];
const inspect=(catalog,job,weapon)=>C.rangedAmmoPreview({
 skillCatalog:catalog,jobKey:job,level:55,
 branchCaps:before.classes[job].branchCaps,
 branchMasteries:before.classes[job].branchCaps,weaponKind:weapon
});
const owner=id=>{
 for(const job of Object.keys(before.classes))
  for(const weapon of weapons)
   if(inspect(before.skills,job,weapon).rows.some(row=>
    row.id===id&&row.requirementsMet))return {job,weapon};
 return null;
};
const mutate=(id,change)=>{
 const next={...before,skills:{...before.skills}};
 next.skills[id]=structuredClone(before.skills[id]);
 change(next.skills[id]);
 return next;
};
const ammo=skill=>skill.funcs.find(f=>f.ep==='EP_CONSUME_AMMO');

test('six signed bow/crossbow roots accept data-only ammo counts via the current calculator',()=>{
 const initial=JSON.stringify(before);
 for(const id of ids){
  const selected=owner(id);
  assert.ok(selected,'source owner for '+id);
  const oldCount=ammo(before.skills[id]).fv2[3];
  const updated=mutate(id,row=>{ammo(row).fv2[3]=oldCount+2;});
  const a=inspect(before.skills,selected.job,selected.weapon).rows.find(x=>x.id===id);
  const b=inspect(updated.skills,selected.job,selected.weapon).rows.find(x=>x.id===id);
  assert.equal(a.ammoCount,oldCount);
  assert.equal(b.ammoCount,oldCount+2);
  assert.equal(b.finalDamage,null);
  assert.equal(b.inventoryChecked,false);
  assert.equal(b.sourceOnly,true);
  const result=S.compatibility(before,updated);
  assert.equal(result.totals.verified,1,'known source count is data-only '+id);
  assert.equal(result.totals.needsReview,0);
  const replay=S.replaySkills(before,updated);
  assert.equal(replay.ok,true,'retains current inspector proof '+id);
  assert.equal(replay.lost,0);
 }
 assert.equal(JSON.stringify(before),initial,'both proof and snapshot read-only');
});

test('unknown ammunition mechanics and invalid FV shapes never get the verified label',()=>{
 const id=213602001,selected=owner(id);
 assert.ok(selected);
 for(const change of [
  row=>{ammo(row).fv2[3]=0;},
  row=>{ammo(row).fv2[3]=-1;},
  row=>{ammo(row).fv2[3]=1.5;},
  row=>{ammo(row).fv2[2]=17;},
  row=>{ammo(row).dir='TARGET';},
  row=>{ammo(row).ep='EP_FUTURE_AMMO';},
  row=>{ammo(row).fv1[3]=42;},
  row=>{ammo(row).futureParam=15;},
  row=>{row.funcs.push({ep:'EP_FUTURE',dir:'CASTER',fv1:[0,0,0,0],fv2:[0,0,0,1]});}
 ]){
  const updated=mutate(id,change);
  assert.equal(S.compatibility(before,updated).totals.needsReview,1);
  const result=inspect(updated.skills,selected.job,selected.weapon);
  assert.equal(result.rows.some(x=>x.id===id),false);
  assert.ok(result.rejected.includes(id));
  const replay=S.replaySkills(before,updated);
  assert.equal(replay.ok,false,'lost signed ammunition requires blocking pre-D1');
  assert.ok(replay.samples.some(x=>x.id===String(id)&&
   (x.module==='source-ammunition'||x.module==='source-ammunition-action')));
 }
});

test('source-only quantity does not overwrite independent gameplay changes',()=>{
 const id=213701001,selected=owner(id);
 assert.ok(selected);
 const updated=mutate(id,row=>{
  ammo(row).fv2[3]+=1;
  row.cooldown+=1;
 });
 assert.equal(S.compatibility(before,updated).totals.needsReview,1);
 assert.equal(inspect(updated.skills,selected.job,selected.weapon)
  .rows.some(x=>x.id===id),false);
});

test('multi-shot note stays accurate after changing the source quantity',()=>{
 const id=213701001,selected=owner(id);
 assert.ok(selected);
 const updated=mutate(id,row=>{ammo(row).fv2[3]=8;});
 const line=inspect(updated.skills,selected.job,selected.weapon)
  .rows.find(x=>x.id===id);
 assert.equal(line.ammoCount,8);
 assert.ok(!line.noteRu.includes('пять'));
 assert.ok(!line.noteEn.includes('five'));
 assert.equal(line.finalDamage,null);
});
