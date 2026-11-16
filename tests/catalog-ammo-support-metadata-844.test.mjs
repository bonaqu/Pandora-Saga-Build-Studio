import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const host={};
for(const path of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(path),{window:host});
const C=host.PandoraOSCalculator,S=host.PandoraCatalogSafety;
const json=n=>JSON.parse(read('data/os/'+n+'.json'));
const before={classes:json('classes'),tables:json('tables'),
 skills:json('skills'),items:json('items'),
 maps:json('maps'),monsters:json('monsters')};
const source=before.skills;
const ammoPreview=(catalog,job,weaponKind)=>{
 const caps=before.classes[job].branchCaps;
 return C.rangedAmmoPreview({skillCatalog:catalog,jobKey:job,level:55,
  branchCaps:caps,branchMasteries:caps,weaponKind});
};
const records=()=>{
 const rows=new Map();
 for(const [job] of Object.entries(before.classes))
  for(const weapon of ['BOW','CROSSBOW'])
   for(const row of ammoPreview(source,job,weapon).rows)
    if(!rows.has(row.id))rows.set(row.id,{...row,job,weapon});
 return [...rows.values()];
};
test('all six current-game ammunition sources preserve costs with unchanged count',()=>{
 const roots=records();
 assert.equal(roots.length,6);
 for(const row of roots){
  const old=source[String(row.id)];
  const next={...source,[String(row.id)]:{
   ...old,mana:old.mana+1,cooldown:old.cooldown+0.5
  }};
  const updated=ammoPreview(next,row.job,row.weapon).rows.find(x=>x.id===row.id);
  assert.ok(updated,'valid metadata update must retain '+old.name);
  assert.equal(updated.ammoCount,row.ammoCount);
  assert.equal(updated.mana,old.mana+1);
  assert.equal(updated.cooldown,old.cooldown+0.5);
  assert.equal(updated.sourceOnly,true);
  assert.equal(updated.finalDamage,null);
  assert.equal(updated.inventoryChecked,false);
  const result=S.compatibility(before,{...before,skills:next});
  assert.equal(result.entries[0].kind,'sourceOnly');
  assert.equal(result.entries[0].contract,'skill.source-parameters');
 }
});
test('child and parent metadata can change without breaking the pinned ammo root',()=>{
 const rootId='213603002',root=records().find(x=>String(x.id)===rootId);
 assert.ok(root);
 const parent='213603001',child='213603003';
 for(const linkedId of [parent,child]){
  const old=source[linkedId];
  const next={...source,[linkedId]:{
   ...old,mana:old.mana+1,cooldown:old.cooldown+1
  }};
  const result=ammoPreview(next,root.job,root.weapon);
  assert.ok(result.rows.some(x=>String(x.id)===rootId),
   'unchanged source effect link must survive linked cost metadata '+linkedId);
 }
});
test('unknown FV, direction, class and requirement changes still fail closed',()=>{
 const rows=records();
 for(const row of rows){
  const skill=source[String(row.id)];
  for(const fn of [
   s=>{s.funcs[0].fv1[3]+=1;},
   s=>{s.funcs[0].dir=s.funcs[0].dir==='TARGET'?'CASTER':'TARGET';},
   s=>{s.reqs=[{branch:'future',amount:999}];},
   s=>{s.classes.FUTURE=1;}
  ]){
   const after={...source,[String(row.id)]:structuredClone(skill)};
   fn(after[String(row.id)]);
   const p=ammoPreview(after,row.job,row.weapon);
   assert.equal(p.rows.find(x=>x.id===row.id),undefined);
   assert.ok(p.rejected.includes(row.id));
  }
 }
});
test('mass metadata replay retains all ammo/support source proofs, but remaining loss blocks D1',()=>{
 const saved=JSON.stringify(before);
 const after={...before,skills:structuredClone(before.skills)};
 for(const record of Object.values(after.skills))record.mana++;
 const replay=S.replaySkills(before,after);
 assert.equal(replay.ok,false,'unadapted independent models must still block');
 for(const group of ['source-ammunition','source-ammunition-action',
  'source-support-action','source-support-material'])
  assert.equal(replay.lostByModule[group]??0,0,group);
 assert.ok(replay.lost>0,'do not silence unrelated unsupported formulas');
 assert.equal(replay.lostEntries.length,replay.lost);
 assert.equal(JSON.stringify(before),saved);
 const wb=read('pandora-os-catalog-workbench.js');
 assert.match(wb,/if\(replay&&!replay\.ok\)throw Error/);
});
